-- ============ SMAI NICHES ============
ALTER TABLE public.smai_profiles
  ADD COLUMN IF NOT EXISTS niches text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS niche_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS open_to text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hire_url text,
  ADD COLUMN IF NOT EXISTS rate_card text;

-- ============ SPACE CHANNELS ============
CREATE TABLE public.space_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  position integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (space_id, slug)
);
GRANT SELECT ON public.space_channels TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.space_channels TO authenticated;
GRANT ALL ON public.space_channels TO service_role;
ALTER TABLE public.space_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "channels readable" ON public.space_channels FOR SELECT USING (true);
CREATE POLICY "channels admin insert" ON public.space_channels FOR INSERT TO authenticated WITH CHECK (public.is_space_admin(space_id, auth.uid()));
CREATE POLICY "channels admin update" ON public.space_channels FOR UPDATE TO authenticated USING (public.is_space_admin(space_id, auth.uid()));
CREATE POLICY "channels admin delete" ON public.space_channels FOR DELETE TO authenticated USING (public.is_space_admin(space_id, auth.uid()));

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS channel_id uuid REFERENCES public.space_channels(id) ON DELETE SET NULL;

-- ============ SPACE FILES ============
CREATE TABLE public.space_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  mime text,
  size_bytes bigint,
  pinned boolean NOT NULL DEFAULT false,
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.space_files TO authenticated;
GRANT ALL ON public.space_files TO service_role;
ALTER TABLE public.space_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "files members read" ON public.space_files FOR SELECT TO authenticated USING (public.is_space_member(space_id, auth.uid()));
CREATE POLICY "files members insert" ON public.space_files FOR INSERT TO authenticated WITH CHECK (public.is_space_member(space_id, auth.uid()) AND uploaded_by = auth.uid());
CREATE POLICY "files manage" ON public.space_files FOR UPDATE TO authenticated USING (uploaded_by = auth.uid() OR public.is_space_admin(space_id, auth.uid()));
CREATE POLICY "files delete" ON public.space_files FOR DELETE TO authenticated USING (uploaded_by = auth.uid() OR public.is_space_admin(space_id, auth.uid()));

