import { supabase } from "@/integrations/supabase/client";

export const REACTIONS = [
  { kind: "like", emoji: "👍", label: "Like", color: "text-foreground/80" },
  { kind: "fire", emoji: "🔥", label: "Fire", color: "text-orange-400" },
  { kind: "insightful", emoji: "💡", label: "Insightful", color: "text-yellow-300" },
  { kind: "support", emoji: "🤝", label: "Support", color: "text-emerald-400" },
  { kind: "genius", emoji: "🧠", label: "Genius", color: "text-primary" },
  { kind: "respect", emoji: "🙏", label: "Respect", color: "text-accent" },
] as const;

export type ReactionKind = (typeof REACTIONS)[number]["kind"];

export const REACTION_WEIGHT: Record<ReactionKind, number> = {
  like: 1,
  fire: 1.5,
  insightful: 2,
  support: 1.8,
  genius: 2.5,
  respect: 2,
};

export type ReactionSummary = {
  counts: Record<ReactionKind, number>;
  total: number;
  mine: ReactionKind | null;
};

export async function fetchReactionSummaries(postIds: string[], uid?: string) {
  const map = new Map<string, ReactionSummary>();
  if (!postIds.length) return map;
  const { data } = await supabase
    .from("reactions")
    .select("post_id, user_id, kind")
    .in("post_id", postIds);
  postIds.forEach((id) =>
    map.set(id, { counts: { like: 0, fire: 0, insightful: 0, support: 0, genius: 0, respect: 0 }, total: 0, mine: null }),
  );
  (data ?? []).forEach((r: any) => {
    const s = map.get(r.post_id)!;
    s.counts[r.kind as ReactionKind] += 1;
    s.total += 1;
    if (uid && r.user_id === uid) s.mine = r.kind;
  });
  return map;
}

export async function setMyReaction(postId: string, userId: string, kind: ReactionKind | null) {
  // Clear any existing reactions by this user on this post, then insert if kind is set
  await supabase.from("reactions").delete().eq("post_id", postId).eq("user_id", userId);
  if (kind) {
    await supabase.from("reactions").insert({ post_id: postId, user_id: userId, kind });
  }
}