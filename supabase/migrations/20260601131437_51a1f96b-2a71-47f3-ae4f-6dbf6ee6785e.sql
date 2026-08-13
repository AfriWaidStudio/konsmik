
CREATE TABLE public.post_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('profile','space')),
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, target_type, target_id)
);
CREATE INDEX idx_post_targets_target ON public.post_targets(target_type, target_id);
CREATE INDEX idx_post_targets_post ON public.post_targets(post_id);
GRANT SELECT ON public.post_targets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_targets TO authenticated;
GRANT ALL ON public.post_targets TO service_role;
ALTER TABLE public.post_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_targets readable" ON public.post_targets FOR SELECT USING (true);
CREATE POLICY "post_targets insert by post owner" ON public.post_targets FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()));
CREATE POLICY "post_targets delete by post owner" ON public.post_targets FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()));

CREATE TABLE public.post_collaborators (
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'collaborator',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(post_id, user_id)
);
CREATE INDEX idx_post_collaborators_user ON public.post_collaborators(user_id);
GRANT SELECT ON public.post_collaborators TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_collaborators TO authenticated;
GRANT ALL ON public.post_collaborators TO service_role;
ALTER TABLE public.post_collaborators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_collab readable" ON public.post_collaborators FOR SELECT USING (true);
CREATE POLICY "post_collab insert by owner" ON public.post_collaborators FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()));
CREATE POLICY "post_collab delete by owner" ON public.post_collaborators FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()));

CREATE TABLE public.entity_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_type TEXT NOT NULL CHECK (source_type IN ('post','comment','dm_message')),
  source_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('user','space','tag','post')),
  target_id UUID,
  target_text TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_entity_tags_source ON public.entity_tags(source_type, source_id);
CREATE INDEX idx_entity_tags_target ON public.entity_tags(target_type, target_id);
CREATE INDEX idx_entity_tags_text ON public.entity_tags(target_text);
GRANT SELECT ON public.entity_tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entity_tags TO authenticated;
GRANT ALL ON public.entity_tags TO service_role;
ALTER TABLE public.entity_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entity_tags readable" ON public.entity_tags FOR SELECT USING (true);
CREATE POLICY "entity_tags insert own" ON public.entity_tags FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "entity_tags delete own" ON public.entity_tags FOR DELETE USING (auth.uid() = created_by);

CREATE TABLE public.hides (
  user_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post','user','space','tag')),
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, target_type, target_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hides TO authenticated;
GRANT ALL ON public.hides TO service_role;
ALTER TABLE public.hides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hides own select" ON public.hides FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "hides own insert" ON public.hides FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "hides own delete" ON public.hides FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE UNIQUE,
  question TEXT NOT NULL,
  multi_select BOOLEAN NOT NULL DEFAULT false,
  closes_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.polls TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.polls TO authenticated;
GRANT ALL ON public.polls TO service_role;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "polls readable" ON public.polls FOR SELECT USING (true);
CREATE POLICY "polls insert by post owner" ON public.polls FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()));
CREATE POLICY "polls update by post owner" ON public.polls FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()));
CREATE POLICY "polls delete by post owner" ON public.polls FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()));

CREATE TABLE public.poll_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_poll_options_poll ON public.poll_options(poll_id);
GRANT SELECT ON public.poll_options TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.poll_options TO authenticated;
GRANT ALL ON public.poll_options TO service_role;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "poll_options readable" ON public.poll_options FOR SELECT USING (true);
CREATE POLICY "poll_options write by poll owner" ON public.poll_options FOR ALL
  USING (EXISTS (SELECT 1 FROM public.polls pl JOIN public.posts p ON p.id = pl.post_id WHERE pl.id = poll_id AND p.author_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.polls pl JOIN public.posts p ON p.id = pl.post_id WHERE pl.id = poll_id AND p.author_id = auth.uid()));

CREATE TABLE public.poll_votes (
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(poll_id, option_id, user_id)
);
CREATE INDEX idx_poll_votes_user ON public.poll_votes(user_id);
GRANT SELECT ON public.poll_votes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.poll_votes TO authenticated;
GRANT ALL ON public.poll_votes TO service_role;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "poll_votes readable" ON public.poll_votes FOR SELECT USING (true);
CREATE POLICY "poll_votes insert own" ON public.poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "poll_votes delete own" ON public.poll_votes FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.voice_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  url TEXT NOT NULL,
  duration_ms INT,
  waveform JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_voice_notes_owner ON public.voice_notes(owner_id);
GRANT SELECT ON public.voice_notes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voice_notes TO authenticated;
GRANT ALL ON public.voice_notes TO service_role;
ALTER TABLE public.voice_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "voice_notes readable" ON public.voice_notes FOR SELECT USING (true);
CREATE POLICY "voice_notes insert own" ON public.voice_notes FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "voice_notes delete own" ON public.voice_notes FOR DELETE USING (auth.uid() = owner_id);