-- ============ RULES ACCEPTANCE ============
CREATE TABLE public.space_rules_accepts (
  space_id uuid NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (space_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.space_rules_accepts TO authenticated;
GRANT ALL ON public.space_rules_accepts TO service_role;
ALTER TABLE public.space_rules_accepts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rules read own" ON public.space_rules_accepts FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_space_admin(space_id, auth.uid()));
CREATE POLICY "rules accept own" ON public.space_rules_accepts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "rules delete own" ON public.space_rules_accepts FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ BANS ============
CREATE TABLE public.space_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reason text,
  kind text NOT NULL DEFAULT 'ban',
  until timestamptz,
  banned_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (space_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.space_bans TO authenticated;
GRANT ALL ON public.space_bans TO service_role;
ALTER TABLE public.space_bans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bans read" ON public.space_bans FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_space_admin(space_id, auth.uid()));
CREATE POLICY "bans admin insert" ON public.space_bans FOR INSERT TO authenticated WITH CHECK (public.is_space_admin(space_id, auth.uid()));
CREATE POLICY "bans admin update" ON public.space_bans FOR UPDATE TO authenticated USING (public.is_space_admin(space_id, auth.uid()));
CREATE POLICY "bans admin delete" ON public.space_bans FOR DELETE TO authenticated USING (public.is_space_admin(space_id, auth.uid()));

-- ============ AUDIT LOG ============
CREATE TABLE public.space_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.space_audit_log TO authenticated;
GRANT ALL ON public.space_audit_log TO service_role;
ALTER TABLE public.space_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit admin read" ON public.space_audit_log FOR SELECT TO authenticated USING (public.is_space_admin(space_id, auth.uid()));
CREATE POLICY "audit admin insert" ON public.space_audit_log FOR INSERT TO authenticated WITH CHECK (public.is_space_admin(space_id, auth.uid()) AND actor_id = auth.uid());

-- ============ MEMBERSHIP QUESTIONS ============
CREATE TABLE public.space_membership_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  question text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.space_membership_questions TO authenticated;
GRANT ALL ON public.space_membership_questions TO service_role;
ALTER TABLE public.space_membership_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mq read" ON public.space_membership_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "mq admin insert" ON public.space_membership_questions FOR INSERT TO authenticated WITH CHECK (public.is_space_admin(space_id, auth.uid()));
CREATE POLICY "mq admin update" ON public.space_membership_questions FOR UPDATE TO authenticated USING (public.is_space_admin(space_id, auth.uid()));
CREATE POLICY "mq admin delete" ON public.space_membership_questions FOR DELETE TO authenticated USING (public.is_space_admin(space_id, auth.uid()));

CREATE TABLE public.space_join_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.space_join_requests(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.space_membership_questions(id) ON DELETE CASCADE,
  space_id uuid NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  answer text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.space_join_answers TO authenticated;
GRANT ALL ON public.space_join_answers TO service_role;
ALTER TABLE public.space_join_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "answers read" ON public.space_join_answers FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_space_admin(space_id, auth.uid()));
CREATE POLICY "answers insert own" ON public.space_join_answers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ============ MEMBER BADGES ============
CREATE TABLE public.space_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  badge text NOT NULL,
  awarded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (space_id, user_id, badge)
);
GRANT SELECT ON public.space_badges TO anon;
GRANT SELECT, INSERT, DELETE ON public.space_badges TO authenticated;
GRANT ALL ON public.space_badges TO service_role;
ALTER TABLE public.space_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges read" ON public.space_badges FOR SELECT USING (true);
CREATE POLICY "badges admin insert" ON public.space_badges FOR INSERT TO authenticated WITH CHECK (public.is_space_admin(space_id, auth.uid()));
CREATE POLICY "badges admin delete" ON public.space_badges FOR DELETE TO authenticated USING (public.is_space_admin(space_id, auth.uid()));

-- ============ TIERS + SUBSCRIPTIONS ============
CREATE TABLE public.space_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price_maiki numeric(18,2) NOT NULL DEFAULT 0,
  benefits text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.space_tiers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.space_tiers TO authenticated;
GRANT ALL ON public.space_tiers TO service_role;
ALTER TABLE public.space_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tiers read" ON public.space_tiers FOR SELECT USING (true);
CREATE POLICY "tiers admin insert" ON public.space_tiers FOR INSERT TO authenticated WITH CHECK (public.is_space_admin(space_id, auth.uid()));
CREATE POLICY "tiers admin update" ON public.space_tiers FOR UPDATE TO authenticated USING (public.is_space_admin(space_id, auth.uid()));
CREATE POLICY "tiers admin delete" ON public.space_tiers FOR DELETE TO authenticated USING (public.is_space_admin(space_id, auth.uid()));

CREATE TABLE public.space_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  tier_id uuid NOT NULL REFERENCES public.space_tiers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);
GRANT SELECT, INSERT ON public.space_subscriptions TO authenticated;
GRANT ALL ON public.space_subscriptions TO service_role;
ALTER TABLE public.space_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs read" ON public.space_subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_space_admin(space_id, auth.uid()));
CREATE POLICY "subs insert own" ON public.space_subscriptions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ============ JOB BOARD ============
CREATE TABLE public.space_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  location text,
  job_type text NOT NULL DEFAULT 'full_time',
  compensation text,
  apply_url text,
  posted_by uuid NOT NULL,
  closes_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.space_jobs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.space_jobs TO authenticated;
GRANT ALL ON public.space_jobs TO service_role;
ALTER TABLE public.space_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs read" ON public.space_jobs FOR SELECT USING (true);
CREATE POLICY "jobs admin insert" ON public.space_jobs FOR INSERT TO authenticated WITH CHECK (public.is_space_admin(space_id, auth.uid()) AND posted_by = auth.uid());
CREATE POLICY "jobs admin update" ON public.space_jobs FOR UPDATE TO authenticated USING (public.is_space_admin(space_id, auth.uid()));
CREATE POLICY "jobs admin delete" ON public.space_jobs FOR DELETE TO authenticated USING (public.is_space_admin(space_id, auth.uid()));

-- ============ INVITE LINKS ============
CREATE TABLE public.space_invite_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  created_by uuid NOT NULL,
  expires_at timestamptz,
  max_uses integer,
  uses integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.space_invite_links TO authenticated;
GRANT ALL ON public.space_invite_links TO service_role;
ALTER TABLE public.space_invite_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invite links read" ON public.space_invite_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "invite links admin insert" ON public.space_invite_links FOR INSERT TO authenticated WITH CHECK (public.is_space_admin(space_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "invite links admin delete" ON public.space_invite_links FOR DELETE TO authenticated USING (public.is_space_admin(space_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.redeem_space_invite(_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid := auth.uid(); l public.space_invite_links;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO l FROM public.space_invite_links WHERE code = _code;
  IF l.id IS NULL THEN RAISE EXCEPTION 'Invalid invite'; END IF;
  IF l.expires_at IS NOT NULL AND l.expires_at < now() THEN RAISE EXCEPTION 'Invite expired'; END IF;
  IF l.max_uses IS NOT NULL AND l.uses >= l.max_uses THEN RAISE EXCEPTION 'Invite fully used'; END IF;
  IF EXISTS (SELECT 1 FROM public.space_bans b WHERE b.space_id = l.space_id AND b.user_id = _uid) THEN
    RAISE EXCEPTION 'You are banned from this space';
  END IF;
  INSERT INTO public.space_members (space_id, user_id, role)
  VALUES (l.space_id, _uid, 'member') ON CONFLICT DO NOTHING;
  UPDATE public.space_invite_links SET uses = uses + 1 WHERE id = l.id;
  RETURN l.space_id;
END; $$;

-- ============ EVENT RSVPS ============
CREATE TABLE public.space_event_rsvps (
  event_id uuid NOT NULL REFERENCES public.space_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'going',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.space_event_rsvps TO authenticated;
GRANT ALL ON public.space_event_rsvps TO service_role;
ALTER TABLE public.space_event_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rsvp read" ON public.space_event_rsvps FOR SELECT TO authenticated USING (true);
CREATE POLICY "rsvp own insert" ON public.space_event_rsvps FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "rsvp own update" ON public.space_event_rsvps FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "rsvp own delete" ON public.space_event_rsvps FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ POSTS: TIME CAPSULE + AUDIENCE ============
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS unlock_at timestamptz,
  ADD COLUMN IF NOT EXISTS expire_at timestamptz,
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'public';

-- ============ CONTEXT RECEIPTS ============
CREATE TABLE public.post_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  kind text NOT NULL,
  content text NOT NULL,
  model text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, kind)
);
GRANT SELECT ON public.post_context TO anon;
GRANT SELECT, INSERT, UPDATE ON public.post_context TO authenticated;
GRANT ALL ON public.post_context TO service_role;
ALTER TABLE public.post_context ENABLE ROW LEVEL SECURITY;
CREATE POLICY "context read" ON public.post_context FOR SELECT USING (true);
CREATE POLICY "context insert" ON public.post_context FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "context update" ON public.post_context FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

