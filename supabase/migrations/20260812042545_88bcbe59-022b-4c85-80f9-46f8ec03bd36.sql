ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS interests text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarded boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notif_follows boolean NOT NULL DEFAULT true,
  notif_likes boolean NOT NULL DEFAULT true,
  notif_comments boolean NOT NULL DEFAULT true,
  notif_mentions boolean NOT NULL DEFAULT true,
  notif_messages boolean NOT NULL DEFAULT true,
  notif_recommendations boolean NOT NULL DEFAULT true,
  dm_privacy text NOT NULL DEFAULT 'everyone',
  show_activity boolean NOT NULL DEFAULT true,
  discoverable boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings" ON public.user_settings FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.mutes (
  muter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  muted_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (muter_id, muted_id)
);
GRANT SELECT, INSERT, DELETE ON public.mutes TO authenticated;
GRANT ALL ON public.mutes TO service_role;
ALTER TABLE public.mutes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own mutes" ON public.mutes FOR ALL TO authenticated
  USING (auth.uid() = muter_id) WITH CHECK (auth.uid() = muter_id);

CREATE TRIGGER user_settings_touch BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_being();

CREATE OR REPLACE FUNCTION public.suggested_people(_user uuid, _limit integer DEFAULT 12)
RETURNS TABLE(id uuid, username text, display_name text, title text, avatar_url text, bio text, reputation integer, mutuals bigint, shared_interests integer, reason text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH me AS (SELECT interests FROM profiles WHERE id = _user)
  SELECT p.id, p.username, p.display_name, p.title, p.avatar_url, p.bio, p.reputation,
    (SELECT count(*) FROM follows f1
       JOIN follows f2 ON f2.following_id = f1.following_id AND f2.follower_id = p.id
      WHERE f1.follower_id = _user) AS mutuals,
    (SELECT cardinality(ARRAY(SELECT unnest(p.interests) INTERSECT SELECT unnest((SELECT interests FROM me))))) AS shared_interests,
    CASE
      WHEN (SELECT cardinality(ARRAY(SELECT unnest(p.interests) INTERSECT SELECT unnest((SELECT interests FROM me))))) > 0 THEN 'Shares your interests'
      WHEN (SELECT count(*) FROM follows f1 JOIN follows f2 ON f2.following_id = f1.following_id AND f2.follower_id = p.id WHERE f1.follower_id = _user) > 0 THEN 'Followed by people you follow'
      ELSE 'Popular on Konsmia'
    END AS reason
  FROM profiles p
  WHERE p.id <> _user
    AND NOT EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = _user AND f.following_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = _user AND b.blocked_id = p.id) OR (b.blocker_id = p.id AND b.blocked_id = _user))
  ORDER BY 9 DESC, 8 DESC, p.reputation DESC, p.created_at DESC
  LIMIT _limit;
$$;