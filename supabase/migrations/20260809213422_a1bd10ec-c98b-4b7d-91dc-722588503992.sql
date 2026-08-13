
CREATE TABLE public.smai_beings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'worker',
  name text NOT NULL,
  role text NOT NULL DEFAULT 'Generalist',
  purpose text,
  personality text NOT NULL DEFAULT 'calm, precise, useful',
  skills text[] NOT NULL DEFAULT '{}',
  avatar_url text,
  accent text NOT NULL DEFAULT '#22d3ee',
  is_public boolean NOT NULL DEFAULT false,
  hire_rate numeric(18,2) NOT NULL DEFAULT 0,
  runs integer NOT NULL DEFAULT 0,
  model text NOT NULL DEFAULT 'google/gemini-2.5-flash',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT smai_beings_kind_check CHECK (kind IN ('twin','worker'))
);
CREATE UNIQUE INDEX smai_beings_one_twin ON public.smai_beings(owner_id) WHERE kind = 'twin';
CREATE INDEX smai_beings_owner_idx ON public.smai_beings(owner_id);
CREATE INDEX smai_beings_public_idx ON public.smai_beings(is_public);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.smai_beings TO authenticated;
GRANT SELECT ON public.smai_beings TO anon;
GRANT ALL ON public.smai_beings TO service_role;
ALTER TABLE public.smai_beings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "beings readable when public or own" ON public.smai_beings FOR SELECT USING (is_public OR owner_id = auth.uid());
CREATE POLICY "beings insert own" ON public.smai_beings FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "beings update own" ON public.smai_beings FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "beings delete own" ON public.smai_beings FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE TABLE public.tred_beings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  being_id uuid NOT NULL REFERENCES public.smai_beings(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  duty text NOT NULL,
  instructions text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  runs integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tred_beings_being_idx ON public.tred_beings(being_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tred_beings TO authenticated;
GRANT SELECT ON public.tred_beings TO anon;
GRANT ALL ON public.tred_beings TO service_role;
ALTER TABLE public.tred_beings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "treds readable with parent" ON public.tred_beings FOR SELECT
  USING (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.smai_beings b WHERE b.id = being_id AND b.is_public));
CREATE POLICY "treds insert own" ON public.tred_beings FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "treds update own" ON public.tred_beings FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "treds delete own" ON public.tred_beings FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE TABLE public.being_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  being_id uuid NOT NULL REFERENCES public.smai_beings(id) ON DELETE CASCADE,
  tred_id uuid REFERENCES public.tred_beings(id) ON DELETE SET NULL,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  brief text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  result text,
  model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT being_missions_status_check CHECK (status IN ('queued','running','done','failed'))
);
CREATE INDEX being_missions_being_idx ON public.being_missions(being_id);
CREATE INDEX being_missions_owner_idx ON public.being_missions(owner_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.being_missions TO authenticated;
GRANT ALL ON public.being_missions TO service_role;
ALTER TABLE public.being_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "missions own" ON public.being_missions FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "missions insert own" ON public.being_missions FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "missions update own" ON public.being_missions FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "missions delete own" ON public.being_missions FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE TABLE public.being_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  being_id uuid NOT NULL REFERENCES public.smai_beings(id) ON DELETE CASCADE,
  tred_id uuid REFERENCES public.tred_beings(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT being_messages_role_check CHECK (role IN ('user','assistant'))
);
CREATE INDEX being_messages_thread_idx ON public.being_messages(being_id, user_id, created_at);

GRANT SELECT, INSERT, DELETE ON public.being_messages TO authenticated;
GRANT ALL ON public.being_messages TO service_role;
ALTER TABLE public.being_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "being messages own" ON public.being_messages FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "being messages insert own" ON public.being_messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "being messages delete own" ON public.being_messages FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.being_hires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  being_id uuid NOT NULL REFERENCES public.smai_beings(id) ON DELETE CASCADE,
  hirer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric(18,2) NOT NULL DEFAULT 0,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX being_hires_being_idx ON public.being_hires(being_id);

GRANT SELECT ON public.being_hires TO authenticated;
GRANT ALL ON public.being_hires TO service_role;
ALTER TABLE public.being_hires ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hires visible to parties" ON public.being_hires FOR SELECT TO authenticated USING (hirer_id = auth.uid() OR owner_id = auth.uid());

CREATE OR REPLACE FUNCTION public.touch_being()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_touch_being BEFORE UPDATE ON public.smai_beings FOR EACH ROW EXECUTE FUNCTION public.touch_being();
CREATE TRIGGER trg_touch_tred BEFORE UPDATE ON public.tred_beings FOR EACH ROW EXECUTE FUNCTION public.touch_being();
CREATE TRIGGER trg_touch_mission BEFORE UPDATE ON public.being_missions FOR EACH ROW EXECUTE FUNCTION public.touch_being();

-- Ensure every account has a Twin SmaiBeing
CREATE OR REPLACE FUNCTION public.ensure_twin_being(_user uuid)
RETURNS public.smai_beings LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b public.smai_beings; _name text;
BEGIN
  SELECT * INTO b FROM public.smai_beings WHERE owner_id = _user AND kind = 'twin';
  IF FOUND THEN RETURN b; END IF;
  SELECT coalesce(display_name, username) INTO _name FROM public.profiles WHERE id = _user;
  INSERT INTO public.smai_beings(owner_id, kind, name, role, purpose, personality, skills)
  VALUES (_user, 'twin', coalesce(_name,'You') || ' Twin', 'Digital Twin',
    'Represents its human across Konsmia — answers, drafts, and remembers on their behalf.',
    'warm, sharp, loyal to its human', ARRAY['memory','drafting','representation'])
  RETURNING * INTO b;
  RETURN b;
END; $$;

CREATE OR REPLACE FUNCTION public.hire_being(_being_id uuid, _note text DEFAULT NULL)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  b public.smai_beings;
  w public.maiki_wallets;
  ow public.maiki_wallets;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO b FROM public.smai_beings WHERE id = _being_id;
  IF b.id IS NULL THEN RAISE EXCEPTION 'Being not found'; END IF;
  IF NOT b.is_public THEN RAISE EXCEPTION 'This being is not for hire'; END IF;
  IF b.owner_id = _uid THEN RAISE EXCEPTION 'You already own this being'; END IF;

  w := public.ensure_maiki_wallet(_uid);
  IF w.locked THEN RAISE EXCEPTION 'Wallet is locked'; END IF;
  IF w.balance < b.hire_rate THEN RAISE EXCEPTION 'Insufficient Maiki balance'; END IF;

  IF b.hire_rate > 0 THEN
    UPDATE public.maiki_wallets SET balance = balance - b.hire_rate, updated_at = now()
      WHERE user_id = _uid RETURNING * INTO w;
    PERFORM public.ensure_maiki_wallet(b.owner_id);
    UPDATE public.maiki_wallets SET balance = balance + b.hire_rate, updated_at = now()
      WHERE user_id = b.owner_id RETURNING * INTO ow;
    INSERT INTO public.maiki_transactions(user_id, kind, amount, balance_after, counterparty, note)
    VALUES (_uid, 'send', -b.hire_rate, w.balance, b.owner_id, 'Hired ' || b.name),
           (b.owner_id, 'receive', b.hire_rate, ow.balance, _uid, 'Being hired: ' || b.name);
  END IF;

  INSERT INTO public.being_hires(being_id, hirer_id, owner_id, amount, note)
  VALUES (b.id, _uid, b.owner_id, b.hire_rate, _note);

  INSERT INTO public.notifications(user_id, type, payload)
  VALUES (b.owner_id, 'system', jsonb_build_object('message', 'Your SmaiBeing ' || b.name || ' was hired', 'being_id', b.id));

  RETURN w.balance;
END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user_twin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.ensure_twin_being(NEW.id);
  RETURN NEW;
END; $$;

CREATE TRIGGER on_profile_created_twin AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_twin();
