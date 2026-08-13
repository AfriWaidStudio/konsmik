import { supabase } from "@/integrations/supabase/client";

export type PollOption = { id: string; label: string; position: number; votes: number };
export type PollData = {
  id: string;
  post_id: string;
  question: string;
  multi_select: boolean;
  closes_at: string | null;
  options: PollOption[];
  total_votes: number;
  my_votes: string[]; // option ids
};

export async function fetchPollsForPosts(postIds: string[], uid?: string) {
  const map = new Map<string, PollData>();
  if (!postIds.length) return map;
  const { data: polls } = await supabase
    .from("polls")
    .select("id, post_id, question, multi_select, closes_at")
    .in("post_id", postIds);
  if (!polls?.length) return map;
  const pollIds = polls.map((p) => p.id);
  const [{ data: options }, { data: votes }] = await Promise.all([
    supabase.from("poll_options").select("id, poll_id, label, position").in("poll_id", pollIds),
    supabase.from("poll_votes").select("poll_id, option_id, user_id").in("poll_id", pollIds),
  ]);
  const voteCounts = new Map<string, number>();
  const totals = new Map<string, number>();
  const mine = new Map<string, string[]>();
  (votes ?? []).forEach((v: any) => {
    voteCounts.set(v.option_id, (voteCounts.get(v.option_id) ?? 0) + 1);
    totals.set(v.poll_id, (totals.get(v.poll_id) ?? 0) + 1);
    if (uid && v.user_id === uid) {
      const arr = mine.get(v.poll_id) ?? [];
      arr.push(v.option_id);
      mine.set(v.poll_id, arr);
    }
  });
  polls.forEach((p) => {
    const opts = (options ?? [])
      .filter((o) => o.poll_id === p.id)
      .sort((a, b) => a.position - b.position)
      .map((o) => ({ id: o.id, label: o.label, position: o.position, votes: voteCounts.get(o.id) ?? 0 }));
    map.set(p.post_id, {
      id: p.id,
      post_id: p.post_id,
      question: p.question,
      multi_select: p.multi_select,
      closes_at: p.closes_at,
      options: opts,
      total_votes: totals.get(p.id) ?? 0,
      my_votes: mine.get(p.id) ?? [],
    });
  });
  return map;
}

export async function createPollForPost(postId: string, question: string, options: string[], multiSelect = false, closesAt: string | null = null) {
  const { data: poll, error } = await supabase
    .from("polls")
    .insert({ post_id: postId, question, multi_select: multiSelect, closes_at: closesAt })
    .select("id")
    .single();
  if (error) throw error;
  const rows = options.map((label, i) => ({ poll_id: poll.id, label, position: i }));
  const { error: oerr } = await supabase.from("poll_options").insert(rows);
  if (oerr) throw oerr;
  return poll.id as string;
}

export async function castVote(pollId: string, userId: string, optionIds: string[], multiSelect: boolean) {
  if (!multiSelect) {
    await supabase.from("poll_votes").delete().eq("poll_id", pollId).eq("user_id", userId);
  }
  if (optionIds.length === 0) return;
  const rows = optionIds.map((option_id) => ({ poll_id: pollId, option_id, user_id: userId }));
  const { error } = await supabase.from("poll_votes").upsert(rows, { onConflict: "poll_id,option_id,user_id" });
  if (error) throw error;
}

export async function clearMyVotes(pollId: string, userId: string) {
  await supabase.from("poll_votes").delete().eq("poll_id", pollId).eq("user_id", userId);
}