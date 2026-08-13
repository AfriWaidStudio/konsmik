-- FEED & POSTS
CREATE TABLE public.followed_tags (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tag text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tag)
);
GRANT SELECT, INSERT, DELETE ON public.followed_tags TO authenticated;
GRANT ALL ON public.followed_tags TO service_role;
ALTER TABLE public.followed_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tags read" ON public.followed_tags FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own tags insert" ON public.followed_tags FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own tags delete" ON public.followed_tags FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.feed_prefs (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  sort text NOT NULL DEFAULT 'latest',
  hide_reposts boolean NOT NULL DEFAULT false,
  muted_words text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feed_prefs TO authenticated;
GRANT ALL ON public.feed_prefs TO service_role;
ALTER TABLE public.feed_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own prefs" ON public.feed_prefs FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.post_edit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  editor_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.post_edit_history TO authenticated;
GRANT SELECT ON public.post_edit_history TO anon;
GRANT ALL ON public.post_edit_history TO service_role;
ALTER TABLE public.post_edit_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "history readable" ON public.post_edit_history FOR SELECT USING (true);
CREATE POLICY "author writes history" ON public.post_edit_history FOR INSERT TO authenticated WITH CHECK (editor_id = auth.uid());

-- SPACES
ALTER TABLE public.spaces ADD COLUMN IF NOT EXISTS welcome_message text;
ALTER TABLE public.spaces ADD COLUMN IF NOT EXISTS announcement text;

CREATE TABLE public.space_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'todo',
  assignee_id uuid,
  due_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.space_tasks TO authenticated;
