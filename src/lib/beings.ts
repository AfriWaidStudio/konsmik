import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type Being = {
  id: string;
  owner_id: string;
  kind: "twin" | "worker";
  name: string;
  role: string;
  purpose: string | null;
  personality: string;
  skills: string[];
  avatar_url: string | null;
  accent: string;
  is_public: boolean;
  hire_rate: number;
  runs: number;
  model: string;
  created_at: string;
};

export type TredBeing = {
  id: string;
  being_id: string;
  owner_id: string;
  name: string;
  duty: string;
  instructions: string | null;
  active: boolean;
  sort_order: number;
  runs: number;
};

export type Mission = {
  id: string;
  being_id: string;
  tred_id: string | null;
  owner_id: string;
  title: string;
  brief: string;
  status: "queued" | "running" | "done" | "failed";
  result: string | null;
  model: string | null;
  created_at: string;
  completed_at: string | null;
};

export type BeingMessage = {
  id: string;
  being_id: string;
  tred_id: string | null;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

/** Ready-made worker archetypes users can spawn in one tap. */
export const BEING_TEMPLATES: {
  id: string;
  name: string;
  role: string;
  purpose: string;
  personality: string;
  skills: string[];
  accent: string;
  treds: { name: string; duty: string; instructions: string }[];
}[] = [
  {
    id: "growth",
    name: "Growth Being",
    role: "Growth & Marketing",
    purpose: "Grows an audience: content angles, hooks, posting cadence and outreach.",
    personality: "bold, data-minded, allergic to fluff",
    skills: ["content strategy", "hooks", "analytics", "outreach"],
    accent: "#22d3ee",
    treds: [
      { name: "Hook Tred", duty: "Write scroll-stopping hooks", instructions: "Return 5 hooks, each under 12 words." },
      { name: "Calendar Tred", duty: "Plan the posting calendar", instructions: "Return a 7-day plan as a compact list." },
      { name: "Reply Tred", duty: "Draft replies to comments", instructions: "Warm, short, never defensive." },
    ],
  },
  {
    id: "ops",
    name: "Ops Being",
    role: "Operations",
    purpose: "Keeps the work moving: plans, checklists, follow-ups and status summaries.",
    personality: "calm, structured, relentlessly practical",
    skills: ["planning", "checklists", "prioritisation"],
    accent: "#a78bfa",
    treds: [
      { name: "Plan Tred", duty: "Break goals into steps", instructions: "Numbered steps, owner and time estimate each." },
      { name: "Triage Tred", duty: "Prioritise a messy list", instructions: "Sort into Now / Next / Never with one-line reasons." },
    ],
  },
  {
    id: "commerce",
    name: "Commerce Being",
    role: "Sales & Offers",
    purpose: "Turns attention into revenue: offers, pricing, pitches and objection handling.",
    personality: "persuasive but honest, never pushy",
    skills: ["offers", "pricing", "pitch writing"],
    accent: "#f472b6",
    treds: [
      { name: "Offer Tred", duty: "Shape irresistible offers", instructions: "Offer, price, bonus, guarantee, in 5 lines." },
      { name: "Objection Tred", duty: "Answer buyer objections", instructions: "One short answer per objection." },
    ],
  },
  {
    id: "study",
    name: "Study Being",
    role: "Research & Learning",
    purpose: "Explains, researches and drills you until a topic actually sticks.",
    personality: "patient teacher, uses plain words and examples",
    skills: ["explaining", "summarising", "quizzing"],
    accent: "#34d399",
    treds: [
      { name: "Explain Tred", duty: "Explain anything simply", instructions: "Explain like to a smart 15-year-old, with one analogy." },
      { name: "Quiz Tred", duty: "Test understanding", instructions: "Ask 5 questions, then give answers at the end." },
    ],
  },
  {
    id: "guardian",
    name: "Guardian Being",
    role: "Wellbeing & Focus",
    purpose: "Protects your attention, mood and boundaries. Checks in, calms down, refocuses.",
    personality: "gentle, grounding, never preachy",
    skills: ["reflection", "focus", "boundaries"],
    accent: "#fbbf24",
    treds: [
      { name: "Reset Tred", duty: "Reset a spiralling mind", instructions: "Three calm steps to take right now." },
      { name: "Boundary Tred", duty: "Draft a kind but firm no", instructions: "Two sentences maximum." },
    ],
  },
  {
    id: "creator",
    name: "Studio Being",
    role: "Creative Studio",
    purpose: "Ideas, scripts and captions for posts, reels and Konsmik TV.",
    personality: "playful, visual, cinematic",
    skills: ["scripting", "captions", "storyboards"],
    accent: "#60a5fa",
    treds: [
      { name: "Script Tred", duty: "Write short-form scripts", instructions: "30-second script with shot notes." },
      { name: "Caption Tred", duty: "Write captions", instructions: "3 captions with different tones." },
    ],
  },
];

export async function ensureTwin(userId: string): Promise<Being | null> {
  const { data } = await db.rpc("ensure_twin_being", { _user: userId });
  return (data as Being) ?? null;
}

export async function listMyBeings(userId: string): Promise<Being[]> {
  const { data } = await db
    .from("smai_beings")
    .select("*")
    .eq("owner_id", userId)
    .order("kind", { ascending: true })
    .order("created_at", { ascending: true });
  return (data ?? []) as Being[];
}

export type DirectoryBeing = Being & {
  owner: { username: string; display_name: string; avatar_url: string | null } | null;
};

export async function listPublicBeings(q?: string): Promise<DirectoryBeing[]> {
  const { data } = await db
    .from("smai_beings")
    .select("*")
    .eq("is_public", true)
    .order("runs", { ascending: false })
    .limit(60);
  let rows = (data ?? []) as Being[];
  const term = q?.trim().toLowerCase();
  if (term) {
    rows = rows.filter((b) =>
      [b.name, b.role, b.purpose, ...(b.skills ?? [])].filter(Boolean).some((v) => String(v).toLowerCase().includes(term)),
    );
  }
  const ids = [...new Set(rows.map((r) => r.owner_id))];
  if (!ids.length) return [];
  const { data: profs } = await supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", ids);
  const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
  return rows.map((r) => ({ ...r, owner: (map.get(r.owner_id) as any) ?? null }));
}

export async function getBeing(id: string): Promise<Being | null> {
  const { data } = await db.from("smai_beings").select("*").eq("id", id).maybeSingle();
  return (data as Being) ?? null;
}

export async function createBeing(userId: string, input: Partial<Being>): Promise<Being> {
  const { data, error } = await db
    .from("smai_beings")
    .insert({ owner_id: userId, kind: "worker", ...input })
    .select("*")
    .single();
  if (error) throw error;
  return data as Being;
}

export async function spawnFromTemplate(userId: string, templateId: string): Promise<Being> {
  const t = BEING_TEMPLATES.find((x) => x.id === templateId);
  if (!t) throw new Error("Unknown template");
  const being = await createBeing(userId, {
    name: t.name,
    role: t.role,
    purpose: t.purpose,
    personality: t.personality,
    skills: t.skills,
    accent: t.accent,
  });
  for (let i = 0; i < t.treds.length; i++) {
    const tred = t.treds[i]!;
    await addTred(userId, being.id, { ...tred, sort_order: i });
  }
  return being;
}

export async function updateBeing(id: string, patch: Partial<Being>) {
  const { error } = await db.from("smai_beings").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteBeing(id: string) {
  const { error } = await db.from("smai_beings").delete().eq("id", id);
  if (error) throw error;
}

export async function listTreds(beingId: string): Promise<TredBeing[]> {
  const { data } = await db
    .from("tred_beings")
    .select("*")
    .eq("being_id", beingId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  return (data ?? []) as TredBeing[];
}

export async function addTred(
  userId: string,
  beingId: string,
  input: { name: string; duty: string; instructions?: string; sort_order?: number },
) {
  const { error } = await db.from("tred_beings").insert({
    owner_id: userId,
    being_id: beingId,
    name: input.name,
    duty: input.duty,
    instructions: input.instructions ?? null,
    sort_order: input.sort_order ?? 0,
  });
  if (error) throw error;
}

export async function updateTred(id: string, patch: Partial<TredBeing>) {
  const { error } = await db.from("tred_beings").update(patch).eq("id", id);
  if (error) throw error;
}

export async function removeTred(id: string) {
  const { error } = await db.from("tred_beings").delete().eq("id", id);
  if (error) throw error;
}

export async function listMissions(beingId: string): Promise<Mission[]> {
  const { data } = await db
    .from("being_missions")
    .select("*")
    .eq("being_id", beingId)
    .order("created_at", { ascending: false })
    .limit(40);
  return (data ?? []) as Mission[];
}

export async function createMission(
  userId: string,
  input: { being_id: string; tred_id?: string | null; title: string; brief: string },
): Promise<Mission> {
  const { data, error } = await db
    .from("being_missions")
    .insert({
      owner_id: userId,
      being_id: input.being_id,
      tred_id: input.tred_id ?? null,
      title: input.title,
      brief: input.brief,
      status: "running",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Mission;
}

export async function completeMission(id: string, result: string, model: string, ok = true) {
  const { error } = await db
    .from("being_missions")
    .update({
      status: ok ? "done" : "failed",
      result,
      model,
      completed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteMission(id: string) {
  await db.from("being_missions").delete().eq("id", id);
}

export async function listBeingMessages(beingId: string, userId: string): Promise<BeingMessage[]> {
  const { data } = await db
    .from("being_messages")
    .select("*")
    .eq("being_id", beingId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(200);
  return (data ?? []) as BeingMessage[];
}

export async function saveBeingMessage(
  userId: string,
  beingId: string,
  role: "user" | "assistant",
  content: string,
  tredId?: string | null,
) {
  await db.from("being_messages").insert({
    user_id: userId,
    being_id: beingId,
    role,
    content,
    tred_id: tredId ?? null,
  });
}

export async function clearBeingChat(beingId: string, userId: string) {
  await db.from("being_messages").delete().eq("being_id", beingId).eq("user_id", userId);
}

export async function bumpRuns(beingId: string, current: number, tredId?: string | null, tredRuns?: number) {
  await db.from("smai_beings").update({ runs: current + 1 }).eq("id", beingId);
  if (tredId != null && tredRuns != null) {
    await db.from("tred_beings").update({ runs: tredRuns + 1 }).eq("id", tredId);
  }
}

export async function hireBeing(beingId: string, note?: string) {
  const { data, error } = await db.rpc("hire_being", { _being_id: beingId, _note: note ?? null });
  if (error) throw error;
  return data as number;
}