CREATE TABLE public.comment_reactions (
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(comment_id, user_id, emoji)
);
CREATE INDEX idx_comment_reactions_comment ON public.comment_reactions(comment_id);
GRANT SELECT ON public.comment_reactions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comment_reactions TO authenticated;
GRANT ALL ON public.comment_reactions TO service_role;
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comment_reactions readable" ON public.comment_reactions FOR SELECT USING (true);
CREATE POLICY "comment_reactions insert own" ON public.comment_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comment_reactions delete own" ON public.comment_reactions FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.reposts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  quote_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);
CREATE INDEX idx_reposts_post ON public.reposts(post_id);
CREATE INDEX idx_reposts_user ON public.reposts(user_id);
GRANT SELECT ON public.reposts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reposts TO authenticated;
GRANT ALL ON public.reposts TO service_role;
ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reposts readable" ON public.reposts FOR SELECT USING (true);
CREATE POLICY "reposts insert own" ON public.reposts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reposts delete own" ON public.reposts FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  cover_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_collections_owner ON public.collections(owner_id);
GRANT SELECT ON public.collections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated;
GRANT ALL ON public.collections TO service_role;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collections public or own select" ON public.collections FOR SELECT
  USING (is_public = true OR auth.uid() = owner_id);
CREATE POLICY "collections insert own" ON public.collections FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "collections update own" ON public.collections FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "collections delete own" ON public.collections FOR DELETE USING (auth.uid() = owner_id);

CREATE TABLE public.collection_items (
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(collection_id, post_id)
);
CREATE INDEX idx_collection_items_post ON public.collection_items(post_id);
GRANT SELECT ON public.collection_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collection_items TO authenticated;
GRANT ALL ON public.collection_items TO service_role;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collection_items select via collection" ON public.collection_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND (c.is_public OR c.owner_id = auth.uid())));
CREATE POLICY "collection_items write by owner" ON public.collection_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.owner_id = auth.uid()));

CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image','video')),
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);
CREATE INDEX idx_stories_author ON public.stories(author_id);
CREATE INDEX idx_stories_expires ON public.stories(expires_at);
GRANT SELECT ON public.stories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stories TO authenticated;
GRANT ALL ON public.stories TO service_role;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stories readable while active" ON public.stories FOR SELECT
  USING (expires_at > now() OR auth.uid() = author_id);
CREATE POLICY "stories insert own" ON public.stories FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "stories delete own" ON public.stories FOR DELETE USING (auth.uid() = author_id);

CREATE TABLE public.story_views (
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(story_id, viewer_id)
);
CREATE INDEX idx_story_views_viewer ON public.story_views(viewer_id);
GRANT SELECT, INSERT ON public.story_views TO authenticated;
GRANT ALL ON public.story_views TO service_role;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "story_views select by author or viewer" ON public.story_views FOR SELECT
  USING (auth.uid() = viewer_id OR EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.author_id = auth.uid()));
CREATE POLICY "story_views insert own" ON public.story_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);

CREATE TABLE public.tv_shows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  trailer_url TEXT,
  category TEXT,
  studio TEXT NOT NULL DEFAULT 'Konsmik',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tv_shows_slug ON public.tv_shows(slug);
GRANT SELECT ON public.tv_shows TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tv_shows TO authenticated;
GRANT ALL ON public.tv_shows TO service_role;
ALTER TABLE public.tv_shows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tv_shows readable" ON public.tv_shows FOR SELECT USING (true);
CREATE POLICY "tv_shows insert by admin/konsmik" ON public.tv_shows FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
        AND (p.username = 'konsmik' OR p.username = 'admin')
    )
  );
CREATE POLICY "tv_shows update by creator" ON public.tv_shows FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "tv_shows delete by creator" ON public.tv_shows FOR DELETE USING (auth.uid() = created_by);

CREATE TABLE public.tv_episodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  show_id UUID NOT NULL REFERENCES public.tv_shows(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  episode_number INT NOT NULL DEFAULT 1,
  season_number INT NOT NULL DEFAULT 1,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INT,
  views INT NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tv_episodes_show ON public.tv_episodes(show_id, season_number, episode_number);
GRANT SELECT ON public.tv_episodes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tv_episodes TO authenticated;
GRANT ALL ON public.tv_episodes TO service_role;
ALTER TABLE public.tv_episodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tv_episodes readable" ON public.tv_episodes FOR SELECT USING (true);
CREATE POLICY "tv_episodes write by show creator" ON public.tv_episodes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.tv_shows s WHERE s.id = show_id AND s.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tv_shows s WHERE s.id = show_id AND s.created_by = auth.uid()));

CREATE TABLE public.watch_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  episode_id UUID REFERENCES public.tv_episodes(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  ms_watched INT NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_watch_events_episode ON public.watch_events(episode_id);
CREATE INDEX idx_watch_events_post ON public.watch_events(post_id);
GRANT SELECT, INSERT ON public.watch_events TO authenticated;
GRANT INSERT ON public.watch_events TO anon;
GRANT ALL ON public.watch_events TO service_role;
ALTER TABLE public.watch_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "watch_events insert any" ON public.watch_events FOR INSERT WITH CHECK (true);
CREATE POLICY "watch_events select own" ON public.watch_events FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.increment_post_view(_post_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN UPDATE public.posts SET views = COALESCE(views, 0) + 1 WHERE id = _post_id; END;
$$;
GRANT EXECUTE ON FUNCTION public.increment_post_view(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.increment_episode_view(_episode_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN UPDATE public.tv_episodes SET views = COALESCE(views, 0) + 1 WHERE id = _episode_id; END;
$$;
GRANT EXECUTE ON FUNCTION public.increment_episode_view(UUID) TO anon, authenticated;