GRANT ALL ON public.space_tasks TO service_role;
ALTER TABLE public.space_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks read" ON public.space_tasks FOR SELECT TO authenticated USING (public.is_space_member(space_id, auth.uid()));
CREATE POLICY "tasks insert" ON public.space_tasks FOR INSERT TO authenticated WITH CHECK (public.is_space_admin(space_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "tasks update" ON public.space_tasks FOR UPDATE TO authenticated USING (public.is_space_admin(space_id, auth.uid()) OR assignee_id = auth.uid());
CREATE POLICY "tasks delete" ON public.space_tasks FOR DELETE TO authenticated USING (public.is_space_admin(space_id, auth.uid()));
CREATE TRIGGER trg_touch_space_task BEFORE UPDATE ON public.space_tasks FOR EACH ROW EXECUTE FUNCTION public.touch_being();

CREATE TABLE public.space_wiki_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (space_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.space_wiki_pages TO authenticated;
GRANT ALL ON public.space_wiki_pages TO service_role;
ALTER TABLE public.space_wiki_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wiki read" ON public.space_wiki_pages FOR SELECT TO authenticated USING (public.is_space_member(space_id, auth.uid()));
CREATE POLICY "wiki insert" ON public.space_wiki_pages FOR INSERT TO authenticated WITH CHECK (public.is_space_admin(space_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "wiki update" ON public.space_wiki_pages FOR UPDATE TO authenticated USING (public.is_space_admin(space_id, auth.uid()));
CREATE POLICY "wiki delete" ON public.space_wiki_pages FOR DELETE TO authenticated USING (public.is_space_admin(space_id, auth.uid()));
CREATE TRIGGER trg_touch_wiki BEFORE UPDATE ON public.space_wiki_pages FOR EACH ROW EXECUTE FUNCTION public.touch_being();

-- WAIDES
CREATE TABLE public.being_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  being_id uuid NOT NULL REFERENCES public.smai_beings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (being_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.being_reviews TO authenticated;
GRANT SELECT ON public.being_reviews TO anon;
GRANT ALL ON public.being_reviews TO service_role;
ALTER TABLE public.being_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews read" ON public.being_reviews FOR SELECT USING (true);
CREATE POLICY "reviews write" ON public.being_reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "reviews update" ON public.being_reviews FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "reviews delete" ON public.being_reviews FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.being_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  being_id uuid NOT NULL REFERENCES public.smai_beings(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  label text NOT NULL,
  brief text NOT NULL,
  cadence text NOT NULL DEFAULT 'daily',
  next_run_at timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.being_schedules TO authenticated;
GRANT ALL ON public.being_schedules TO service_role;
ALTER TABLE public.being_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schedules own" ON public.being_schedules FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE TRIGGER trg_touch_schedule BEFORE UPDATE ON public.being_schedules FOR EACH ROW EXECUTE FUNCTION public.touch_being();

CREATE TABLE public.being_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  being_id uuid NOT NULL REFERENCES public.smai_beings(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  label text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.being_memories TO authenticated;
GRANT ALL ON public.being_memories TO service_role;
ALTER TABLE public.being_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "memories own" ON public.being_memories FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE TABLE public.being_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  goal text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.being_teams TO authenticated;
GRANT ALL ON public.being_teams TO service_role;
ALTER TABLE public.being_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teams own" ON public.being_teams FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE TABLE public.being_team_members (
  team_id uuid NOT NULL REFERENCES public.being_teams(id) ON DELETE CASCADE,
  being_id uuid NOT NULL REFERENCES public.smai_beings(id) ON DELETE CASCADE,
  duty text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, being_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.being_team_members TO authenticated;
GRANT ALL ON public.being_team_members TO service_role;
ALTER TABLE public.being_team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team members own" ON public.being_team_members FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.being_teams t WHERE t.id = team_id AND t.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.being_teams t WHERE t.id = team_id AND t.owner_id = auth.uid()));

CREATE TABLE public.mission_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  title text NOT NULL,
  brief text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  is_public boolean NOT NULL DEFAULT false,
  uses integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mission_templates TO authenticated;
GRANT ALL ON public.mission_templates TO service_role;
ALTER TABLE public.mission_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates read" ON public.mission_templates FOR SELECT TO authenticated USING (is_public OR owner_id = auth.uid());
CREATE POLICY "templates insert" ON public.mission_templates FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "templates update" ON public.mission_templates FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "templates delete" ON public.mission_templates FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- DATING & MESSAGING
CREATE TABLE public.dating_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  answer text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dating_prompts TO authenticated;
GRANT ALL ON public.dating_prompts TO service_role;
ALTER TABLE public.dating_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prompts read" ON public.dating_prompts FOR SELECT TO authenticated USING (true);
CREATE POLICY "prompts insert" ON public.dating_prompts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "prompts update" ON public.dating_prompts FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "prompts delete" ON public.dating_prompts FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.dating_boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.dating_boosts TO authenticated;
GRANT ALL ON public.dating_boosts TO service_role;
ALTER TABLE public.dating_boosts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "boosts read" ON public.dating_boosts FOR SELECT TO authenticated USING (true);
CREATE POLICY "boosts own insert" ON public.dating_boosts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "boosts own delete" ON public.dating_boosts FOR DELETE TO authenticated USING (user_id = auth.uid());

ALTER TABLE public.dm_messages ADD COLUMN IF NOT EXISTS media_url text;
ALTER TABLE public.dm_messages ADD COLUMN IF NOT EXISTS media_type text;
ALTER TABLE public.dm_messages ADD COLUMN IF NOT EXISTS duration_ms integer;

CREATE TABLE public.dm_thread_settings (
  thread_id uuid NOT NULL REFERENCES public.dm_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  muted boolean NOT NULL DEFAULT false,
  nickname text,
  theme text NOT NULL DEFAULT 'cyber',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dm_thread_settings TO authenticated;
GRANT ALL ON public.dm_thread_settings TO service_role;
ALTER TABLE public.dm_thread_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "thread settings own" ON public.dm_thread_settings FOR ALL TO authenticated
  USING (user_id = auth.uid() AND public.is_dm_member(thread_id, auth.uid()))
  WITH CHECK (user_id = auth.uid() AND public.is_dm_member(thread_id, auth.uid()));

CREATE TABLE public.dm_pins (
  thread_id uuid NOT NULL REFERENCES public.dm_threads(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.dm_messages(id) ON DELETE CASCADE,
  pinned_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, message_id)
);
GRANT SELECT, INSERT, DELETE ON public.dm_pins TO authenticated;
GRANT ALL ON public.dm_pins TO service_role;
ALTER TABLE public.dm_pins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pins read" ON public.dm_pins FOR SELECT TO authenticated USING (public.is_dm_member(thread_id, auth.uid()));
CREATE POLICY "pins insert" ON public.dm_pins FOR INSERT TO authenticated WITH CHECK (public.is_dm_member(thread_id, auth.uid()) AND pinned_by = auth.uid());
CREATE POLICY "pins delete" ON public.dm_pins FOR DELETE TO authenticated USING (public.is_dm_member(thread_id, auth.uid()));