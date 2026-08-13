import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type BeingReview = { id: string; being_id: string; user_id: string; rating: number; body: string | null; created_at: string; author?: any };
export type BeingSchedule = { id: string; being_id: string; label: string; brief: string; cadence: string; next_run_at: string; active: boolean };
export type BeingMemory = { id: string; being_id: string; label: string; content: string; created_at: string };
export type BeingTeam = { id: string; name: string; goal: string | null; created_at: string };
export type MissionTemplate = { id: string; owner_id: string; title: string; brief: string; category: string; is_public: boolean; uses: number };

/* Reviews */
export async function listReviews(being_id: string): Promise<BeingReview[]> {
  const { data } = await db.from("being_reviews").select("*").eq("being_id", being_id).order("created_at", { ascending: false });
  const ids = Array.from(new Set((data ?? []).map((r: any) => r.user_id)));
  if (!ids.length) return [];
  const { data: profiles } = await db.from("profiles").select("id, username, display_name, avatar_url").in("id", ids);
  const pmap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
  return (data ?? []).map((r: any) => ({ ...r, author: pmap.get(r.user_id) ?? null }));
}

export async function upsertReview(being_id: string, user_id: string, rating: number, body: string) {
  const { error } = await db.from("being_reviews").upsert({ being_id, user_id, rating, body }, { onConflict: "being_id,user_id" });
  if (error) throw error;
}

export async function ratingsForBeings(ids: string[]) {
  if (!ids.length) return new Map<string, { avg: number; count: number }>();
  const { data } = await db.from("being_reviews").select("being_id, rating").in("being_id", ids);
  const map = new Map<string, { avg: number; count: number }>();
  (data ?? []).forEach((r: any) => {
    const cur = map.get(r.being_id) ?? { avg: 0, count: 0 };
    const total = cur.avg * cur.count + r.rating;
    cur.count += 1;
    cur.avg = Math.round((total / cur.count) * 10) / 10;
    map.set(r.being_id, cur);
  });
  return map;
}

/* Schedules */
export function nextRunFor(cadence: string, from = new Date()) {
  const d = new Date(from);
  if (cadence === "hourly") d.setHours(d.getHours() + 1);
  else if (cadence === "weekly") d.setDate(d.getDate() + 7);
  else d.setDate(d.getDate() + 1);
  return d.toISOString();
}

export async function listSchedules(being_id: string): Promise<BeingSchedule[]> {
  const { data } = await db.from("being_schedules").select("*").eq("being_id", being_id).order("created_at", { ascending: false });
  return data ?? [];
}

export async function createSchedule(input: { being_id: string; owner_id: string; label: string; brief: string; cadence: string }) {
  const { error } = await db.from("being_schedules").insert({ ...input, next_run_at: nextRunFor(input.cadence) });
  if (error) throw error;
}

export async function toggleSchedule(id: string, active: boolean) {
  await db.from("being_schedules").update({ active }).eq("id", id);
}

export async function deleteSchedule(id: string) {
  await db.from("being_schedules").delete().eq("id", id);
}

export async function markScheduleRan(id: string, cadence: string) {
  await db.from("being_schedules").update({ next_run_at: nextRunFor(cadence) }).eq("id", id);
}

/* Memories */
export async function listMemories(being_id: string): Promise<BeingMemory[]> {
  const { data } = await db.from("being_memories").select("*").eq("being_id", being_id).order("created_at", { ascending: false });
  return data ?? [];
}

export async function addMemory(input: { being_id: string; owner_id: string; label: string; content: string }) {
  const { error } = await db.from("being_memories").insert(input);
  if (error) throw error;
}

export async function deleteMemory(id: string) {
  await db.from("being_memories").delete().eq("id", id);
}

/* Teams */
export async function listTeams(owner_id: string) {
  const { data } = await db.from("being_teams").select("*").eq("owner_id", owner_id).order("created_at", { ascending: false });
  const teams = (data ?? []) as BeingTeam[];
  if (!teams.length) return [];
  const { data: members } = await db
    .from("being_team_members")
    .select("team_id, being_id, duty")
    .in("team_id", teams.map((t) => t.id));
  const beingIds = Array.from(new Set((members ?? []).map((m: any) => m.being_id)));
  const { data: beings } = beingIds.length
    ? await db.from("smai_beings").select("id, name, role, accent, avatar_url").in("id", beingIds)
    : { data: [] as any[] };
  const bmap = new Map((beings ?? []).map((b: any) => [b.id, b]));
  return teams.map((t) => ({
    ...t,
    members: (members ?? [])
      .filter((m: any) => m.team_id === t.id)
      .map((m: any) => ({ ...m, being: bmap.get(m.being_id) })),
  }));
}

export async function createTeam(owner_id: string, name: string, goal: string) {
  const { data, error } = await db.from("being_teams").insert({ owner_id, name, goal }).select().single();
  if (error) throw error;
  return data as BeingTeam;
}

export async function deleteTeam(id: string) {
  await db.from("being_teams").delete().eq("id", id);
}

export async function addTeamMember(team_id: string, being_id: string, duty: string) {
  const { error } = await db.from("being_team_members").upsert({ team_id, being_id, duty }, { onConflict: "team_id,being_id" });
  if (error) throw error;
}

export async function removeTeamMember(team_id: string, being_id: string) {
  await db.from("being_team_members").delete().eq("team_id", team_id).eq("being_id", being_id);
}

/* Mission templates */
export async function listTemplates(owner_id?: string): Promise<MissionTemplate[]> {
  const { data } = await db.from("mission_templates").select("*").order("uses", { ascending: false });
  const rows = (data ?? []) as MissionTemplate[];
  return owner_id ? rows : rows.filter((t) => t.is_public);
}

export async function createTemplate(input: { owner_id: string; title: string; brief: string; category: string; is_public: boolean }) {
  const { error } = await db.from("mission_templates").insert(input);
  if (error) throw error;
}

export async function deleteTemplate(id: string) {
  await db.from("mission_templates").delete().eq("id", id);
}

export async function bumpTemplateUse(id: string, uses: number) {
  await db.from("mission_templates").update({ uses: uses + 1 }).eq("id", id);
}