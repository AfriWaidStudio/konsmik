CREATE TABLE IF NOT EXISTS public.dating_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT true,
  birthdate date,
  age int,
  gender text NOT NULL DEFAULT 'other',
  interested_in text[] NOT NULL DEFAULT ARRAY['everyone']::text[],
  bio text,
  photos text[] NOT NULL DEFAULT ARRAY[]::text[],
  location text,
  looking_for text NOT NULL DEFAULT 'connection',
  interests text[] NOT NULL DEFAULT ARRAY[]::text[],
  min_age int NOT NULL DEFAULT 18,
  max_age int NOT NULL DEFAULT 60,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dating_profiles TO authenticated;
GRANT ALL ON public.dating_profiles TO service_role;
ALTER TABLE public.dating_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dating_profiles_select" ON public.dating_profiles FOR SELECT TO authenticated USING (active OR user_id = auth.uid());
CREATE POLICY "dating_profiles_insert" ON public.dating_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "dating_profiles_update" ON public.dating_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "dating_profiles_delete" ON public.dating_profiles FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.dating_swipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action text NOT NULL DEFAULT 'like',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_user, to_user)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dating_swipes TO authenticated;
GRANT ALL ON public.dating_swipes TO service_role;
ALTER TABLE public.dating_swipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dating_swipes_select" ON public.dating_swipes FOR SELECT TO authenticated USING (from_user = auth.uid() OR to_user = auth.uid());
CREATE POLICY "dating_swipes_insert" ON public.dating_swipes FOR INSERT TO authenticated WITH CHECK (from_user = auth.uid());
CREATE POLICY "dating_swipes_delete" ON public.dating_swipes FOR DELETE TO authenticated USING (from_user = auth.uid());

CREATE TABLE IF NOT EXISTS public.dating_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  thread_id uuid REFERENCES public.dm_threads(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_a, user_b)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dating_matches TO authenticated;
GRANT ALL ON public.dating_matches TO service_role;
ALTER TABLE public.dating_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dating_matches_select" ON public.dating_matches FOR SELECT TO authenticated USING (user_a = auth.uid() OR user_b = auth.uid());
CREATE POLICY "dating_matches_delete" ON public.dating_matches FOR DELETE TO authenticated USING (user_a = auth.uid() OR user_b = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_dating_swipe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _a uuid; _b uuid; _thread uuid; _mutual boolean; _name text;
BEGIN
  IF new.action = 'pass' THEN RETURN new; END IF;
  SELECT EXISTS(SELECT 1 FROM dating_swipes s WHERE s.from_user = new.to_user AND s.to_user = new.from_user AND s.action <> 'pass') INTO _mutual;
  IF NOT _mutual THEN RETURN new; END IF;

  _a := LEAST(new.from_user, new.to_user);
  _b := GREATEST(new.from_user, new.to_user);
  IF EXISTS(SELECT 1 FROM dating_matches m WHERE m.user_a = _a AND m.user_b = _b) THEN RETURN new; END IF;

  SELECT dm.thread_id INTO _thread
  FROM dm_members dm
  JOIN dm_members dm2 ON dm2.thread_id = dm.thread_id AND dm2.user_id = _b
  WHERE dm.user_id = _a
  LIMIT 1;

  IF _thread IS NULL THEN
    INSERT INTO dm_threads DEFAULT VALUES RETURNING id INTO _thread;
    INSERT INTO dm_members (thread_id, user_id) VALUES (_thread, _a), (_thread, _b);
  END IF;

  INSERT INTO dating_matches (user_a, user_b, thread_id) VALUES (_a, _b, _thread);

  SELECT display_name INTO _name FROM profiles WHERE id = new.from_user;
  INSERT INTO notifications (user_id, type, payload)
    VALUES (new.to_user, 'match', jsonb_build_object('by', new.from_user, 'thread_id', _thread, 'message', 'You matched with ' || coalesce(_name, 'someone') || '!'));
  SELECT display_name INTO _name FROM profiles WHERE id = new.to_user;
  INSERT INTO notifications (user_id, type, payload)
    VALUES (new.from_user, 'match', jsonb_build_object('by', new.to_user, 'thread_id', _thread, 'message', 'You matched with ' || coalesce(_name, 'someone') || '!'));

  RETURN new;
END; $$;

DROP TRIGGER IF EXISTS on_dating_swipe ON public.dating_swipes;
CREATE TRIGGER on_dating_swipe AFTER INSERT ON public.dating_swipes
FOR EACH ROW EXECUTE FUNCTION public.handle_dating_swipe();

CREATE OR REPLACE FUNCTION public.dating_deck(_user uuid, _limit int DEFAULT 30)
RETURNS TABLE(user_id uuid, username text, display_name text, avatar_url text, age int, gender text, bio text, photos text[], location text, looking_for text, interests text[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (SELECT * FROM dating_profiles WHERE user_id = _user)
  SELECT d.user_id, p.username, p.display_name, p.avatar_url, d.age, d.gender, d.bio, d.photos, d.location, d.looking_for, d.interests
  FROM dating_profiles d
  JOIN profiles p ON p.id = d.user_id
  LEFT JOIN me ON true
  WHERE d.active
    AND d.user_id <> _user
    AND NOT EXISTS (SELECT 1 FROM dating_swipes s WHERE s.from_user = _user AND s.to_user = d.user_id)
    AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = _user AND b.blocked_id = d.user_id) OR (b.blocker_id = d.user_id AND b.blocked_id = _user))
    AND (me.interested_in IS NULL OR 'everyone' = ANY(me.interested_in) OR d.gender = ANY(me.interested_in))
    AND (me.min_age IS NULL OR d.age IS NULL OR d.age BETWEEN me.min_age AND me.max_age)
    AND (d.interested_in IS NULL OR 'everyone' = ANY(d.interested_in) OR me.gender IS NULL OR me.gender = ANY(d.interested_in))
  ORDER BY (EXISTS (SELECT 1 FROM dating_swipes s2 WHERE s2.from_user = d.user_id AND s2.to_user = _user AND s2.action <> 'pass')) DESC, d.updated_at DESC
  LIMIT _limit;
$$;

CREATE OR REPLACE FUNCTION public.touch_dating_profile()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS dating_profiles_touch ON public.dating_profiles;
CREATE TRIGGER dating_profiles_touch BEFORE UPDATE ON public.dating_profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_dating_profile();