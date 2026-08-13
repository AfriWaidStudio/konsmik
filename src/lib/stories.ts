import { supabase } from "@/integrations/supabase/client";
import { uploadToMedia } from "./upload";

export type StoryRow = {
  id: string;
  author_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  created_at: string;
  expires_at: string;
};

export type StoryAuthor = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

export type StoryGroup = {
  author: StoryAuthor;
  stories: StoryRow[];
  seen: boolean;
};

export async function fetchActiveStoryGroups(viewerId?: string): Promise<StoryGroup[]> {
  const { data: rows, error } = await supabase
    .from("stories")
    .select("id, author_id, media_url, media_type, caption, created_at, expires_at")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true });
  if (error) throw error;
  const list = (rows ?? []) as StoryRow[];
  if (list.length === 0) return [];
  const authorIds = Array.from(new Set(list.map((s) => s.author_id)));
  const { data: profs } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", authorIds);
  const pmap = new Map((profs ?? []).map((p: any) => [p.id, p]));

  let seenIds = new Set<string>();
  if (viewerId) {
    const { data: v } = await supabase
      .from("story_views")
      .select("story_id")
      .eq("viewer_id", viewerId)
      .in("story_id", list.map((s) => s.id));
    seenIds = new Set((v ?? []).map((r: any) => r.story_id));
  }

  const byAuthor = new Map<string, StoryGroup>();
  for (const s of list) {
    const author = pmap.get(s.author_id);
    if (!author) continue;
    if (!byAuthor.has(s.author_id)) {
      byAuthor.set(s.author_id, { author: author as StoryAuthor, stories: [], seen: true });
    }
    const g = byAuthor.get(s.author_id)!;
    g.stories.push(s);
    if (!seenIds.has(s.id)) g.seen = false;
  }
  // Own group first, then unseen, then seen
  const arr = Array.from(byAuthor.values());
  arr.sort((a, b) => {
    if (viewerId) {
      if (a.author.id === viewerId && b.author.id !== viewerId) return -1;
      if (b.author.id === viewerId && a.author.id !== viewerId) return 1;
    }
    if (a.seen !== b.seen) return a.seen ? 1 : -1;
    return 0;
  });
  return arr;
}

export async function createStory(file: File, userId: string, caption?: string) {
  const url = await uploadToMedia(file, userId, "stories");
  const media_type = file.type.startsWith("video") ? "video" : "image";
  const { error } = await supabase.from("stories").insert({
    author_id: userId,
    media_url: url,
    media_type,
    caption: caption ?? null,
  });
  if (error) throw error;
}

export async function markStoryViewed(storyId: string, viewerId: string) {
  await supabase.from("story_views").upsert(
    { story_id: storyId, viewer_id: viewerId },
    { onConflict: "story_id,viewer_id", ignoreDuplicates: true },
  );
}

export async function deleteStory(storyId: string) {
  const { error } = await supabase.from("stories").delete().eq("id", storyId);
  if (error) throw error;
}