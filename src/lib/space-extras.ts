import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

/* ---------------- Roles & permissions ---------------- */
export type SpaceRole = "admin" | "moderator" | "member";

export type Permission =
  | "post"
  | "comment"
  | "invite"
  | "manage_members"
  | "manage_content"
  | "manage_settings"
  | "moderate"
  | "manage_money";

export const ROLE_MATRIX: Record<SpaceRole, Permission[]> = {
  admin: ["post", "comment", "invite", "manage_members", "manage_content", "manage_settings", "moderate", "manage_money"],
  moderator: ["post", "comment", "invite", "manage_content", "moderate"],
  member: ["post", "comment", "invite"],
};

export function can(role: SpaceRole | null | undefined, perm: Permission) {
  if (!role) return false;
  return ROLE_MATRIX[role]?.includes(perm) ?? false;
}

export const ROLE_LABEL: Record<SpaceRole, string> = {
  admin: "Admin",
  moderator: "Moderator",
  member: "Member",
};

/* ---------------- Channels / topics ---------------- */
export type SpaceChannel = {
  id: string; space_id: string; name: string; slug: string;
  description: string | null; position: number; created_by: string; created_at: string;
};

export async function listChannels(space_id: string): Promise<SpaceChannel[]> {
  const { data, error } = await db.from("space_channels").select("*").eq("space_id", space_id)
    .order("position").order("created_at");
  if (error) throw error;
  return (data ?? []) as SpaceChannel[];
}

export async function createChannel(space_id: string, name: string, created_by: string, description?: string) {
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "topic";
  const { error } = await db.from("space_channels")
    .insert({ space_id, name, slug, created_by, description: description ?? null });
  if (error) throw error;
}

