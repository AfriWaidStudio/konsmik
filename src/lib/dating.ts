import { supabase } from "@/integrations/supabase/client";

export type DatingProfile = {
  user_id: string;
  active: boolean;
  age: number | null;
  gender: string;
  interested_in: string[];
  bio: string | null;
  photos: string[];
  location: string | null;
  looking_for: string;
  interests: string[];
  min_age: number;
  max_age: number;
};

export type DeckCandidate = {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  age: number | null;
  gender: string;
  bio: string | null;
  photos: string[];
  location: string | null;
  looking_for: string;
  interests: string[];
};

export type MatchRow = {
  id: string;
  thread_id: string | null;
  created_at: string;
  other: { id: string; username: string; display_name: string; avatar_url: string | null } | null;
};

export async function fetchMyDatingProfile(userId: string): Promise<DatingProfile | null> {
  const { data, error } = await supabase.from("dating_profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return (data as DatingProfile) ?? null;
}

export async function upsertDatingProfile(userId: string, patch: Partial<DatingProfile>) {
  const { data, error } = await supabase
    .from("dating_profiles")
    .upsert({ user_id: userId, ...patch } as any, { onConflict: "user_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data as DatingProfile;
}

export async function fetchDeck(userId: string, limit = 30): Promise<DeckCandidate[]> {
  const { data, error } = await supabase.rpc("dating_deck", { _user: userId, _limit: limit });
  if (error) throw error;
  return (data ?? []) as DeckCandidate[];
}

export async function swipe(from: string, to: string, action: "like" | "pass" | "superlike") {
  const { error } = await supabase.from("dating_swipes").insert({ from_user: from, to_user: to, action });
  if (error && !`${error.message}`.toLowerCase().includes("duplicate")) throw error;
  if (action === "pass") return { matched: false, thread_id: null as string | null };
  const [a, b] = from < to ? [from, to] : [to, from];
  const { data } = await supabase
    .from("dating_matches")
    .select("id, thread_id")
    .eq("user_a", a)
    .eq("user_b", b)
    .maybeSingle();
  return { matched: !!data, thread_id: (data?.thread_id as string | null) ?? null };
}

export async function undoLastSwipe(userId: string) {
  const { data } = await supabase
    .from("dating_swipes")
    .select("id")
    .eq("from_user", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return false;
  await supabase.from("dating_swipes").delete().eq("id", data.id);
  return true;
}

export async function fetchMatches(userId: string): Promise<MatchRow[]> {
  const { data, error } = await supabase
    .from("dating_matches")
    .select("id, user_a, user_b, thread_id, created_at")
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as any[];
  const otherIds = rows.map((r) => (r.user_a === userId ? r.user_b : r.user_a));
  if (!otherIds.length) return [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", otherIds);
  const pmap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
  return rows.map((r) => ({
    id: r.id,
    thread_id: r.thread_id,
    created_at: r.created_at,
    other: (pmap.get(r.user_a === userId ? r.user_b : r.user_a) as any) ?? null,
  }));
}

export async function unmatch(matchId: string) {
  const { error } = await supabase.from("dating_matches").delete().eq("id", matchId);
  if (error) throw error;
}

export async function fetchLikesYou(userId: string) {
  const { data } = await supabase
    .from("dating_swipes")
    .select("from_user, action, created_at")
    .eq("to_user", userId)
    .neq("action", "pass")
    .order("created_at", { ascending: false })
    .limit(50);
  const rows = (data ?? []) as any[];
  if (!rows.length) return [];
  const { data: mine } = await supabase.from("dating_swipes").select("to_user").eq("from_user", userId);
  const swiped = new Set((mine ?? []).map((r: any) => r.to_user));
  const pending = rows.filter((r) => !swiped.has(r.from_user));
  if (!pending.length) return [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", pending.map((r) => r.from_user));
  const pmap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
  return pending.map((r) => ({ ...r, profile: pmap.get(r.from_user) as any }));
}
/* ---------------- Dating extras ---------------- */

export type DatingStats = {
  likesSent: number;
  passes: number;
  superlikes: number;
  likesReceived: number;
  matches: number;
};

export async function fetchDatingStats(userId: string): Promise<DatingStats> {
  const [{ data: sent }, { data: received }, { count: matchCount }] = await Promise.all([
    supabase.from("dating_swipes").select("action").eq("from_user", userId),
    supabase.from("dating_swipes").select("action").eq("to_user", userId).neq("action", "pass"),
    supabase
      .from("dating_matches")
      .select("id", { count: "exact", head: true })
      .or(`user_a.eq.${userId},user_b.eq.${userId}`),
  ]);
  const rows = (sent ?? []) as { action: string }[];
  return {
    likesSent: rows.filter((r) => r.action === "like").length,
    passes: rows.filter((r) => r.action === "pass").length,
    superlikes: rows.filter((r) => r.action === "superlike").length,
    likesReceived: (received ?? []).length,
    matches: matchCount ?? 0,
  };
}

export type DeckFilters = {
  location: string;
  lookingFor: string | null;
  interest: string;
  withPhotosOnly: boolean;
};

export const EMPTY_FILTERS: DeckFilters = { location: "", lookingFor: null, interest: "", withPhotosOnly: false };

export function applyDeckFilters(deck: DeckCandidate[], f: DeckFilters) {
  const loc = f.location.trim().toLowerCase();
  const int = f.interest.trim().toLowerCase();
  return deck.filter((c) => {
    if (loc && !(c.location ?? "").toLowerCase().includes(loc)) return false;
    if (f.lookingFor && c.looking_for !== f.lookingFor) return false;
    if (int && !(c.interests ?? []).some((i) => i.toLowerCase().includes(int))) return false;
    if (f.withPhotosOnly && !(c.photos?.length || c.avatar_url)) return false;
    return true;
  });
}

export const ICEBREAKERS = [
  "Hey! What's been lighting you up lately?",
  "Your profile made me curious — what are you building right now?",
  "If we grabbed coffee tomorrow, what would we talk about?",
  "What's one thing you'd never compromise on?",
  "Recommend me something: song, book or place. Go.",
];

export async function sendIcebreaker(threadId: string, senderId: string, body: string) {
  const { error } = await supabase.from("dm_messages").insert({ thread_id: threadId, sender_id: senderId, body });
  if (error) throw error;
}

export function profileCompleteness(p: DatingProfile | null) {
  if (!p) return { percent: 0, missing: ["Create your profile"] };
  const checks: { ok: boolean; label: string }[] = [
    { ok: !!p.photos?.length, label: "Add a photo" },
    { ok: (p.photos?.length ?? 0) >= 3, label: "Add 3+ photos" },
    { ok: !!p.bio && p.bio.trim().length >= 40, label: "Write a fuller bio" },
    { ok: !!p.location, label: "Add your location" },
    { ok: (p.interests?.length ?? 0) >= 3, label: "Add 3+ interests" },
    { ok: !!p.age, label: "Set your age" },
    { ok: p.active, label: "Turn on Discover visibility" },
  ];
  const done = checks.filter((c) => c.ok).length;
  return {
    percent: Math.round((done / checks.length) * 100),
    missing: checks.filter((c) => !c.ok).map((c) => c.label),
  };
}
