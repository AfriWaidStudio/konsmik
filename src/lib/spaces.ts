import { supabase } from "@/integrations/supabase/client";

export type SpaceKind = "group" | "page" | "circle";
export type SpaceVisibility = "public" | "private" | "invite_only";

export type Space = {
  id: string;
  kind: SpaceKind;
  name: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  avatar_url: string | null;
  visibility: SpaceVisibility;
  owner_id: string;
  member_count: number;
  created_at: string;
  category?: string | null;
  rules?: string | null;
  website?: string | null;
  theme_color?: string | null;
  contact_email?: string | null;
  phone?: string | null;
  dm_thread_id?: string | null;
  verified?: boolean;
  cta_label?: string | null;
  cta_url?: string | null;
  cta_type?: string | null;
};

export function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export async function listSpaces(kind?: SpaceKind) {
  let q = supabase.from("spaces").select("*").order("member_count", { ascending: false }).limit(100);
  if (kind) q = q.eq("kind", kind);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Space[];
}

export async function getSpaceBySlug(slug: string) {
  const { data, error } = await supabase.from("spaces").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data as Space | null;
}

export async function createSpace(input: {
  kind: SpaceKind;
  name: string;
  description?: string;
  visibility: SpaceVisibility;
  owner_id: string;
}) {
  let base = slugify(input.name) || "space";
  let slug = base;
  for (let i = 1; ; i++) {
    const { data } = await supabase.from("spaces").select("id").eq("slug", slug).maybeSingle();
    if (!data) break;
    slug = `${base}-${i}`;
    if (i > 50) break;
  }
  const { data, error } = await supabase
    .from("spaces")
    .insert({
      kind: input.kind,
      name: input.name,
      slug,
      description: input.description ?? null,
      visibility: input.visibility,
      owner_id: input.owner_id,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Space;
}

export async function joinSpace(space_id: string, user_id: string) {
  const { error } = await supabase.from("space_members").insert({ space_id, user_id });
  if (error && !String(error.message).toLowerCase().includes("duplicate")) throw error;
}

export async function leaveSpace(space_id: string, user_id: string) {
  const { error } = await supabase.from("space_members").delete().eq("space_id", space_id).eq("user_id", user_id);
  if (error) throw error;
}

export async function getMembership(space_id: string, user_id: string) {
  const { data } = await supabase
    .from("space_members")
    .select("role")
    .eq("space_id", space_id)
    .eq("user_id", user_id)
    .maybeSingle();
  return data as { role: "admin" | "moderator" | "member" } | null;
}

export type SpaceMember = {
  user_id: string;
  role: "admin" | "moderator" | "member";
  joined_at: string;
  profile: { username: string; display_name: string; avatar_url: string | null; title: string | null } | null;
};

export async function listSpaceMembers(space_id: string): Promise<SpaceMember[]> {
  const { data, error } = await supabase
    .from("space_members")
    .select("role, user_id, joined_at")
    .eq("space_id", space_id)
    .order("joined_at", { ascending: true });
  if (error) throw error;
  const ids = (data ?? []).map((m) => m.user_id);
  if (!ids.length) return [];
  const { data: profs } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, title")
    .in("id", ids);
  const pmap = new Map((profs ?? []).map((p) => [p.id, p]));
  return (data ?? []).map((m) => ({
    user_id: m.user_id,
    role: m.role as any,
    joined_at: m.joined_at,
    profile: (pmap.get(m.user_id) as any) ?? null,
  }));
}

export async function updateMemberRole(space_id: string, user_id: string, role: "admin" | "moderator" | "member") {
  const { error } = await supabase.from("space_members").update({ role }).eq("space_id", space_id).eq("user_id", user_id);
  if (error) throw error;
}

export async function removeMember(space_id: string, user_id: string) {
  const { error } = await supabase.from("space_members").delete().eq("space_id", space_id).eq("user_id", user_id);
  if (error) throw error;
}

export const KIND_LABELS: Record<SpaceKind, { singular: string; plural: string; verb: string }> = {
  group: { singular: "Group", plural: "Groups", verb: "Join" },
  page: { singular: "Page", plural: "Pages", verb: "Follow" },
  circle: { singular: "Circle", plural: "Circles", verb: "Join" },
};

export const MEMBER_LABEL: Record<SpaceKind, string> = {
  group: "members",
  page: "followers",
  circle: "members",
};

// ---------- Events (Groups) ----------
export type SpaceEvent = {
  id: string;
  space_id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string | null;
  created_by: string;
  created_at: string;
};

export async function listSpaceEvents(space_id: string): Promise<SpaceEvent[]> {
  const { data, error } = await (supabase as any)
    .from("space_events")
    .select("*")
    .eq("space_id", space_id)
    .order("start_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as SpaceEvent[];
}

export async function createSpaceEvent(input: {
  space_id: string;
  created_by: string;
  title: string;
  description?: string;
  location?: string;
  start_at: string;
  end_at?: string | null;
}) {
  const { error } = await (supabase as any).from("space_events").insert(input);
  if (error) throw error;
}

export async function deleteSpaceEvent(id: string) {
  const { error } = await (supabase as any).from("space_events").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Reviews (Pages) ----------
export type SpaceReview = {
  id: string;
  space_id: string;
  user_id: string;
  rating: number;
  body: string | null;
  created_at: string;
  profile?: { username: string; display_name: string; avatar_url: string | null } | null;
};

export async function listSpaceReviews(space_id: string): Promise<SpaceReview[]> {
  const { data, error } = await (supabase as any)
    .from("space_reviews")
    .select("*")
    .eq("space_id", space_id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as SpaceReview[];
  const ids = Array.from(new Set(rows.map((r) => r.user_id)));
  if (!ids.length) return rows;
  const { data: profs } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", ids);
  const pmap = new Map((profs ?? []).map((p: any) => [p.id, p]));
  return rows.map((r) => ({ ...r, profile: (pmap.get(r.user_id) as any) ?? null }));
}

export async function upsertSpaceReview(space_id: string, user_id: string, rating: number, body?: string) {
  const { error } = await (supabase as any)
    .from("space_reviews")
    .upsert({ space_id, user_id, rating, body: body ?? null, updated_at: new Date().toISOString() },
      { onConflict: "space_id,user_id" });
  if (error) throw error;
}

export async function getReviewSummary(space_id: string) {
  const { data } = await (supabase as any)
    .from("space_reviews")
    .select("rating")
    .eq("space_id", space_id);
  const ratings = ((data ?? []) as { rating: number }[]).map((r) => r.rating);
  const count = ratings.length;
  const avg = count ? ratings.reduce((a, b) => a + b, 0) / count : 0;
  return { count, avg };
}

// ---------- Invites (Circles) ----------
export async function inviteToSpace(space_id: string, invited_user_id: string, invited_by: string) {
  const { error } = await (supabase as any).from("space_invites")
    .insert({ space_id, invited_user_id, invited_by, status: "pending" });
  if (error && !String(error.message).toLowerCase().includes("duplicate")) throw error;
}

export async function listMyInvites(uid: string) {
  const { data } = await (supabase as any)
    .from("space_invites")
    .select("id, space_id, status, created_at")
    .eq("invited_user_id", uid)
    .eq("status", "pending");
  return (data ?? []) as { id: string; space_id: string; status: string; created_at: string }[];
}

export async function respondInvite(invite_id: string, accept: boolean, user_id: string, space_id: string) {
  const status = accept ? "accepted" : "declined";
  const { error } = await (supabase as any).from("space_invites")
    .update({ status, responded_at: new Date().toISOString() })
    .eq("id", invite_id);
  if (error) throw error;
  if (accept) {
    await supabase.from("space_members").insert({ space_id, user_id }).then(() => {}, () => {});
  }
}

// ---------- Circle group chat ----------
export async function ensureCircleThread(space: Space, user_id: string): Promise<string> {
  if (space.dm_thread_id) return space.dm_thread_id;
  const { data: t, error } = await supabase.from("dm_threads").insert({}).select("id").single();
  if (error) throw error;
  const members = await listSpaceMembers(space.id);
  const rows = members.map((m) => ({ thread_id: t.id, user_id: m.user_id }));
  if (rows.length === 0) rows.push({ thread_id: t.id, user_id });
  await supabase.from("dm_members").insert(rows);
  await (supabase as any).from("spaces").update({ dm_thread_id: t.id }).eq("id", space.id);
  return t.id as string;
}

// ---------- Join requests (Groups) ----------
export type SpaceJoinRequest = {
  id: string; space_id: string; user_id: string; message: string | null;
  status: "pending" | "accepted" | "declined"; created_at: string;
  profile?: { username: string; display_name: string; avatar_url: string | null } | null;
};

export async function requestToJoin(space_id: string, user_id: string, message?: string) {
  const { error } = await (supabase as any).from("space_join_requests")
    .insert({ space_id, user_id, message: message ?? null });
  if (error && !String(error.message).toLowerCase().includes("duplicate")) throw error;
}

export async function listJoinRequests(space_id: string): Promise<SpaceJoinRequest[]> {
  const { data, error } = await (supabase as any).from("space_join_requests")
    .select("*").eq("space_id", space_id).eq("status", "pending").order("created_at", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as SpaceJoinRequest[];
  const ids = Array.from(new Set(rows.map((r) => r.user_id)));
  if (!ids.length) return rows;
  const { data: profs } = await supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", ids);
  const pmap = new Map((profs ?? []).map((p: any) => [p.id, p]));
  return rows.map((r) => ({ ...r, profile: (pmap.get(r.user_id) as any) ?? null }));
}

export async function decideJoinRequest(id: string, accept: boolean, space_id: string, user_id: string, by: string) {
  const status = accept ? "accepted" : "declined";
  const { error } = await (supabase as any).from("space_join_requests")
    .update({ status, decided_at: new Date().toISOString(), decided_by: by }).eq("id", id);
  if (error) throw error;
  if (accept) {
    await supabase.from("space_members").insert({ space_id, user_id }).then(() => {}, () => {});
  }
}

// ---------- Services (Pages) ----------
export type SpaceService = {
  id: string; space_id: string; title: string; description: string | null;
  price_label: string | null; url: string | null; image_url: string | null;
  sort_order: number; created_at: string;
};

export async function listSpaceServices(space_id: string): Promise<SpaceService[]> {
  const { data, error } = await (supabase as any).from("space_services")
    .select("*").eq("space_id", space_id).order("sort_order").order("created_at");
  if (error) throw error;
  return (data ?? []) as SpaceService[];
}
export async function createSpaceService(input: Omit<SpaceService, "id" | "created_at" | "sort_order"> & { sort_order?: number }) {
  const { error } = await (supabase as any).from("space_services").insert(input);
  if (error) throw error;
}
export async function deleteSpaceService(id: string) {
  const { error } = await (supabase as any).from("space_services").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Albums (Circles) ----------
export type SpaceAlbum = { id: string; space_id: string; title: string; cover_url: string | null; created_by: string; created_at: string };
export type AlbumPhoto = { id: string; album_id: string; url: string; caption: string | null; uploaded_by: string; created_at: string };

export async function listAlbums(space_id: string): Promise<SpaceAlbum[]> {
  const { data, error } = await (supabase as any).from("space_albums")
    .select("*").eq("space_id", space_id).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SpaceAlbum[];
}
export async function createAlbum(space_id: string, title: string, created_by: string, cover_url?: string | null) {
  const { data, error } = await (supabase as any).from("space_albums")
    .insert({ space_id, title, created_by, cover_url: cover_url ?? null }).select("id").single();
  if (error) throw error;
  return data.id as string;
}
export async function deleteAlbum(id: string) {
  const { error } = await (supabase as any).from("space_albums").delete().eq("id", id);
  if (error) throw error;
}
export async function listAlbumPhotos(album_id: string): Promise<AlbumPhoto[]> {
  const { data, error } = await (supabase as any).from("space_album_photos")
    .select("*").eq("album_id", album_id).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AlbumPhoto[];
}
export async function addAlbumPhoto(album_id: string, url: string, uploaded_by: string, caption?: string) {
  const { error } = await (supabase as any).from("space_album_photos")
    .insert({ album_id, url, uploaded_by, caption: caption ?? null });
  if (error) throw error;
}
export async function removeAlbumPhoto(id: string) {
  const { error } = await (supabase as any).from("space_album_photos").delete().eq("id", id);
  if (error) throw error;
}

// ---------- My postable spaces (composer target picker) ----------
export type PostableSpace = { id: string; name: string; slug: string; kind: SpaceKind; can_post: boolean; avatar_url: string | null };
export async function listMyPostableSpaces(uid: string): Promise<PostableSpace[]> {
  const { data, error } = await (supabase as any).rpc("my_postable_spaces", { _user: uid });
  if (error) throw error;
  return (data ?? []) as PostableSpace[];
}

// ---------- Page insights ----------
export async function getSpaceAnalytics(space_id: string, days = 7) {
  const { data, error } = await (supabase as any).rpc("space_analytics", { _space: space_id, _window_days: days });
  if (error) throw error;
  return data as {
    posts: number; comments: number; reactions: number; views: number; new_members: number;
    top_posts: { id: string; body: string; views: number }[];
  };
}

// ---------- Message a Page (DM to first admin) ----------
export async function messagePageAdmin(space: Space, me: string): Promise<string> {
  // find an admin user
  const { data: admin } = await supabase
    .from("space_members").select("user_id").eq("space_id", space.id).eq("role", "admin").limit(1).maybeSingle();
  const adminId = admin?.user_id ?? space.owner_id;
  if (!adminId) throw new Error("No admin to message");
  // find existing 1:1 thread
  const { data: mine } = await supabase.from("dm_members").select("thread_id").eq("user_id", me);
  const myIds = (mine ?? []).map((m) => m.thread_id);
  if (myIds.length) {
    const { data: shared } = await supabase.from("dm_members")
      .select("thread_id").eq("user_id", adminId).in("thread_id", myIds);
    if (shared && shared.length) return shared[0].thread_id as string;
  }
  const { data: t, error } = await supabase.from("dm_threads").insert({}).select("id").single();
  if (error) throw error;
  await supabase.from("dm_members").insert([{ thread_id: t.id, user_id: me }, { thread_id: t.id, user_id: adminId }]);
  return t.id as string;
}

// ---------- Pending invites for me ----------
export async function listMyPendingInvites(uid: string) {
  const { data } = await (supabase as any).from("space_invites")
    .select("id, space_id, created_at, invited_by, status")
    .eq("invited_user_id", uid).eq("status", "pending");
  const rows = (data ?? []) as { id: string; space_id: string; created_at: string; invited_by: string; status: string }[];
  if (!rows.length) return [] as Array<typeof rows[number] & { space: Space | null; by: { username: string; display_name: string } | null }>;
  const sids = Array.from(new Set(rows.map((r) => r.space_id)));
  const uids = Array.from(new Set(rows.map((r) => r.invited_by)));
  const [{ data: spaces }, { data: profs }] = await Promise.all([
    supabase.from("spaces").select("*").in("id", sids),
    supabase.from("profiles").select("id, username, display_name").in("id", uids),
  ]);
  const smap = new Map((spaces ?? []).map((s: any) => [s.id, s]));
  const pmap = new Map((profs ?? []).map((p: any) => [p.id, p]));
  return rows.map((r) => ({ ...r, space: (smap.get(r.space_id) as Space) ?? null, by: (pmap.get(r.invited_by) as any) ?? null }));
}
