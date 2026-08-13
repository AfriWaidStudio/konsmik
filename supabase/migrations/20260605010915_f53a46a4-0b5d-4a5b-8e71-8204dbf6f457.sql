
-- Spaces v2: kind-specific feature surface

-- 1) Extend spaces with CTA + verified
ALTER TABLE public.spaces
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cta_label text,
  ADD COLUMN IF NOT EXISTS cta_url text,
  ADD COLUMN IF NOT EXISTS cta_type text;

-- 2) Extend posts: scheduling + announcement flag
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_announcement boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS posts_scheduled_idx ON public.posts (scheduled_at) WHERE scheduled_at IS NOT NULL;

-- 3) Group join requests (for private/invite-only groups)
CREATE TABLE IF NOT EXISTS public.space_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  decided_by uuid,
  UNIQUE (space_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.space_join_requests TO authenticated;
GRANT ALL ON public.space_join_requests TO service_role;
ALTER TABLE public.space_join_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own or admin" ON public.space_join_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_space_admin(space_id, auth.uid()));
CREATE POLICY "request join" ON public.space_join_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "admins decide" ON public.space_join_requests FOR UPDATE TO authenticated
  USING (public.is_space_admin(space_id, auth.uid()));
CREATE POLICY "self or admin cancel" ON public.space_join_requests FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_space_admin(space_id, auth.uid()));

-- 4) Page services / offerings
CREATE TABLE IF NOT EXISTS public.space_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  price_label text,
  url text,
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.space_services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.space_services TO authenticated;
GRANT ALL ON public.space_services TO service_role;
ALTER TABLE public.space_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services readable" ON public.space_services FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.spaces s WHERE s.id = space_id AND s.visibility = 'public'));
CREATE POLICY "services admin write" ON public.space_services FOR INSERT TO authenticated
  WITH CHECK (public.is_space_admin(space_id, auth.uid()));
CREATE POLICY "services admin update" ON public.space_services FOR UPDATE TO authenticated
  USING (public.is_space_admin(space_id, auth.uid()));
CREATE POLICY "services admin delete" ON public.space_services FOR DELETE TO authenticated
  USING (public.is_space_admin(space_id, auth.uid()));

-- 5) Circle albums
CREATE TABLE IF NOT EXISTS public.space_albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  cover_url text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.space_albums TO authenticated;
GRANT ALL ON public.space_albums TO service_role;
ALTER TABLE public.space_albums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "album members view" ON public.space_albums FOR SELECT TO authenticated
  USING (public.is_space_member(space_id, auth.uid()));
CREATE POLICY "album members create" ON public.space_albums FOR INSERT TO authenticated
  WITH CHECK (public.is_space_member(space_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "album owner update" ON public.space_albums FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.is_space_admin(space_id, auth.uid()));
CREATE POLICY "album owner delete" ON public.space_albums FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.is_space_admin(space_id, auth.uid()));

CREATE TABLE IF NOT EXISTS public.space_album_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES public.space_albums(id) ON DELETE CASCADE,
  url text NOT NULL,
  caption text,
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.space_album_photos TO authenticated;
GRANT ALL ON public.space_album_photos TO service_role;
ALTER TABLE public.space_album_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "photos view members" ON public.space_album_photos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.space_albums a WHERE a.id = album_id AND public.is_space_member(a.space_id, auth.uid())));
CREATE POLICY "photos members add" ON public.space_album_photos FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.space_albums a WHERE a.id = album_id AND public.is_space_member(a.space_id, auth.uid())) AND uploaded_by = auth.uid());
CREATE POLICY "photos uploader delete" ON public.space_album_photos FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid() OR EXISTS (SELECT 1 FROM public.space_albums a WHERE a.id = album_id AND public.is_space_admin(a.space_id, auth.uid())));

-- 6) Allow events for ANY space kind (already does via is_space_member); ensure circle membership
--    Reuse public.space_events. No schema change needed.

-- 7) Mentions of a space (for Page "Mentions" tab): use entity_tags where target_type='space'
--    entity_tags table already exists.

-- 8) Listing helpers used by composer "where to post" — RPC that returns my spaces grouped by kind
CREATE OR REPLACE FUNCTION public.my_postable_spaces(_user uuid)
RETURNS TABLE(id uuid, name text, slug text, kind text, can_post boolean, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.name, s.slug, s.kind::text,
    CASE WHEN s.kind = 'page' THEN public.is_space_admin(s.id, _user)
         ELSE public.is_space_member(s.id, _user) END,
    s.avatar_url
  FROM spaces s
  WHERE public.is_space_member(s.id, _user) OR s.owner_id = _user
  ORDER BY s.kind, s.name;
$$;