export async function deleteChannel(id: string) {
  const { error } = await db.from("space_channels").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------- Files & resources ---------------- */
export type SpaceFile = {
  id: string; space_id: string; title: string; url: string; mime: string | null;
  size_bytes: number | null; pinned: boolean; uploaded_by: string; created_at: string;
};

export async function listFiles(space_id: string): Promise<SpaceFile[]> {
  const { data, error } = await db.from("space_files").select("*").eq("space_id", space_id)
    .order("pinned", { ascending: false }).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SpaceFile[];
}

export async function addFile(input: { space_id: string; title: string; url: string; mime?: string | null; size_bytes?: number | null; uploaded_by: string }) {
  const { error } = await db.from("space_files").insert(input);
  if (error) throw error;
}

export async function togglePinFile(id: string, pinned: boolean) {
  const { error } = await db.from("space_files").update({ pinned }).eq("id", id);
  if (error) throw error;
}

export async function deleteFile(id: string) {
  const { error } = await db.from("space_files").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------- Rules acceptance ---------------- */
export async function hasAcceptedRules(space_id: string, user_id: string) {
  const { data } = await db.from("space_rules_accepts").select("space_id")
    .eq("space_id", space_id).eq("user_id", user_id).maybeSingle();
  return !!data;
}

export async function acceptRules(space_id: string, user_id: string) {
  const { error } = await db.from("space_rules_accepts").insert({ space_id, user_id });
  if (error && !String(error.message).toLowerCase().includes("duplicate")) throw error;
}

/* ---------------- Bans / mutes ---------------- */
export type SpaceBan = {
  id: string; space_id: string; user_id: string; reason: string | null;
  kind: "ban" | "mute"; until: string | null; banned_by: string; created_at: string;
  profile?: { username: string; display_name: string; avatar_url: string | null } | null;
};

export async function listBans(space_id: string): Promise<SpaceBan[]> {
  const { data } = await db.from("space_bans").select("*").eq("space_id", space_id)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as SpaceBan[];
  return attachProfiles(rows, (r) => r.user_id);
}

export async function banMember(space_id: string, user_id: string, banned_by: string, kind: "ban" | "mute" = "ban", reason?: string, until?: string | null) {
  const { error } = await db.from("space_bans")
    .upsert({ space_id, user_id, banned_by, kind, reason: reason ?? null, until: until ?? null }, { onConflict: "space_id,user_id" });
  if (error) throw error;
  if (kind === "ban") {
    await db.from("space_members").delete().eq("space_id", space_id).eq("user_id", user_id);
  }
  await logAction(space_id, banned_by, kind === "ban" ? "member_banned" : "member_muted", "user", user_id);
}

export async function liftBan(space_id: string, user_id: string, by: string) {
  const { error } = await db.from("space_bans").delete().eq("space_id", space_id).eq("user_id", user_id);
  if (error) throw error;
  await logAction(space_id, by, "ban_lifted", "user", user_id);
}

export async function isBanned(space_id: string, user_id: string) {
  const { data } = await db.from("space_bans").select("kind, until")
    .eq("space_id", space_id).eq("user_id", user_id).maybeSingle();
  if (!data) return null;
  if (data.until && new Date(data.until) < new Date()) return null;
  return data as { kind: "ban" | "mute"; until: string | null };
}

/* ---------------- Audit log ---------------- */
export type AuditEntry = {
  id: string; space_id: string; actor_id: string; action: string;
  target_type: string | null; target_id: string | null; meta: Record<string, unknown>; created_at: string;
  profile?: { username: string; display_name: string; avatar_url: string | null } | null;
};

export async function logAction(space_id: string, actor_id: string, action: string, target_type?: string, target_id?: string, meta: Record<string, unknown> = {}) {
  await db.from("space_audit_log").insert({ space_id, actor_id, action, target_type: target_type ?? null, target_id: target_id ?? null, meta });
}

export async function listAudit(space_id: string, limit = 60): Promise<AuditEntry[]> {
  const { data } = await db.from("space_audit_log").select("*").eq("space_id", space_id)
    .order("created_at", { ascending: false }).limit(limit);
  const rows = (data ?? []) as AuditEntry[];
  return attachProfiles(rows, (r) => r.actor_id);
}

/* ---------------- Membership questions ---------------- */
export type MembershipQuestion = { id: string; space_id: string; question: string; position: number; required: boolean };

export async function listQuestions(space_id: string): Promise<MembershipQuestion[]> {
  const { data } = await db.from("space_membership_questions").select("*").eq("space_id", space_id)
    .order("position").order("created_at");
  return (data ?? []) as MembershipQuestion[];
}

export async function addQuestion(space_id: string, question: string, required = true) {
  const { error } = await db.from("space_membership_questions").insert({ space_id, question, required });
  if (error) throw error;
}

export async function deleteQuestion(id: string) {
  const { error } = await db.from("space_membership_questions").delete().eq("id", id);
  if (error) throw error;
}

export async function saveJoinAnswers(rows: { request_id: string; question_id: string; space_id: string; user_id: string; answer: string }[]) {
  if (!rows.length) return;
  const { error } = await db.from("space_join_answers").insert(rows);
  if (error) throw error;
}

export async function listAnswersForRequest(request_id: string) {
  const { data } = await db.from("space_join_answers").select("question_id, answer").eq("request_id", request_id);
  return (data ?? []) as { question_id: string; answer: string }[];
}

/* ---------------- Member badges ---------------- */
export type MemberBadge = { id: string; space_id: string; user_id: string; badge: string; awarded_by: string; created_at: string };

export const BADGE_OPTIONS = [
  "Founder", "Top contributor", "Verified buyer", "Helper", "Creator", "Veteran", "Moderator pick",
] as const;

export async function listBadges(space_id: string): Promise<MemberBadge[]> {
  const { data } = await db.from("space_badges").select("*").eq("space_id", space_id);
  return (data ?? []) as MemberBadge[];
}

export async function awardBadge(space_id: string, user_id: string, badge: string, awarded_by: string) {
  const { error } = await db.from("space_badges").insert({ space_id, user_id, badge, awarded_by });
  if (error && !String(error.message).toLowerCase().includes("duplicate")) throw error;
  await logAction(space_id, awarded_by, "badge_awarded", "user", user_id, { badge });
}

export async function revokeBadge(id: string) {
  const { error } = await db.from("space_badges").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------- Tiers & support ---------------- */
export type SpaceTier = {
  id: string; space_id: string; name: string; description: string | null;
  price_maiki: number; benefits: string[]; active: boolean; created_at: string;
};

export async function listTiers(space_id: string): Promise<SpaceTier[]> {
  const { data } = await db.from("space_tiers").select("*").eq("space_id", space_id).order("price_maiki");
  return (data ?? []) as SpaceTier[];
}

export async function createTier(input: { space_id: string; name: string; description?: string; price_maiki: number; benefits: string[] }) {
  const { error } = await db.from("space_tiers").insert({ ...input, description: input.description ?? null });
  if (error) throw error;
}

export async function deleteTier(id: string) {
  const { error } = await db.from("space_tiers").delete().eq("id", id);
  if (error) throw error;
}

export async function subscribeToTier(space_id: string, tier_id: string, user_id: string, price: number, ownerAddress?: string) {
  if (price > 0 && ownerAddress) {
    const { error } = await db.rpc("send_maiki", { _to_address: ownerAddress, _amount: price, _note: "Space support" });
    if (error) throw error;
  }
  const expires = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  const { error } = await db.from("space_subscriptions").insert({ space_id, tier_id, user_id, expires_at: expires });
  if (error) throw error;
}

export async function mySubscription(space_id: string, user_id: string) {
  const { data } = await db.from("space_subscriptions").select("*")
    .eq("space_id", space_id).eq("user_id", user_id)
    .order("started_at", { ascending: false }).limit(1).maybeSingle();
  return data as { id: string; tier_id: string; expires_at: string | null } | null;
}

export async function ownerWalletAddress(owner_id: string) {
  const { data } = await db.from("maiki_wallets").select("address").eq("user_id", owner_id).maybeSingle();
  return (data?.address as string | undefined) ?? undefined;
}

/* ---------------- Job board ---------------- */
export type SpaceJob = {
  id: string; space_id: string; title: string; description: string | null; location: string | null;
  job_type: string; compensation: string | null; apply_url: string | null; posted_by: string;
  closes_at: string | null; created_at: string;
};

export const JOB_TYPES = ["full_time", "part_time", "contract", "internship", "volunteer", "gig"] as const;

export async function listJobs(space_id: string): Promise<SpaceJob[]> {
  const { data } = await db.from("space_jobs").select("*").eq("space_id", space_id)
    .order("created_at", { ascending: false });
  return (data ?? []) as SpaceJob[];
}

export async function createJob(input: Omit<SpaceJob, "id" | "created_at">) {
  const { error } = await db.from("space_jobs").insert(input);
  if (error) throw error;
}

export async function deleteJob(id: string) {
  const { error } = await db.from("space_jobs").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------- Invite links ---------------- */
export type InviteLink = {
  id: string; space_id: string; code: string; created_by: string;
  expires_at: string | null; max_uses: number | null; uses: number; created_at: string;
};

export async function listInviteLinks(space_id: string): Promise<InviteLink[]> {
  const { data } = await db.from("space_invite_links").select("*").eq("space_id", space_id)
    .order("created_at", { ascending: false });
  return (data ?? []) as InviteLink[];
}

export async function createInviteLink(space_id: string, created_by: string, opts: { days?: number | null; maxUses?: number | null }) {
  const code = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
  const expires_at = opts.days ? new Date(Date.now() + opts.days * 24 * 3600 * 1000).toISOString() : null;
  const { error } = await db.from("space_invite_links")
    .insert({ space_id, created_by, code, expires_at, max_uses: opts.maxUses ?? null });
  if (error) throw error;
  return code;
}

export async function deleteInviteLink(id: string) {
  const { error } = await db.from("space_invite_links").delete().eq("id", id);
  if (error) throw error;
}

export async function redeemInvite(code: string) {
  const { data, error } = await db.rpc("redeem_space_invite", { _code: code });
  if (error) throw error;
  return data as string;
}

/* ---------------- Event RSVPs ---------------- */
export type Rsvp = { event_id: string; user_id: string; status: "going" | "interested" | "cant" };

export async function listRsvps(event_ids: string[]): Promise<Rsvp[]> {
  if (!event_ids.length) return [];
  const { data } = await db.from("space_event_rsvps").select("*").in("event_id", event_ids);
  return (data ?? []) as Rsvp[];
}

export async function setRsvp(event_id: string, user_id: string, status: Rsvp["status"]) {
  const { error } = await db.from("space_event_rsvps")
    .upsert({ event_id, user_id, status }, { onConflict: "event_id,user_id" });
  if (error) throw error;
}

/* ---------------- Scheduled posts ---------------- */
export async function listScheduledPosts(space_id: string) {
  const { data } = await db.from("posts").select("id, body, scheduled_at, media_url")
    .eq("space_id", space_id).not("scheduled_at", "is", null)
    .gt("scheduled_at", new Date().toISOString())
    .order("scheduled_at");
  return (data ?? []) as { id: string; body: string; scheduled_at: string; media_url: string | null }[];
}

export async function publishNow(post_id: string) {
  const { error } = await db.from("posts").update({ scheduled_at: null }).eq("id", post_id);
  if (error) throw error;
}

/* ---------------- helpers ---------------- */
async function attachProfiles<T>(rows: T[], pick: (r: T) => string): Promise<T[]> {
  const ids = Array.from(new Set(rows.map(pick)));
  if (!ids.length) return rows;
  const { data } = await supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", ids);
  const map = new Map((data ?? []).map((p: any) => [p.id, p]));
  return rows.map((r) => ({ ...r, profile: map.get(pick(r)) ?? null }));
}