import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type SpaceTask = {
  id: string;
  space_id: string;
  title: string;
  details: string | null;
  status: "todo" | "doing" | "done";
  assignee_id: string | null;
  due_at: string | null;
  created_by: string;
  created_at: string;
};

export type WikiPage = {
  id: string;
  space_id: string;
  slug: string;
  title: string;
  body: string;
  updated_at: string;
};

export async function listTasks(space_id: string): Promise<SpaceTask[]> {
  const { data } = await db.from("space_tasks").select("*").eq("space_id", space_id).order("created_at", { ascending: false });
  return data ?? [];
}

export async function createTask(input: {
  space_id: string;
  created_by: string;
  title: string;
  details?: string;
  assignee_id?: string | null;
  due_at?: string | null;
}) {
  const { data, error } = await db.from("space_tasks").insert(input).select().single();
  if (error) throw error;
  return data as SpaceTask;
}

export async function updateTask(id: string, patch: Partial<SpaceTask>) {
  const { error } = await db.from("space_tasks").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteTask(id: string) {
  await db.from("space_tasks").delete().eq("id", id);
}

export async function listWikiPages(space_id: string): Promise<WikiPage[]> {
  const { data } = await db.from("space_wiki_pages").select("*").eq("space_id", space_id).order("updated_at", { ascending: false });
  return data ?? [];
}

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "page";
}

export async function createWikiPage(input: { space_id: string; created_by: string; title: string; body: string }) {
  const { data, error } = await db
    .from("space_wiki_pages")
    .insert({ ...input, slug: slugify(input.title) })
    .select()
    .single();
  if (error) throw error;
  return data as WikiPage;
}

export async function updateWikiPage(id: string, patch: { title?: string; body?: string }) {
  const { error } = await db.from("space_wiki_pages").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteWikiPage(id: string) {
  await db.from("space_wiki_pages").delete().eq("id", id);
}

export async function saveSpaceBanner(space_id: string, patch: { welcome_message?: string | null; announcement?: string | null }) {
  const { error } = await db.from("spaces").update(patch).eq("id", space_id);
  if (error) throw error;
}

export async function spaceLeaderboard(space_id: string, limit = 10) {
  const { data: posts } = await db.from("posts").select("id, author_id, views").eq("space_id", space_id);
  const postIds = (posts ?? []).map((p: any) => p.id);
  const { data: comments } = postIds.length
    ? await db.from("comments").select("user_id, post_id").in("post_id", postIds)
    : { data: [] as any[] };
  const score = new Map<string, { posts: number; comments: number; views: number }>();
  const bump = (uid: string, k: "posts" | "comments", v = 1, views = 0) => {
    const cur = score.get(uid) ?? { posts: 0, comments: 0, views: 0 };
    cur[k] += v;
    cur.views += views;
    score.set(uid, cur);
  };
  (posts ?? []).forEach((p: any) => bump(p.author_id, "posts", 1, p.views ?? 0));
  (comments ?? []).forEach((c: any) => bump(c.user_id, "comments"));
  const ids = Array.from(score.keys());
  if (!ids.length) return [];
  const { data: profiles } = await db.from("profiles").select("id, username, display_name, avatar_url").in("id", ids);
  const pmap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
  return ids
    .map((id) => {
      const s = score.get(id)!;
      return { profile: pmap.get(id), ...s, total: s.posts * 3 + s.comments * 2 + Math.round(s.views / 20) };
    })
    .filter((r) => r.profile)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}