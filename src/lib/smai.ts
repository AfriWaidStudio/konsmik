import { supabase } from "@/integrations/supabase/client";

export type SmaiProfile = {
  user_id: string;
  headline: string | null;
  tagline: string | null;
  about: string | null;
  location: string | null;
  website: string | null;
  pronouns: string | null;
  skills: string[];
  banner_url: string | null;
  theme_color: string;
  is_public: boolean;
  verified: boolean;
  views: number;
  niches: string[];
  niche_data: Record<string, any>;
  open_to: string[];
  hire_url: string | null;
  rate_card: string | null;
};

export type SmaiLink = {
  id: string;
  user_id: string;
  platform: string;
  handle: string | null;
  url: string;
  followers: number | null;
  visible: boolean;
  verified: boolean;
  sort_order: number;
};

export type MaikiWallet = {
  user_id: string;
  address: string;
  balance: number;
  locked: boolean;
};

export type MaikiTx = {
  id: string;
  kind: string;
  amount: number;
  balance_after: number | null;
  note: string | null;
  created_at: string;
};

export const SMAI_PLATFORMS = [
  { id: "x", label: "X (Twitter)", base: "https://x.com/" },
  { id: "instagram", label: "Instagram", base: "https://instagram.com/" },
  { id: "facebook", label: "Facebook", base: "https://facebook.com/" },
  { id: "tiktok", label: "TikTok", base: "https://tiktok.com/@" },
  { id: "youtube", label: "YouTube", base: "https://youtube.com/@" },
  { id: "linkedin", label: "LinkedIn", base: "https://linkedin.com/in/" },
  { id: "github", label: "GitHub", base: "https://github.com/" },
  { id: "threads", label: "Threads", base: "https://threads.net/@" },
  { id: "snapchat", label: "Snapchat", base: "https://snapchat.com/add/" },
  { id: "telegram", label: "Telegram", base: "https://t.me/" },
  { id: "whatsapp", label: "WhatsApp", base: "https://wa.me/" },
  { id: "discord", label: "Discord", base: "https://discord.com/users/" },
  { id: "twitch", label: "Twitch", base: "https://twitch.tv/" },
  { id: "pinterest", label: "Pinterest", base: "https://pinterest.com/" },
  { id: "reddit", label: "Reddit", base: "https://reddit.com/user/" },
  { id: "spotify", label: "Spotify", base: "https://open.spotify.com/user/" },
  { id: "medium", label: "Medium", base: "https://medium.com/@" },
  { id: "behance", label: "Behance", base: "https://behance.net/" },
  { id: "dribbble", label: "Dribbble", base: "https://dribbble.com/" },
  { id: "website", label: "Website", base: "" },
] as const;

const db = supabase as any;

export async function fetchSmaiProfile(userId: string) {
  const { data } = await db.from("smai_profiles").select("*").eq("user_id", userId).maybeSingle();
  return (data as SmaiProfile) ?? null;
}

export async function saveSmaiProfile(userId: string, patch: Partial<SmaiProfile>) {
  const { data, error } = await db
    .from("smai_profiles")
    .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data as SmaiProfile;
}

export async function fetchSmaiLinks(userId: string) {
  const { data } = await db
    .from("smai_links")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  return (data as SmaiLink[]) ?? [];
}

export async function addSmaiLink(userId: string, input: { platform: string; handle: string; url: string; followers?: number | null }) {
  const { error } = await db.from("smai_links").insert({
    user_id: userId,
    platform: input.platform,
    handle: input.handle || null,
    url: input.url,
    followers: input.followers ?? null,
  });
  if (error) throw error;
}

export async function updateSmaiLink(id: string, patch: Partial<SmaiLink>) {
  const { error } = await db.from("smai_links").update(patch).eq("id", id);
  if (error) throw error;
}

export async function removeSmaiLink(id: string) {
  const { error } = await db.from("smai_links").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchWallet(userId: string) {
  const { data } = await db.from("maiki_wallets").select("*").eq("user_id", userId).maybeSingle();
  if (data) return data as MaikiWallet;
  const { data: created } = await db.rpc("ensure_maiki_wallet", { _user: userId });
  return (created as MaikiWallet) ?? null;
}

export async function fetchTransactions(userId: string, limit = 30) {
  const { data } = await db
    .from("maiki_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as MaikiTx[]) ?? [];
}

export async function convertTokens(tokens: number) {
  const { data, error } = await db.rpc("convert_tokens_to_maiki", { _tokens: tokens });
  if (error) throw error;
  return data as MaikiWallet;
}

export async function sendMaiki(address: string, amount: number, note?: string) {
  const { data, error } = await db.rpc("send_maiki", { _to_address: address, _amount: amount, _note: note ?? null });
  if (error) throw error;
  return data as MaikiWallet;
}

export type SmaiDirectoryEntry = SmaiProfile & {
  profile: { username: string; display_name: string; avatar_url: string | null; title: string | null } | null;
};

export async function listSmaiDirectory(opts: { niche?: string; q?: string; openTo?: string } = {}) {
  let query = db.from("smai_profiles").select("*").eq("is_public", true).limit(60);
  if (opts.niche) query = query.contains("niches", [opts.niche]);
  if (opts.openTo) query = query.contains("open_to", [opts.openTo]);
  const { data } = await query;
  let rows = (data ?? []) as SmaiProfile[];
  const ids = rows.map((r) => r.user_id);
  if (!ids.length) return [] as SmaiDirectoryEntry[];
  const { data: profs } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, title")
    .in("id", ids);
  const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
  let out = rows.map((r) => ({ ...r, profile: (map.get(r.user_id) as any) ?? null })) as SmaiDirectoryEntry[];
  const q = opts.q?.trim().toLowerCase();
  if (q) {
    out = out.filter((e) =>
      [e.profile?.username, e.profile?.display_name, e.headline, e.tagline, e.location, ...(e.skills ?? [])]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }
  return out;
}