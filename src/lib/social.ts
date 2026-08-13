import { supabase } from "@/integrations/supabase/client";
import { uploadToMedia } from "./upload";

export const INTERESTS = [
  "AI & Machine Learning", "Consciousness", "Startups", "Design", "Crypto & Web3",
  "Science", "Health & Fitness", "Music", "Film & TV", "Gaming", "Books",
  "Travel", "Food", "Photography", "Fashion", "Sports", "Spirituality",
  "Education", "Climate", "Politics", "Comedy", "Art", "Engineering", "Dating & Relationships",
];

export type UserSettings = {
  notif_follows: boolean;
  notif_likes: boolean;
  notif_comments: boolean;
  notif_mentions: boolean;
  notif_messages: boolean;
  notif_recommendations: boolean;
  dm_privacy: "everyone" | "following" | "nobody";
  show_activity: boolean;
  discoverable: boolean;
};

export const DEFAULT_SETTINGS: UserSettings = {
  notif_follows: true,
  notif_likes: true,
  notif_comments: true,
  notif_mentions: true,
  notif_messages: true,
  notif_recommendations: true,
  dm_privacy: "everyone",
  show_activity: true,
  discoverable: true,
};

export async function fetchSettings(uid: string): Promise<UserSettings> {
  const { data } = await supabase.from("user_settings" as any).select("*").eq("user_id", uid).maybeSingle();
  return { ...DEFAULT_SETTINGS, ...((data ?? {}) as any) };
}

export async function saveSettings(uid: string, next: Partial<UserSettings>) {
  const { error } = await supabase
    .from("user_settings" as any)
    .upsert({ user_id: uid, ...next } as any, { onConflict: "user_id" });
  if (error) throw error;
}

export async function updateProfile(uid: string, patch: Record<string, any>) {
  const { error } = await supabase.from("profiles").update(patch as any).eq("id", uid);
  if (error) throw error;
}

export async function uploadProfileImage(file: File, uid: string, kind: "avatar" | "cover") {
  const url = await uploadToMedia(file, uid, kind === "avatar" ? "avatars" : "covers");
  await updateProfile(uid, kind === "avatar" ? { avatar_url: url } : { cover_url: url });
  return url;
}

export type SuggestedPerson = {
  id: string;
  username: string;
  display_name: string;
  title: string | null;
  avatar_url: string | null;
  bio: string | null;
  reputation: number;
  mutuals: number;
  shared_interests: number;
  reason: string;
};

export async function fetchSuggestedPeople(uid: string, limit = 12): Promise<SuggestedPerson[]> {
  const { data, error } = await supabase.rpc("suggested_people" as any, { _user: uid, _limit: limit } as any);
  if (error) return [];
  return (data ?? []) as SuggestedPerson[];
}

export async function followUser(uid: string, target: string) {
  const { error } = await supabase.from("follows").insert({ follower_id: uid, following_id: target });
  if (error && !error.message.includes("duplicate")) throw error;
}

export async function unfollowUser(uid: string, target: string) {
  await supabase.from("follows").delete().eq("follower_id", uid).eq("following_id", target);
}

export async function fetchFollowIds(uid: string) {
  const { data } = await supabase.from("follows").select("following_id").eq("follower_id", uid);
  return new Set((data ?? []).map((r: any) => r.following_id as string));
}

export async function fetchFollowList(userId: string, kind: "followers" | "following") {
  const col = kind === "followers" ? "following_id" : "follower_id";
  const other = kind === "followers" ? "follower_id" : "following_id";
  const { data } = await supabase.from("follows").select(other).eq(col, userId).limit(200);
  const ids = (data ?? []).map((r: any) => r[other] as string);
  if (!ids.length) return [];
  const { data: ps } = await supabase
    .from("profiles")
    .select("id, username, display_name, title, avatar_url")
    .in("id", ids);
  return ps ?? [];
}

// ---- Mutes & blocks -------------------------------------------------------

export async function muteUser(uid: string, target: string) {
  await supabase.from("mutes" as any).insert({ muter_id: uid, muted_id: target } as any);
}
export async function unmuteUser(uid: string, target: string) {
  await supabase.from("mutes" as any).delete().eq("muter_id", uid).eq("muted_id", target);
}
export async function blockUser(uid: string, target: string) {
  await supabase.from("blocks").insert({ blocker_id: uid, blocked_id: target } as any);
}
export async function unblockUser(uid: string, target: string) {
  await supabase.from("blocks").delete().eq("blocker_id", uid).eq("blocked_id", target);
}

async function listWithProfiles(ids: string[]) {
  if (!ids.length) return [];
  const { data } = await supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", ids);
  return data ?? [];
}

export async function fetchMuted(uid: string) {
  const { data } = await supabase.from("mutes" as any).select("muted_id").eq("muter_id", uid);
  return listWithProfiles((data ?? []).map((r: any) => r.muted_id));
}

export async function fetchBlocked(uid: string) {
  const { data } = await supabase.from("blocks").select("blocked_id").eq("blocker_id", uid);
  return listWithProfiles((data ?? []).map((r: any) => r.blocked_id));
}

export async function fetchMutedIds(uid: string) {
  const [{ data: m }, { data: b }] = await Promise.all([
    supabase.from("mutes" as any).select("muted_id").eq("muter_id", uid),
    supabase.from("blocks").select("blocked_id").eq("blocker_id", uid),
  ]);
  return new Set([
    ...(m ?? []).map((r: any) => r.muted_id as string),
    ...(b ?? []).map((r: any) => r.blocked_id as string),
  ]);
}
