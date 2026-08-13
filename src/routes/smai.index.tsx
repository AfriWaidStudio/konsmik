import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { uploadToMedia } from "@/lib/upload";
import {
  SMAI_PLATFORMS,
  addSmaiLink,
  convertTokens,
  fetchSmaiLinks,
  fetchSmaiProfile,
  fetchTransactions,
  fetchWallet,
  listSmaiDirectory,
  removeSmaiLink,
  saveSmaiProfile,
  sendMaiki,
  updateSmaiLink,
  type MaikiTx,
  type MaikiWallet,
  type SmaiDirectoryEntry,
  type SmaiLink,
} from "@/lib/smai";
import { NICHES, NICHE_MAP, OPEN_TO_OPTIONS, nicheValue, setNicheValue, type NicheId } from "@/lib/smai-niches";
import { cn } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, Compass, Copy, Eye, EyeOff, Globe, Link2, Plus, Search, Sparkles, Trash2, UserCircle2, Wallet } from "lucide-react";

export const Route = createFileRoute("/smai/")({
  head: () => ({
    meta: [
      { title: "Smai Identity — Your digital self & Maiki wallet" },
      { name: "description", content: "Build your Smai identity card, connect every social account, and manage your personalized Maiki wallet." },
      { property: "og:title", content: "Smai Identity — Konsmia" },
      { property: "og:description", content: "One identity card for all your social accounts, plus your Maiki wallet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { user, profile, refreshProfile } = useAuth();

  const [form, setForm] = useState({
    headline: "",
    tagline: "",
    about: "",
    location: "",
    website: "",
    pronouns: "",
    skills: "",
    banner_url: "",
    theme_color: "#22d3ee",
    is_public: true,
    hire_url: "",
  });
  const [niches, setNiches] = useState<NicheId[]>([]);
  const [nicheData, setNicheData] = useState<Record<string, any>>({});
  const [openTo, setOpenTo] = useState<string[]>([]);
  const [dirNiche, setDirNiche] = useState<string>("");
  const [dirQuery, setDirQuery] = useState("");
  const [dirRows, setDirRows] = useState<SmaiDirectoryEntry[]>([]);
  const [links, setLinks] = useState<SmaiLink[]>([]);
  const [wallet, setWallet] = useState<MaikiWallet | null>(null);
  const [txs, setTxs] = useState<MaikiTx[]>([]);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const [newLink, setNewLink] = useState({ platform: "x", handle: "", followers: "" });
  const [convertAmount, setConvertAmount] = useState("");
  const [send, setSend] = useState({ address: "", amount: "", note: "" });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [p, l, w, t] = await Promise.all([
        fetchSmaiProfile(user.id),
        fetchSmaiLinks(user.id),
        fetchWallet(user.id),
        fetchTransactions(user.id),
      ]);
      if (p) {
        setForm({
          headline: p.headline ?? "",
          tagline: p.tagline ?? "",
          about: p.about ?? "",
          location: p.location ?? "",
          website: p.website ?? "",
          pronouns: p.pronouns ?? "",
          skills: (p.skills ?? []).join(", "),
          banner_url: p.banner_url ?? "",
          theme_color: p.theme_color ?? "#22d3ee",
          is_public: p.is_public,
          hire_url: p.hire_url ?? "",
        });
        setNiches(((p.niches ?? []) as string[]).filter((n) => NICHE_MAP[n]) as NicheId[]);
        setNicheData((p.niche_data ?? {}) as Record<string, any>);
        setOpenTo((p.open_to ?? []) as string[]);
      }
      setLinks(l);
      setWallet(w);
      setTxs(t);
    })();
  }, [user]);

  useEffect(() => {
    listSmaiDirectory({ niche: dirNiche || undefined, q: dirQuery || undefined })
      .then(setDirRows)
      .catch(() => setDirRows([]));
  }, [dirNiche, dirQuery]);

  const reloadWallet = async () => {
    if (!user) return;
    const [w, t] = await Promise.all([fetchWallet(user.id), fetchTransactions(user.id)]);
    setWallet(w);
    setTxs(t);
    await refreshProfile();
  };

  if (!user) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-border/60 bg-card p-6 text-center">
          <UserCircle2 className="mx-auto mb-2 h-8 w-8 text-primary" />
          <p className="text-foreground/80">Sign in to build your Smai identity and open your Maiki wallet.</p>
          <Link to="/login" className="mt-3 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Sign in</Link>
        </div>
      </AppShell>
    );
  }

  const saveIdentity = async () => {
    setSaving(true);
    try {
      await saveSmaiProfile(user.id, {
        headline: form.headline || null,
        tagline: form.tagline || null,
        about: form.about || null,
        location: form.location || null,
        website: form.website || null,
        pronouns: form.pronouns || null,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        banner_url: form.banner_url || null,
        theme_color: form.theme_color,
        is_public: form.is_public,
        hire_url: form.hire_url || null,
        niches,
        niche_data: nicheData,
        open_to: openTo,
      });
      toast.success("Smai identity saved");
    } catch (e) {
      toast.error((e as Error).message);
    }
    setSaving(false);
  };

  const onBanner = async (file?: File | null) => {
    if (!file) return;
    try {
      const url = await uploadToMedia(file, user.id, "smai");
      setForm((f) => ({ ...f, banner_url: url }));
      toast.success("Banner uploaded — remember to save");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const connect = async () => {
    const meta = SMAI_PLATFORMS.find((p) => p.id === newLink.platform)!;
    const handle = newLink.handle.trim().replace(/^@/, "");
    if (!handle) return toast.error("Enter your handle or full URL");
    const url = handle.startsWith("http") ? handle : `${meta.base}${handle}`;
    try {
      await addSmaiLink(user.id, {
        platform: meta.id,
        handle,
        url,
        followers: newLink.followers ? Number(newLink.followers) : null,
      });
      setLinks(await fetchSmaiLinks(user.id));
      setNewLink({ platform: "x", handle: "", followers: "" });
      toast.success(`${meta.label} connected`);
    } catch (e) {
      toast.error((e as Error).message.includes("duplicate") ? "Already connected" : (e as Error).message);
    }
  };

  const doConvert = async () => {
    const n = Number(convertAmount);
    if (!n || n < 10) return toast.error("Minimum conversion is 10 tokens");
    setBusy(true);
    try {
      await convertTokens(Math.floor(n));
      setConvertAmount("");
      await reloadWallet();
      toast.success("Converted to Maiki");
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy(false);
  };

  const doSend = async () => {
    const n = Number(send.amount);
    if (!send.address.trim() || !n || n <= 0) return toast.error("Enter a wallet address and amount");
    setBusy(true);
    try {
      await sendMaiki(send.address.trim(), n, send.note || undefined);
      setSend({ address: "", amount: "", note: "" });
      await reloadWallet();
      toast.success("Maiki sent");
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy(false);
  };

  const saveNiches = async () => {
    setSaving(true);
    try {
      await saveSmaiProfile(user.id, { niches, niche_data: nicheData, open_to: openTo, hire_url: form.hire_url || null });
      toast.success("Niche profile saved");
    } catch (e) {
      toast.error((e as Error).message);
    }
    setSaving(false);
  };

  const toggleNiche = (id: NicheId) =>
    setNiches((prev) => (prev.includes(id) ? prev.filter((n) => n !== id) : prev.length >= 3 ? (toast.error("Pick up to 3 niches"), prev) : [...prev, id]));

  const tokens = profile?.tokens_earned ?? 0;

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-primary"><UserCircle2 className="h-6 w-6" /> Smai Identity</h1>
          <p className="text-xs text-muted-foreground">One card for everything you are — plus your Maiki wallet.</p>
        </div>
        {profile && (
          <Link to="/smai/$username" params={{ username: profile.username }} className="rounded-md border border-primary/40 px-3 py-2 text-xs font-semibold text-primary">
            View public card
          </Link>
        )}
      </div>

      <Tabs defaultValue="identity" className="mt-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="identity">Identity</TabsTrigger>
          <TabsTrigger value="niche">Niche</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
        </TabsList>

        <TabsContent value="niche" className="mt-4 space-y-3">
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary"><Sparkles className="h-4 w-4" /> Choose your world</div>
            <p className="mb-3 mt-1 text-xs text-muted-foreground">Pick up to 3. Your public card rebuilds itself around them.</p>
            <div className="grid grid-cols-2 gap-2">
              {NICHES.map((n) => {
                const active = niches.includes(n.id);
                return (
                  <button
                    key={n.id}
                    onClick={() => toggleNiche(n.id)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition",
                      active ? "border-primary bg-primary/10" : "border-border/60 hover:border-primary/40",
                    )}
                  >
                    <div className="text-lg" aria-hidden>{n.emoji}</div>
                    <div className="text-sm font-semibold">{n.label}</div>
                    <div className="text-[10px] text-muted-foreground">{n.tagline}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="mb-2 text-sm font-semibold text-primary">Open to</div>
            <div className="flex flex-wrap gap-2">
              {OPEN_TO_OPTIONS.map((o) => {
                const active = openTo.includes(o);
                return (
                  <button
                    key={o}
                    onClick={() => setOpenTo((p) => (active ? p.filter((x) => x !== o) : [...p, o]))}
                    className={cn("rounded-full border px-3 py-1 text-xs", active ? "border-accent bg-accent/15 text-accent" : "border-border/60 text-muted-foreground")}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
            <div className="mt-3">
              <Field label="Hire / contact link">
                <Input value={form.hire_url} onChange={(e) => setForm({ ...form, hire_url: e.target.value })} placeholder="https://cal.com/you" />
              </Field>
            </div>
          </div>

          {niches.map((id) => {
            const n = NICHE_MAP[id];
            return (
              <div key={id} className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
                <div className="text-sm font-semibold" style={{ color: n.accent }}>{n.emoji} {n.label}</div>
                {n.fields.map((f) => {
                  const val = nicheValue(nicheData, id, f.key);
                  const asString = f.type === "list" ? val.join(", ") : (val[0] ?? "");
                  return (
                    <Field key={f.key} label={f.label + (f.type === "list" ? " (comma separated)" : "")}>
                      {f.type === "textarea" ? (
                        <Textarea
                          rows={3}
                          value={asString}
                          placeholder={f.placeholder}
                          onChange={(e) => setNicheData(setNicheValue(nicheData, id, f.key, e.target.value))}
                        />
                      ) : (
                        <Input
                          value={asString}
                          placeholder={f.placeholder}
                          onChange={(e) =>
                            setNicheData(
                              f.type === "list"
                                ? { ...nicheData, [id]: { ...(nicheData[id] ?? {}), [f.key]: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } }
                                : setNicheValue(nicheData, id, f.key, e.target.value),
                            )
                          }
                        />
                      )}
                    </Field>
                  );
                })}
              </div>
            );
          })}

          <Button onClick={saveNiches} disabled={saving} className="w-full">{saving ? "Saving…" : "Save niche profile"}</Button>
        </TabsContent>

        <TabsContent value="discover" className="mt-4 space-y-3">
          <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary"><Compass className="h-4 w-4" /> Smai directory</div>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input value={dirQuery} onChange={(e) => setDirQuery(e.target.value)} placeholder="Search people, skills, places" className="pl-9" />
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setDirNiche("")} className={cn("rounded-full border px-3 py-1 text-xs", !dirNiche ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground")}>All</button>
              {NICHES.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setDirNiche(n.id)}
                  className={cn("rounded-full border px-3 py-1 text-xs", dirNiche === n.id ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground")}
                >
                  {n.emoji} {n.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {dirRows.length === 0 && <p className="rounded-2xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">No public identity cards match yet.</p>}
            {dirRows.map((e) => (
              <Link
                key={e.user_id}
                to="/smai/$username"
                params={{ username: e.profile?.username ?? "" }}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 transition hover:border-primary/40"
              >
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-primary/15" style={{ background: e.profile?.avatar_url ? `url(${e.profile.avatar_url}) center/cover` : undefined }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{e.profile?.display_name ?? e.profile?.username}</div>
                  <div className="truncate text-xs text-muted-foreground">{e.headline ?? e.tagline ?? e.profile?.title ?? "—"}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(e.niches ?? []).slice(0, 3).map((n) => NICHE_MAP[n] && (
                      <span key={n} className="rounded-full border border-border/60 px-2 py-0.5 text-[10px]" style={{ color: NICHE_MAP[n].accent }}>
                        {NICHE_MAP[n].emoji} {NICHE_MAP[n].label}
                      </span>
                    ))}
                    {(e.open_to ?? []).slice(0, 2).map((o) => (
                      <span key={o} className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] text-accent">{o}</span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="identity" className="mt-4 space-y-3">
          <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
            <Field label="Headline"><Input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="Builder of digital civilizations" /></Field>
            <Field label="Tagline"><Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Short line under your name" /></Field>
            <Field label="About"><Textarea rows={4} value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} placeholder="Tell the world everything about you" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Location"><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
              <Field label="Pronouns"><Input value={form.pronouns} onChange={(e) => setForm({ ...form, pronouns: e.target.value })} /></Field>
            </div>
            <Field label="Website"><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" /></Field>
            <Field label="Skills / tags (comma separated)"><Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="AI, design, music" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Theme colour">
                <input type="color" value={form.theme_color} onChange={(e) => setForm({ ...form, theme_color: e.target.value })} className="h-10 w-full rounded-md border border-border/60 bg-background" />
              </Field>
              <Field label="Banner">
                <Input type="file" accept="image/*" onChange={(e) => onBanner(e.target.files?.[0])} />
              </Field>
            </div>
            {form.banner_url && <img src={form.banner_url} alt="Smai identity banner" className="h-28 w-full rounded-xl object-cover" />}
            <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
              <div className="flex items-center gap-2 text-sm">
                {form.is_public ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                Public identity card
              </div>
              <Switch checked={form.is_public} onCheckedChange={(v) => setForm({ ...form, is_public: v })} />
            </div>
            <Button onClick={saveIdentity} disabled={saving} className="w-full">{saving ? "Saving…" : "Save identity"}</Button>
          </div>
        </TabsContent>

        <TabsContent value="connections" className="mt-4 space-y-3">
          <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary"><Link2 className="h-4 w-4" /> Connect an account</div>
            <select
              value={newLink.platform}
              onChange={(e) => setNewLink({ ...newLink, platform: e.target.value })}
              className="h-10 w-full rounded-md border border-border/60 bg-background px-3 text-sm"
            >
              {SMAI_PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <Input value={newLink.handle} onChange={(e) => setNewLink({ ...newLink, handle: e.target.value })} placeholder="@handle or full link" />
            <Input value={newLink.followers} onChange={(e) => setNewLink({ ...newLink, followers: e.target.value })} placeholder="Followers (optional)" inputMode="numeric" />
            <Button onClick={connect} className="w-full gap-2"><Plus className="h-4 w-4" /> Connect</Button>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="mb-2 text-sm font-semibold text-primary">Connected ({links.length})</div>
            {links.length === 0 && <p className="text-sm text-muted-foreground">No accounts connected yet.</p>}
            <div className="space-y-2">
              {links.map((l) => {
                const meta = SMAI_PLATFORMS.find((p) => p.id === l.platform);
                return (
                  <div key={l.id} className="flex items-center gap-2 rounded-xl border border-border/60 p-3">
                    <Globe className="h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{meta?.label ?? l.platform}</div>
                      <a href={l.url} target="_blank" rel="noreferrer" className="block truncate text-xs text-muted-foreground hover:text-primary">{l.url}</a>
                    </div>
                    {l.followers ? <span className="shrink-0 text-xs text-accent">{l.followers.toLocaleString()}</span> : null}
                    <button
                      aria-label="Toggle visibility"
                      onClick={async () => { await updateSmaiLink(l.id, { visible: !l.visible }); setLinks(await fetchSmaiLinks(user.id)); }}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-primary"
                    >
                      {l.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button
                      aria-label="Remove connection"
                      onClick={async () => { await removeSmaiLink(l.id); setLinks(await fetchSmaiLinks(user.id)); }}
                      className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="wallet" className="mt-4 space-y-3">
          <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 to-accent/10 p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary"><Wallet className="h-4 w-4" /> Maiki Wallet</div>
            <div className="mt-2 text-4xl font-bold text-foreground">{Number(wallet?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-lg text-primary">MK</span></div>
            <button
              onClick={() => { if (wallet) { navigator.clipboard.writeText(wallet.address); toast.success("Address copied"); } }}
              className="mt-2 inline-flex items-center gap-2 rounded-md border border-primary/30 px-2 py-1 text-xs text-muted-foreground"
            >
              <Copy className="h-3 w-3" /> {wallet?.address ?? "—"}
            </button>
            <div className="mt-3 text-xs text-muted-foreground">{tokens.toLocaleString()} tokens available · rate 10 tokens = 1 MK</div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
            <div className="text-sm font-semibold text-primary">Convert tokens</div>
            <Input value={convertAmount} onChange={(e) => setConvertAmount(e.target.value)} inputMode="numeric" placeholder="Tokens to convert (min 10)" />
            <div className="text-xs text-muted-foreground">You receive ≈ {(Number(convertAmount || 0) / 10).toFixed(2)} MK</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setConvertAmount(String(tokens))} className="flex-1">Max</Button>
              <Button onClick={doConvert} disabled={busy} className="flex-1">Convert</Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
            <div className="text-sm font-semibold text-primary">Send Maiki</div>
            <Input value={send.address} onChange={(e) => setSend({ ...send, address: e.target.value })} placeholder="Recipient wallet address (MK-…)" />
            <Input value={send.amount} onChange={(e) => setSend({ ...send, amount: e.target.value })} inputMode="decimal" placeholder="Amount" />
            <Input value={send.note} onChange={(e) => setSend({ ...send, note: e.target.value })} placeholder="Note (optional)" />
            <Button onClick={doSend} disabled={busy} className="w-full">Send</Button>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="mb-2 text-sm font-semibold text-primary">Activity</div>
            {txs.length === 0 && <p className="text-sm text-muted-foreground">No transactions yet.</p>}
            <div className="space-y-2">
              {txs.map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                  {Number(t.amount) >= 0 ? <ArrowDownLeft className="h-4 w-4 text-primary" /> : <ArrowUpRight className="h-4 w-4 text-destructive" />}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm capitalize">{t.kind}</div>
                    <div className="truncate text-xs text-muted-foreground">{t.note ?? new Date(t.created_at).toLocaleString()}</div>
                  </div>
                  <div className={Number(t.amount) >= 0 ? "text-sm font-semibold text-primary" : "text-sm font-semibold text-destructive"}>
                    {Number(t.amount) >= 0 ? "+" : ""}{Number(t.amount).toFixed(2)} MK
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}