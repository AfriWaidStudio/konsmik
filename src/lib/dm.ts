import { supabase } from "@/integrations/supabase/client";

export async function listMyThreads(uid: string) {
  const { data: memberships } = await supabase.from("dm_members").select("thread_id").eq("user_id", uid);
  const ids = (memberships ?? []).map((m) => m.thread_id);
  if (!ids.length) return [];
  const { data: threads } = await supabase.from("dm_threads").select("*").in("id", ids).order("last_message_at", { ascending: false });
  const { data: members } = await supabase.from("dm_members").select("thread_id, user_id").in("thread_id", ids);
  const userIds = Array.from(new Set((members ?? []).map((m) => m.user_id).filter((x) => x !== uid)));
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", userIds)
    : { data: [] as any[] };
  const pmap = new Map((profiles ?? []).map((p) => [p.id, p]));
  // Pull last message + my last_read for each thread (small N)
  const [{ data: lastMsgs }, { data: reads }] = await Promise.all([
    supabase.from("dm_messages").select("thread_id, body, created_at, sender_id").in("thread_id", ids).order("created_at", { ascending: false }),
    supabase.from("dm_reads").select("thread_id, last_read_at").eq("user_id", uid).in("thread_id", ids),
  ]);
  const lastByThread = new Map<string, any>();
  (lastMsgs ?? []).forEach((m: any) => { if (!lastByThread.has(m.thread_id)) lastByThread.set(m.thread_id, m); });
  const readByThread = new Map<string, string>((reads ?? []).map((r: any) => [r.thread_id, r.last_read_at]));
  return (threads ?? []).map((t) => {
    const others = (members ?? []).filter((m) => m.thread_id === t.id && m.user_id !== uid).map((m) => pmap.get(m.user_id)).filter(Boolean);
    const last = lastByThread.get(t.id);
    const lastRead = readByThread.get(t.id);
    const unread = !!last && last.sender_id !== uid && (!lastRead || new Date(last.created_at) > new Date(lastRead));
    return { ...t, others, last_message: last ?? null, unread };
  });
}

export async function markThreadRead(thread_id: string, user_id: string) {
  await supabase.from("dm_reads").upsert(
    { thread_id, user_id, last_read_at: new Date().toISOString() },
    { onConflict: "thread_id,user_id" } as any,
  );
}

export async function findOrCreateDirectThread(me: string, other: string) {
  if (me === other) throw new Error("Cannot message yourself");
  // find existing 1:1
  const { data: mine } = await supabase.from("dm_members").select("thread_id").eq("user_id", me);
  const ids = (mine ?? []).map((m) => m.thread_id);
  if (ids.length) {
    const { data: hits } = await supabase.from("dm_members").select("thread_id").eq("user_id", other).in("thread_id", ids);
    if (hits?.length) return hits[0].thread_id as string;
  }
  const { data: t, error } = await supabase.from("dm_threads").insert({}).select().single();
  if (error) throw error;
  await supabase.from("dm_members").insert([{ thread_id: t.id, user_id: me }, { thread_id: t.id, user_id: other }]);
  return t.id as string;
}

export async function searchUsersByUsername(q: string, exclude?: string) {
  const term = q.replace(/^@/, "").trim().toLowerCase();
  if (!term) return [];
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .ilike("username", `${term}%`)
    .limit(10);
  return (data ?? []).filter((p: any) => p.id !== exclude);
}
