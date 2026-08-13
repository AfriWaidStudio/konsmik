import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

/* ---------------- Audience dials ---------------- */
export type Audience = "public" | "followers" | "circle" | "close" | "space";

export const AUDIENCES: { id: Audience; label: string; hint: string }[] = [
  { id: "public", label: "Everyone", hint: "Anyone on Kons and the open web" },
  { id: "followers", label: "Followers", hint: "Only people who follow you" },
  { id: "circle", label: "My circles", hint: "Members of circles you belong to" },
  { id: "close", label: "Close friends", hint: "People you follow back" },
  { id: "space", label: "Space only", hint: "Stays inside the selected space" },
];

/* ---------------- Time capsule ---------------- */
export function capsuleState(post: { unlock_at?: string | null; expire_at?: string | null }) {
  const now = Date.now();
  if (post.unlock_at && new Date(post.unlock_at).getTime() > now) {
    return { locked: true, expired: false, at: post.unlock_at } as const;
  }
  if (post.expire_at && new Date(post.expire_at).getTime() < now) {
    return { locked: false, expired: true, at: post.expire_at } as const;
  }
  return { locked: false, expired: false, at: null } as const;
}

/* ---------------- Context receipts ---------------- */
export type PostContext = {
  id: string; post_id: string; kind: "summary" | "counter" | "check";
  content: string; model: string | null; created_at: string;
};

export async function listPostContext(post_id: string): Promise<PostContext[]> {
  const { data } = await db.from("post_context").select("*").eq("post_id", post_id);
  return (data ?? []) as PostContext[];
}

export async function savePostContext(post_id: string, kind: PostContext["kind"], content: string, model: string, created_by: string) {
  const { error } = await db.from("post_context")
    .upsert({ post_id, kind, content, model, created_by }, { onConflict: "post_id,kind" });
  if (error) throw error;
}

/* ---------------- Proof of human + reputation ---------------- */
export type HumanProof = { user_id: string; method: string; score: number; verified_at: string };

export async function getHumanProof(user_id: string): Promise<HumanProof | null> {
  const { data } = await db.from("human_proofs").select("*").eq("user_id", user_id).maybeSingle();
  return (data as HumanProof) ?? null;
}

export async function verifyHuman(user_id: string, method: string, score = 100) {
  const { error } = await db.from("human_proofs")
    .upsert({ user_id, method, score, verified_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) throw error;
  await addReputation(user_id, "human_verified", 25);
}

export type ReputationEvent = {
  id: string; user_id: string; kind: string; points: number;
  ref_type: string | null; ref_id: string | null; created_at: string;
};

export const REPUTATION_LABELS: Record<string, string> = {
  human_verified: "Verified as human",
  post_created: "Shared a post",
  helpful_comment: "Helpful comment",
  tip_received: "Received a tip",
  context_added: "Added context",
  space_created: "Created a space",
};

export async function addReputation(user_id: string, kind: string, points: number, ref_type?: string, ref_id?: string) {
  await db.from("reputation_events").insert({ user_id, kind, points, ref_type: ref_type ?? null, ref_id: ref_id ?? null });
}

export async function listReputation(user_id: string, limit = 40): Promise<ReputationEvent[]> {
  const { data } = await db.from("reputation_events").select("*").eq("user_id", user_id)
    .order("created_at", { ascending: false }).limit(limit);
  return (data ?? []) as ReputationEvent[];
}

export function reputationTier(score: number) {
  if (score >= 5000) return { label: "Architect", level: 6 };
  if (score >= 2000) return { label: "Luminary", level: 5 };
  if (score >= 800) return { label: "Guide", level: 4 };
  if (score >= 300) return { label: "Builder", level: 3 };
  if (score >= 80) return { label: "Contributor", level: 2 };
  return { label: "Newcomer", level: 1 };
}

/* ---------------- Tips & revenue splits ---------------- */
export type Split = { id: string; post_id: string; user_id: string; percent: number };

export async function tipPost(post_id: string, amount: number) {
  const { data, error } = await db.rpc("tip_post", { _post_id: post_id, _amount: amount });
  if (error) throw error;
  return data as number;
}

export async function listSplits(post_id: string): Promise<Split[]> {
  const { data } = await db.from("revenue_splits").select("*").eq("post_id", post_id);
  return (data ?? []) as Split[];
}

export async function setSplit(post_id: string, user_id: string, percent: number) {
  const { error } = await db.from("revenue_splits")
    .upsert({ post_id, user_id, percent }, { onConflict: "post_id,user_id" });
  if (error) throw error;
}

export async function removeSplit(id: string) {
  const { error } = await db.from("revenue_splits").delete().eq("id", id);
  if (error) throw error;
}

export async function postTipTotal(post_id: string) {
  const { data } = await db.from("post_tips").select("amount").eq("post_id", post_id);
  return ((data ?? []) as { amount: number }[]).reduce((a, b) => a + Number(b.amount), 0);
}