-- ============ PROOF OF HUMAN + REPUTATION ============
CREATE TABLE public.human_proofs (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  method text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  verified_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.human_proofs TO anon;
GRANT SELECT, INSERT, UPDATE ON public.human_proofs TO authenticated;
GRANT ALL ON public.human_proofs TO service_role;
ALTER TABLE public.human_proofs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proof read" ON public.human_proofs FOR SELECT USING (true);
CREATE POLICY "proof own insert" ON public.human_proofs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "proof own update" ON public.human_proofs FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.reputation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  ref_type text,
  ref_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reputation_events TO anon;
GRANT SELECT, INSERT ON public.reputation_events TO authenticated;
GRANT ALL ON public.reputation_events TO service_role;
ALTER TABLE public.reputation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rep read" ON public.reputation_events FOR SELECT USING (true);
CREATE POLICY "rep insert own" ON public.reputation_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reputation integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.apply_reputation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET reputation = reputation + NEW.points WHERE id = NEW.user_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_reputation_event AFTER INSERT ON public.reputation_events
FOR EACH ROW EXECUTE FUNCTION public.apply_reputation();

-- ============ TIPS + REVENUE SPLITS ============
CREATE TABLE public.revenue_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  percent integer NOT NULL CHECK (percent > 0 AND percent <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
GRANT SELECT ON public.revenue_splits TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.revenue_splits TO authenticated;
GRANT ALL ON public.revenue_splits TO service_role;
ALTER TABLE public.revenue_splits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "splits read" ON public.revenue_splits FOR SELECT USING (true);
CREATE POLICY "splits author manage" ON public.revenue_splits FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()));
CREATE POLICY "splits author update" ON public.revenue_splits FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()));
CREATE POLICY "splits author delete" ON public.revenue_splits FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()));

