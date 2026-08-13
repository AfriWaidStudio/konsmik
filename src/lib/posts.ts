import { supabase } from "@/integrations/supabase/client";
import type { PostRow } from "@/components/post/PostCard";
import { fetchReactionSummaries } from "./reactions";
import { fetchPollsForPosts, createPollForPost } from "./polls";

type RawPost = {
  id: string;
  body: string;
  category: string | null;
  hashtags: string[] | null;
  trending: boolean;
  views: number;
  tokens: number;
  created_at: string;
  type: string;
  author_id: string;
  space_id?: string | null;
  pinned?: boolean;
  edited_at?: string | null;
  media_url?: string | null;
};

async function hydrate(rows: RawPost[], uid?: string): Promise<PostRow[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const authorIds = Array.from(new Set(rows.map((r) => r.author_id)));
  const spaceIds = Array.from(new Set(rows.map((r) => r.space_id).filter(Boolean))) as string[];
  const [{ data: profiles }, { data: likes }, { data: comments }, { data: myLikes }, reactionMap, pollMap] = await Promise.all([
    supabase.from("profiles").select("id, username, display_name, title, avatar_url").in("id", authorIds),
    supabase.from("likes").select("post_id").in("post_id", ids),
    supabase.from("comments").select("post_id").in("post_id", ids),
    uid
      ? supabase.from("likes").select("post_id").in("post_id", ids).eq("user_id", uid)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
    fetchReactionSummaries(ids, uid),
    fetchPollsForPosts(ids, uid),
  ]);
  const pmap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const lcount = new Map<string, number>();
  (likes ?? []).forEach((l) => lcount.set(l.post_id, (lcount.get(l.post_id) ?? 0) + 1));
  const ccount = new Map<string, number>();
  (comments ?? []).forEach((c) => ccount.set(c.post_id, (ccount.get(c.post_id) ?? 0) + 1));
  const mine = new Set((myLikes ?? []).map((l: any) => l.post_id));

  let smap = new Map<string, any>();
  if (spaceIds.length) {
    const { data: spaces } = await supabase
      .from("spaces")
      .select("id, slug, name, kind, avatar_url, theme_color, verified")
      .in("id", spaceIds);
    smap = new Map((spaces ?? []).map((s: any) => [s.id, s]));
  }

  return rows.map((r) => {
    const p = pmap.get(r.author_id);
    const rsum = reactionMap.get(r.id);
    const poll = pollMap.get(r.id);
    return {
      id: r.id,
      body: r.body,
      category: r.category,
      hashtags: r.hashtags ?? [],
      trending: r.trending,
      views: r.views,
      tokens: r.tokens,
      created_at: r.created_at,
      type: r.type,
      author_id: r.author_id,
      pinned: r.pinned ?? false,
      edited_at: r.edited_at ?? null,
      media_url: r.media_url ?? null,
      poll: poll ?? null,
      space_id: r.space_id ?? null,
      space: r.space_id ? (smap.get(r.space_id) ?? null) : null,
      author: p
        ? { username: p.username, display_name: p.display_name, title: p.title, avatar_url: p.avatar_url }
        : null,
      likes_count: lcount.get(r.id) ?? 0,
      comments_count: ccount.get(r.id) ?? 0,
      liked_by_me: mine.has(r.id),
      reactions_total: rsum?.total ?? 0,
      my_reaction: rsum?.mine ?? null,
    };
  });
}

export async function fetchPosts(community: "kons" | "waides" | "smai" = "kons", uid?: string): Promise<PostRow[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("id, body, category, hashtags, trending, views, tokens, created_at, type, author_id, space_id, pinned, edited_at, media_url")
    .eq("community", community)
    .is("space_id", null)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return hydrate(data as RawPost[], uid);
}

