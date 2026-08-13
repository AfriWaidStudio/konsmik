import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export const PROMPT_LIBRARY = [
  "The way to win me over is…",
  "A life goal of mine…",
  "I'm weirdly attracted to…",
  "My simple pleasures…",
  "Best travel story…",
  "I geek out on…",
  "Two truths and a lie…",
  "My love language is…",
];

export type DatingPrompt = { id: string; user_id: string; prompt: string; answer: string; position: number };

export async function listPrompts(user_id: string): Promise<DatingPrompt[]> {
  const { data } = await db.from("dating_prompts").select("*").eq("user_id", user_id).order("position");
  return data ?? [];
}

export async function addPrompt(user_id: string, prompt: string, answer: string, position: number) {
  const { error } = await db.from("dating_prompts").insert({ user_id, prompt, answer, position });
  if (error) throw error;
}

export async function deletePrompt(id: string) {
  await db.from("dating_prompts").delete().eq("id", id);
}

export async function activeBoost(user_id: string) {
  const { data } = await db
    .from("dating_boosts")
    .select("*")
    .eq("user_id", user_id)
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .maybeSingle();
  return data ?? null;
}

export async function startBoost(user_id: string, hours = 24) {
  const expires = new Date(Date.now() + hours * 3600 * 1000).toISOString();
  const { error } = await db.from("dating_boosts").insert({ user_id, expires_at: expires });
  if (error) throw error;
  return expires;
}

export async function boostedUserIds(): Promise<Set<string>> {
  const { data } = await db.from("dating_boosts").select("user_id").gt("expires_at", new Date().toISOString());
  return new Set((data ?? []).map((b: any) => b.user_id));
}

export async function unmatch(match_id: string) {
  await db.from("dating_matches").delete().eq("id", match_id);
}