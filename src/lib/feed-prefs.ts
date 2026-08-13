import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type FeedPrefs = { sort: "latest" | "trending"; hide_reposts: boolean; muted_words: string[] };
export const DEFAULT_PREFS: FeedPrefs = { sort: "latest", hide_reposts: false, muted_words: [] };

export async function fetchFeedPrefs(uid: string): Promise<FeedPrefs> {
  const { data } = await db.from("feed_prefs").select("*").eq("user_id", uid).maybeSingle();
  if (!data) return DEFAULT_PREFS;
  return { sort: data.sort ?? "latest", hide_reposts: !!data.hide_reposts, muted_words: data.muted_words ?? [] };
}

export async function saveFeedPrefs(uid: string, prefs: Partial<FeedPrefs>) {
  const { error } = await db
    .from("feed_prefs")
    .upsert({ user_id: uid, ...prefs, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) throw error;
}

export function applyFeedPrefs<T extends { body: string; repost_of?: string | null }>(posts: T[], prefs: FeedPrefs): T[] {
  const words = prefs.muted_words.map((w) => w.trim().toLowerCase()).filter(Boolean);
  return posts.filter((p) => {
    if (prefs.hide_reposts && p.repost_of) return false;
    if (!words.length) return true;
    const body = (p.body ?? "").toLowerCase();
    return !words.some((w) => body.includes(w));
  });
}

/* ---------- Followed hashtags ---------- */

export async function fetchFollowedTags(uid: string): Promise<string[]> {
  const { data } = await db.from("followed_tags").select("tag").eq("user_id", uid).order("created_at", { ascending: false });
  return (data ?? []).map((r: any) => r.tag);
}

export async function isFollowingTag(uid: string, tag: string) {
  const { data } = await db.from("followed_tags").select("tag").eq("user_id", uid).eq("tag", tag.toLowerCase()).maybeSingle();
  return !!data;
}

export async function toggleFollowTag(uid: string, tag: string) {
  const t = tag.toLowerCase();
  const following = await isFollowingTag(uid, t);
  if (following) await db.from("followed_tags").delete().eq("user_id", uid).eq("tag", t);
  else await db.from("followed_tags").insert({ user_id: uid, tag: t });
  return !following;
}

/* ---------- Edit history ---------- */

export async function recordEdit(post_id: string, editor_id: string, body: string) {
  await db.from("post_edit_history").insert({ post_id, editor_id, body });
}

export async function fetchEditHistory(post_id: string) {
  const { data } = await db
    .from("post_edit_history")
    .select("id, body, created_at")
    .eq("post_id", post_id)
    .order("created_at", { ascending: false });
  return (data ?? []) as { id: string; body: string; created_at: string }[];
}

/* ---------- Post analytics (author only view) ---------- */

export async function fetchPostAnalytics(post_id: string) {
  const [{ data: post }, reactions, comments, reposts, tips, bookmarks] = await Promise.all([
    db.from("posts").select("views, created_at").eq("id", post_id).maybeSingle(),
    db.from("reactions").select("id", { count: "exact", head: true }).eq("post_id", post_id),
    db.from("comments").select("id", { count: "exact", head: true }).eq("post_id", post_id),
    db.from("reposts").select("id", { count: "exact", head: true }).eq("post_id", post_id),
    db.from("post_tips").select("amount").eq("post_id", post_id),
    db.from("bookmarks").select("id", { count: "exact", head: true }).eq("post_id", post_id),
  ]);
  const views = post?.views ?? 0;
  const rc = reactions.count ?? 0;
  const cc = comments.count ?? 0;
  const rp = reposts.count ?? 0;
  const earned = (tips.data ?? []).reduce((s: number, t: any) => s + Number(t.amount ?? 0), 0);
  return {
    views,
    reactions: rc,
    comments: cc,
    reposts: rp,
    bookmarks: bookmarks.count ?? 0,
    tips: earned,
    engagement_rate: views ? Math.round(((rc + cc + rp) / views) * 1000) / 10 : 0,
    created_at: post?.created_at ?? null,
  };
}