export async function fetchTrendingPosts(uid?: string) {
  const { data: trending } = await supabase.rpc("trending_posts", { _limit: 50 });
  if (!trending?.length) return [];
  const ids = trending.map((t: any) => t.post_id);
  const { data } = await supabase
    .from("posts")
    .select("id, body, category, hashtags, trending, views, tokens, created_at, type, author_id, space_id, pinned, edited_at, media_url")
    .in("id", ids)
    .is("space_id", null);
  const order = new Map(ids.map((id: string, i: number) => [id, i]));
  const sorted = (data ?? []).slice().sort((a: any, b: any) => (order.get(a.id)! - order.get(b.id)!));
  return hydrate(sorted as RawPost[], uid);
}

export async function fetchPostsByHashtag(tag: string, uid?: string) {
  const { data, error } = await supabase
    .from("posts")
    .select("id, body, category, hashtags, trending, views, tokens, created_at, type, author_id, space_id, pinned, edited_at, media_url")
    .contains("hashtags", [tag])
    .is("space_id", null)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return hydrate(data as RawPost[], uid);
}

export async function fetchFollowingPosts(uid: string): Promise<PostRow[]> {
  const { data: f } = await supabase.from("follows").select("following_id").eq("follower_id", uid);
  const ids = (f ?? []).map((r: any) => r.following_id as string);
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from("posts")
    .select("id, body, category, hashtags, trending, views, tokens, created_at, type, author_id, space_id, pinned, edited_at, media_url")
    .in("author_id", ids)
    .is("space_id", null)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return hydrate(data as RawPost[], uid);
}

export async function fetchPostsBySpace(space_id: string, uid?: string) {
  const { data, error } = await supabase
    .from("posts")
    .select("id, body, category, hashtags, trending, views, tokens, created_at, type, author_id, space_id, pinned, edited_at, media_url")
    .eq("space_id", space_id)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return hydrate(data as RawPost[], uid);
}

export async function fetchPostsByAuthor(author_id: string, uid?: string) {
  const { data, error } = await supabase
    .from("posts")
    .select("id, body, category, hashtags, trending, views, tokens, created_at, type, author_id, space_id, pinned, edited_at, media_url")
    .eq("author_id", author_id)
    .is("space_id", null)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return hydrate(data as RawPost[], uid);
}

export async function fetchPostById(id: string, uid?: string): Promise<PostRow | null> {
  const { data } = await supabase
    .from("posts")
    .select("id, body, category, hashtags, trending, views, tokens, created_at, type, author_id, space_id, pinned, edited_at, media_url")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const [r] = await hydrate([data as RawPost], uid);
  return r ?? null;
}

export function parseMentions(body: string): string[] {
  const set = new Set<string>();
  const re = /@([a-z0-9_]{2,30})/gi;
  let m;
  while ((m = re.exec(body)) !== null) set.add(m[1].toLowerCase());
  return [...set];
}

export async function createPost(input: {
  author_id: string;
  body: string;
  type?: "discussion" | "article" | "image" | "reel" | "ai_insight";
  category?: string | null;
  hashtags?: string[];
  media_url?: string | null;
  space_id?: string | null;
  poll?: { question: string; options: string[]; multi_select?: boolean; closes_at?: string | null } | null;
}) {
  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: input.author_id,
      body: input.body,
      type: input.type ?? "discussion",
      category: input.category ?? null,
      hashtags: input.hashtags ?? [],
      media_url: input.media_url ?? null,
      space_id: input.space_id ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;

  // resolve mentions to user ids
  const usernames = parseMentions(input.body);
  if (usernames.length) {
    const { data: ps } = await supabase.from("profiles").select("id, username").in("username", usernames);
    if (ps?.length) {
      await supabase.from("mentions").insert(
        ps.map((p) => ({ post_id: data.id, mentioned_user_id: p.id, by_user_id: input.author_id })),
      );
    }
  }

  if (input.poll && input.poll.question.trim() && input.poll.options.filter((o) => o.trim()).length >= 2) {
    await createPollForPost(
      data.id,
      input.poll.question.trim(),
      input.poll.options.map((o) => o.trim()).filter(Boolean),
      input.poll.multi_select ?? false,
      input.poll.closes_at ?? null,
    );
  }
  return data.id as string;
}
