-- 1. Extend spaces with contact info and an optional linked DM thread (for circle group-chat)
ALTER TABLE public.spaces
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS dm_thread_id uuid;

-- 2. Space events (Groups)
CREATE TABLE IF NOT EXISTS public.space_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL,
  created_by uuid NOT NULL,
  title text NOT NULL,
  description text,
  location text,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_space_events_space ON public.space_events(space_id, start_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.space_events TO authenticated;
GRANT SELECT ON public.space_events TO anon;
GRANT ALL ON public.space_events TO service_role;

ALTER TABLE public.space_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "space_events readable by space rules" ON public.space_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.spaces s
      WHERE s.id = space_events.space_id
        AND (s.visibility = 'public' OR public.is_space_member(s.id, auth.uid())))
  );

CREATE POLICY "space_events insert by members" ON public.space_events
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND public.is_space_member(space_id, auth.uid())
  );

CREATE POLICY "space_events update by creator or admin" ON public.space_events
  FOR UPDATE USING (
    created_by = auth.uid() OR public.is_space_admin(space_id, auth.uid())
  );

CREATE POLICY "space_events delete by creator or admin" ON public.space_events
  FOR DELETE USING (
    created_by = auth.uid() OR public.is_space_admin(space_id, auth.uid())
  );

-- 3. Space reviews (Pages)
CREATE TABLE IF NOT EXISTS public.space_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (space_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_space_reviews_space ON public.space_reviews(space_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.space_reviews TO authenticated;
GRANT SELECT ON public.space_reviews TO anon;
GRANT ALL ON public.space_reviews TO service_role;

ALTER TABLE public.space_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "space_reviews readable" ON public.space_reviews
  FOR SELECT USING (true);

CREATE POLICY "space_reviews insert own" ON public.space_reviews
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "space_reviews update own" ON public.space_reviews
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "space_reviews delete own or admin" ON public.space_reviews
  FOR DELETE USING (
    user_id = auth.uid() OR public.is_space_admin(space_id, auth.uid())
  );

-- 4. Space invites (Circles)
CREATE TABLE IF NOT EXISTS public.space_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL,
  invited_user_id uuid NOT NULL,
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  UNIQUE (space_id, invited_user_id)
);
CREATE INDEX IF NOT EXISTS idx_space_invites_user ON public.space_invites(invited_user_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.space_invites TO authenticated;
GRANT ALL ON public.space_invites TO service_role;

ALTER TABLE public.space_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "space_invites visible to invitee or admin" ON public.space_invites
  FOR SELECT USING (
    invited_user_id = auth.uid()
    OR invited_by = auth.uid()
    OR public.is_space_admin(space_id, auth.uid())
  );

CREATE POLICY "space_invites create by member" ON public.space_invites
  FOR INSERT WITH CHECK (
    invited_by = auth.uid() AND public.is_space_member(space_id, auth.uid())
  );

CREATE POLICY "space_invites update by invitee or admin" ON public.space_invites
  FOR UPDATE USING (
    invited_user_id = auth.uid() OR public.is_space_admin(space_id, auth.uid())
  );

CREATE POLICY "space_invites delete by inviter or admin" ON public.space_invites
  FOR DELETE USING (
    invited_by = auth.uid() OR public.is_space_admin(space_id, auth.uid())
  );

-- 5. Restrict posting in Pages to owner/admins (Groups and Circles unchanged)
DROP POLICY IF EXISTS "Authenticated can insert own posts" ON public.posts;

CREATE POLICY "Authenticated can insert own posts" ON public.posts
  FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND (
      space_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.spaces s
        WHERE s.id = posts.space_id
          AND (
            s.kind <> 'page'              -- groups & circles: any member can post (membership enforced by select)
            OR public.is_space_admin(s.id, auth.uid())  -- pages: only owner/admins
          )
      )
    )
  );