CREATE TABLE public.post_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  from_user uuid NOT NULL,
  to_user uuid NOT NULL,
  amount numeric(18,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.post_tips TO anon;
GRANT SELECT ON public.post_tips TO authenticated;
GRANT ALL ON public.post_tips TO service_role;
ALTER TABLE public.post_tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tips read" ON public.post_tips FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.tip_post(_post_id uuid, _amount numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _author uuid;
  w public.maiki_wallets;
  tw public.maiki_wallets;
  r record;
  _share numeric(18,2);
  _paid numeric(18,2) := 0;
  _total_pct integer := 0;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  SELECT author_id INTO _author FROM public.posts WHERE id = _post_id;
  IF _author IS NULL THEN RAISE EXCEPTION 'Post not found'; END IF;
  IF _author = _uid THEN RAISE EXCEPTION 'Cannot tip your own post'; END IF;

  w := public.ensure_maiki_wallet(_uid);
  IF w.locked THEN RAISE EXCEPTION 'Wallet is locked'; END IF;
  IF w.balance < _amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  UPDATE public.maiki_wallets SET balance = balance - _amount, updated_at = now()
    WHERE user_id = _uid RETURNING * INTO w;
  INSERT INTO public.maiki_transactions(user_id, kind, amount, balance_after, counterparty, note)
  VALUES (_uid, 'tip', -_amount, w.balance, _author, 'Tip on post');

  SELECT COALESCE(sum(percent), 0) INTO _total_pct FROM public.revenue_splits WHERE post_id = _post_id;

  IF _total_pct > 0 THEN
    FOR r IN SELECT user_id, percent FROM public.revenue_splits WHERE post_id = _post_id LOOP
      _share := round(_amount * r.percent / 100.0, 2);
      IF _share > 0 THEN
        PERFORM public.ensure_maiki_wallet(r.user_id);
        UPDATE public.maiki_wallets SET balance = balance + _share, updated_at = now()
          WHERE user_id = r.user_id RETURNING * INTO tw;
        INSERT INTO public.maiki_transactions(user_id, kind, amount, balance_after, counterparty, note)
        VALUES (r.user_id, 'tip_received', _share, tw.balance, _uid, 'Tip split');
        INSERT INTO public.post_tips(post_id, from_user, to_user, amount) VALUES (_post_id, _uid, r.user_id, _share);
        _paid := _paid + _share;
      END IF;
    END LOOP;
  END IF;

  IF _amount - _paid > 0 THEN
    PERFORM public.ensure_maiki_wallet(_author);
    UPDATE public.maiki_wallets SET balance = balance + (_amount - _paid), updated_at = now()
      WHERE user_id = _author RETURNING * INTO tw;
    INSERT INTO public.maiki_transactions(user_id, kind, amount, balance_after, counterparty, note)
    VALUES (_author, 'tip_received', _amount - _paid, tw.balance, _uid, 'Tip on post');
    INSERT INTO public.post_tips(post_id, from_user, to_user, amount) VALUES (_post_id, _uid, _author, _amount - _paid);
  END IF;

  INSERT INTO public.notifications (user_id, type, payload)
  VALUES (_author, 'tip', jsonb_build_object('post_id', _post_id, 'by', _uid, 'amount', _amount, 'message', 'You received a tip of ' || _amount || ' MK'));

  RETURN w.balance;
END; $$;

REVOKE EXECUTE ON FUNCTION public.tip_post(uuid, numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.redeem_space_invite(text) FROM anon;