import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Heart, X, Star, RotateCcw, MapPin, MessageCircle, Sparkles, ImagePlus, Trash2, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uploadToMedia } from "@/lib/upload";
import {
  fetchDeck, fetchLikesYou, fetchMatches, fetchMyDatingProfile, swipe, undoLastSwipe,
  unmatch, upsertDatingProfile, type DatingProfile, type DeckCandidate, type MatchRow,
  fetchDatingStats, applyDeckFilters, EMPTY_FILTERS, ICEBREAKERS, sendIcebreaker,
  profileCompleteness, type DatingStats, type DeckFilters,
} from "@/lib/dating";

export const Route = createFileRoute("/dating")({
  component: DatingPage,
  head: () => ({
    meta: [
      { title: "Kons Dating — Conscious Connections" },
      { name: "description", content: "Meet aligned minds on Kons. Swipe, match and start a real conversation with people who share your frequency." },
      { property: "og:title", content: "Kons Dating — Conscious Connections" },
      { property: "og:description", content: "Swipe, match and chat with aligned minds inside the Kons civilization." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const GENDERS = ["woman", "man", "non-binary", "other"];
const INTENTS = ["connection", "friendship", "relationship", "collaboration"];

function DatingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<DatingProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deck, setDeck] = useState<DeckCandidate[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [likes, setLikes] = useState<any[]>([]);
  const [matchModal, setMatchModal] = useState<{ name: string; thread: string | null } | null>(null);
  const [tab, setTab] = useState("discover");
  const [stats, setStats] = useState<DatingStats | null>(null);
  const [filters, setFilters] = useState<DeckFilters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const refresh = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const p = await fetchMyDatingProfile(user.id);
      setProfile(p);
      if (p) {
        const [d, m, l, s] = await Promise.all([
          fetchDeck(user.id), fetchMatches(user.id), fetchLikesYou(user.id), fetchDatingStats(user.id),
        ]);
        setDeck(d); setMatches(m); setLikes(l); setStats(s);
      }
    } catch (e: any) { toast.error(e.message ?? "Could not load dating"); }
    setLoading(false);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user?.id]);

  const act = async (target: DeckCandidate, action: "like" | "pass" | "superlike") => {
    if (!user) return;
    setDeck((d) => d.filter((c) => c.user_id !== target.user_id));
    try {
      const res = await swipe(user.id, target.user_id, action);
      if (res.matched) {
        setMatchModal({ name: target.display_name, thread: res.thread_id });
        fetchMatches(user.id).then(setMatches).catch(() => {});
      }
      setLikes((l) => l.filter((x) => x.from_user !== target.user_id));
      fetchDatingStats(user.id).then(setStats).catch(() => {});
    } catch (e: any) { toast.error(e.message ?? "Swipe failed"); }
  };

  const undo = async () => {
    if (!user) return;
    const ok = await undoLastSwipe(user.id);
    if (ok) { toast.success("Last swipe undone"); fetchDeck(user.id).then(setDeck); }
    else toast("Nothing to undo");
  };

  if (!user) {
    return (
      <AppShell>
        <EmptyState title="Sign in to start dating" body="Kons Dating connects you with aligned minds. Create an account to build your dating profile." />
      </AppShell>
    );
  }

  const visibleDeck = applyDeckFilters(deck, filters);
  const completeness = profileCompleteness(profile);

  return (
    <AppShell>
      <header className="mb-4">
        <h1 className="flex items-center gap-2 text-xl font-bold text-primary">
          <Heart className="h-5 w-5 fill-primary" /> Kons Dating
        </h1>
        <p className="text-xs text-muted-foreground">Conscious connections — swipe, match, and talk.</p>
      </header>

      {loading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>
      ) : !profile ? (
        <ProfileEditor userId={user.id} initial={null} onSaved={(p) => { setProfile(p); refresh(); }} firstTime />
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="likes">Likes {likes.length ? `(${likes.length})` : ""}</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="profile">My profile</TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="mt-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                {visibleDeck.length} {visibleDeck.length === 1 ? "person" : "people"} to meet
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowFilters((v) => !v)}>
                <SlidersHorizontal className="mr-1 h-4 w-4" /> Filters
              </Button>
            </div>
            {showFilters && (
              <div className="mb-3 space-y-3 rounded-2xl border border-border/60 bg-card p-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Location">
                    <Input value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} placeholder="Lagos" className="bg-input/40" />
                  </Field>
                  <Field label="Interest">
                    <Input value={filters.interest} onChange={(e) => setFilters({ ...filters, interest: e.target.value })} placeholder="music" className="bg-input/40" />
                  </Field>
                </div>
                <Field label="Looking for">
                  <div className="flex flex-wrap gap-2">
                    {INTENTS.map((i) => (
                      <Chip key={i} active={filters.lookingFor === i} onClick={() => setFilters({ ...filters, lookingFor: filters.lookingFor === i ? null : i })}>{i}</Chip>
                    ))}
                  </div>
                </Field>
                <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
                  <div className="text-sm">Only profiles with photos</div>
                  <Switch checked={filters.withPhotosOnly} onCheckedChange={(v) => setFilters({ ...filters, withPhotosOnly: v })} />
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>Reset filters</Button>
              </div>
            )}
            {visibleDeck.length === 0 ? (
              <EmptyState title="No one new right now" body="You've seen everyone matching your preferences. Widen your filters or check back soon." action={<Button variant="outline" onClick={refresh}>Refresh</Button>} />
            ) : (
              <SwipeDeck deck={visibleDeck} onAct={act} onUndo={undo} />
            )}
          </TabsContent>

          <TabsContent value="likes" className="mt-4 space-y-3">
            {likes.length === 0 ? (
              <EmptyState title="No likes yet" body="When someone likes you, they'll show up here first." />
            ) : likes.map((l) => (
              <div key={l.from_user} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
                <Avatar url={l.profile?.avatar_url} name={l.profile?.display_name} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{l.profile?.display_name}</div>
                  <div className="text-xs text-muted-foreground">{l.action === "superlike" ? "Super liked you" : "Liked you"}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => act({ user_id: l.from_user, display_name: l.profile?.display_name } as any, "pass")}>Pass</Button>
                <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => act({ user_id: l.from_user, display_name: l.profile?.display_name } as any, "like")}>Like back</Button>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="matches" className="mt-4 space-y-3">
            {matches.length === 0 ? (
              <EmptyState title="No matches yet" body="Keep swiping — matches open a private chat instantly." />
            ) : matches.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
                <Avatar url={m.other?.avatar_url ?? null} name={m.other?.display_name} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{m.other?.display_name}</div>
                  <div className="text-xs text-muted-foreground">@{m.other?.username}</div>
                </div>
                {m.thread_id && (
                  <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => navigate({ to: "/messages/$id", params: { id: m.thread_id! } })}>
                    <MessageCircle className="mr-1 h-4 w-4" /> Chat
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => { await unmatch(m.id); setMatches((x) => x.filter((y) => y.id !== m.id)); toast("Unmatched"); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="profile" className="mt-4">
            <div className="mb-4 rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Profile strength</span>
                <span className="text-primary">{completeness.percent}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completeness.percent}%` }} />
              </div>
              {completeness.missing.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {completeness.missing.map((m) => <li key={m}>• {m}</li>)}
                </ul>
              )}
              {stats && (
                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: "Likes sent", value: stats.likesSent },
                    { label: "Likes in", value: stats.likesReceived },
                    { label: "Super", value: stats.superlikes },
                    { label: "Matches", value: stats.matches },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl border border-border/60 p-2">
                      <div className="text-lg font-bold text-primary">{s.value}</div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <ProfileEditor userId={user.id} initial={profile} onSaved={(p) => { setProfile(p); toast.success("Dating profile updated"); }} />
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={!!matchModal} onOpenChange={(o) => !o && setMatchModal(null)}>
        <DialogContent className="text-center">
          <DialogHeader><DialogTitle className="text-center text-primary">It's a match! ✨</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">You and {matchModal?.name} liked each other. A private chat is ready.</p>
          {matchModal?.thread && (
            <div className="mt-3 space-y-2 text-left">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Break the ice</div>
              {ICEBREAKERS.map((line) => (
                <button
                  key={line}
                  onClick={async () => {
                    const t = matchModal.thread!;
                    try {
                      await sendIcebreaker(t, user.id, line);
                      setMatchModal(null);
                      navigate({ to: "/messages/$id", params: { id: t } });
                    } catch (e: any) { toast.error(e.message ?? "Could not send"); }
                  }}
                  className="w-full rounded-xl border border-border/60 px-3 py-2 text-left text-sm hover:border-primary hover:text-primary"
                >
                  {line}
                </button>
              ))}
            </div>
          )}
          <div className="mt-2 flex justify-center gap-2">
            <Button variant="outline" onClick={() => setMatchModal(null)}>Keep swiping</Button>
            {matchModal?.thread && (
              <Button className="bg-primary text-primary-foreground" onClick={() => { const t = matchModal.thread!; setMatchModal(null); navigate({ to: "/messages/$id", params: { id: t } }); }}>
                Say hi
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Avatar({ url, name }: { url?: string | null; name?: string }) {
  return url ? (
    <img src={url} alt={name ?? "Member"} className="h-11 w-11 rounded-full object-cover" />
  ) : (
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">{(name ?? "?").slice(0, 1).toUpperCase()}</div>
  );
}

function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
      <Sparkles className="mx-auto mb-2 h-6 w-6 text-primary" />
      <div className="text-sm font-semibold">{title}</div>
      <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">{body}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

function SwipeDeck({ deck, onAct, onUndo }: { deck: DeckCandidate[]; onAct: (c: DeckCandidate, a: "like" | "pass" | "superlike") => void; onUndo: () => void }) {
  const top = deck[0];
  const [drag, setDrag] = useState(0);
  const start = useRef<number | null>(null);
  const [photoIdx, setPhotoIdx] = useState(0);

  useEffect(() => { setPhotoIdx(0); setDrag(0); }, [top?.user_id]);
  if (!top) return null;
  const photos = top.photos?.length ? top.photos : top.avatar_url ? [top.avatar_url] : [];

  const end = () => {
    if (drag > 110) onAct(top, "like");
    else if (drag < -110) onAct(top, "pass");
    setDrag(0);
    start.current = null;
  };

  return (
    <div>
      <div className="relative h-[62vh] min-h-[420px] select-none">
        {deck.slice(0, 3).map((c, i) => {
          const isTop = i === 0;
          return (
            <div
              key={c.user_id}
              className={cn("absolute inset-0 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-xl transition-transform", !isTop && "pointer-events-none")}
              style={{
                zIndex: 10 - i,
                transform: isTop
                  ? `translateX(${drag}px) rotate(${drag / 25}deg)`
                  : `scale(${1 - i * 0.04}) translateY(${i * 10}px)`,
                transition: start.current === null ? "transform 200ms ease" : "none",
              }}
              onPointerDown={isTop ? (e) => { start.current = e.clientX; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); } : undefined}
              onPointerMove={isTop ? (e) => { if (start.current !== null) setDrag(e.clientX - start.current); } : undefined}
              onPointerUp={isTop ? end : undefined}
              onPointerCancel={isTop ? end : undefined}
            >
              {(isTop ? photos : c.photos?.length ? c.photos : c.avatar_url ? [c.avatar_url] : []).length ? (
                <img
                  src={isTop ? photos[photoIdx] : (c.photos?.[0] ?? c.avatar_url)!}
                  alt={`${c.display_name}'s photo`}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/10 text-6xl font-bold text-primary">
                  {c.display_name.slice(0, 1).toUpperCase()}
                </div>
              )}

              {isTop && photos.length > 1 && (
                <>
                  <div className="absolute left-0 right-0 top-2 flex gap-1 px-3">
                    {photos.map((_, pi) => (
                      <span key={pi} className={cn("h-1 flex-1 rounded-full", pi === photoIdx ? "bg-primary" : "bg-foreground/25")} />
                    ))}
                  </div>
                  <button aria-label="Previous photo" className="absolute inset-y-0 left-0 w-1/3" onClick={() => setPhotoIdx((p) => Math.max(0, p - 1))} />
                  <button aria-label="Next photo" className="absolute inset-y-0 right-0 w-1/3" onClick={() => setPhotoIdx((p) => Math.min(photos.length - 1, p + 1))} />
                </>
              )}

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/80 to-transparent p-4">
                <div className="text-lg font-bold">
                  {c.display_name}{c.age ? <span className="ml-2 font-normal text-muted-foreground">{c.age}</span> : null}
                </div>
                <div className="text-xs text-muted-foreground">@{c.username}</div>
                {c.location && <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{c.location}</div>}
                {c.bio && <p className="mt-2 line-clamp-3 text-sm text-foreground/90">{c.bio}</p>}
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="rounded-full border border-primary/40 px-2 py-0.5 text-[10px] text-primary">{c.looking_for}</span>
                  {(c.interests ?? []).slice(0, 4).map((t) => (
                    <span key={t} className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">{t}</span>
                  ))}
                </div>
              </div>

              {isTop && drag > 40 && <Stamp label="LIKE" className="left-4 border-primary text-primary" />}
              {isTop && drag < -40 && <Stamp label="NOPE" className="right-4 border-destructive text-destructive" />}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <Button size="icon" variant="outline" className="h-12 w-12 rounded-full" onClick={onUndo} aria-label="Undo last swipe"><RotateCcw className="h-5 w-5" /></Button>
        <Button size="icon" variant="outline" className="h-14 w-14 rounded-full border-destructive/50 text-destructive" onClick={() => onAct(top, "pass")} aria-label="Pass"><X className="h-6 w-6" /></Button>
        <Button size="icon" variant="outline" className="h-12 w-12 rounded-full border-accent/50 text-accent" onClick={() => onAct(top, "superlike")} aria-label="Super like"><Star className="h-5 w-5" /></Button>
        <Button size="icon" className="h-14 w-14 rounded-full bg-primary text-primary-foreground" onClick={() => onAct(top, "like")} aria-label="Like"><Heart className="h-6 w-6" /></Button>
      </div>
    </div>
  );
}

function Stamp({ label, className }: { label: string; className: string }) {
  return (
    <div className={cn("absolute top-8 rounded-lg border-4 px-3 py-1 text-xl font-black tracking-widest", className)}>{label}</div>
  );
}

function ProfileEditor({ userId, initial, onSaved, firstTime }: { userId: string; initial: DatingProfile | null; onSaved: (p: DatingProfile) => void; firstTime?: boolean }) {
  const [form, setForm] = useState({
    active: initial?.active ?? true,
    age: initial?.age ?? 21,
    gender: initial?.gender ?? "other",
    interested_in: initial?.interested_in ?? ["everyone"],
    bio: initial?.bio ?? "",
    location: initial?.location ?? "",
    looking_for: initial?.looking_for ?? "connection",
    interests: (initial?.interests ?? []).join(", "),
    min_age: initial?.min_age ?? 18,
    max_age: initial?.max_age ?? 60,
  });
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? []);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleInterest = (g: string) => {
    setForm((f) => {
      const has = f.interested_in.includes(g);
      let next = has ? f.interested_in.filter((x) => x !== g) : [...f.interested_in.filter((x) => x !== "everyone"), g];
      if (g === "everyone") next = ["everyone"];
      return { ...f, interested_in: next.length ? next : ["everyone"] };
    });
  };

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const urls = await Promise.all(Array.from(files).slice(0, 6).map((f) => uploadToMedia(f, userId, "dating")));
      setPhotos((p) => [...p, ...urls].slice(0, 6));
    } catch (e: any) { toast.error(e.message ?? "Upload failed"); }
  };

  const save = async () => {
    if (form.age < 18) { toast.error("You must be 18 or older to use Kons Dating"); return; }
    setSaving(true);
    try {
      const p = await upsertDatingProfile(userId, {
        active: form.active,
        age: Number(form.age),
        gender: form.gender,
        interested_in: form.interested_in,
        bio: form.bio,
        location: form.location,
        looking_for: form.looking_for,
        interests: form.interests.split(",").map((s) => s.trim()).filter(Boolean),
        min_age: Number(form.min_age),
        max_age: Number(form.max_age),
        photos,
      });
      onSaved(p);
    } catch (e: any) { toast.error(e.message ?? "Could not save"); }
    setSaving(false);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-4">
      {firstTime && (
        <div className="rounded-xl bg-primary/10 p-3 text-sm text-primary">
          Create your dating profile to start meeting aligned minds. You can turn it off any time.
        </div>
      )}

      <div>
        <label className="text-xs font-semibold uppercase text-muted-foreground">Photos</label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {photos.map((url) => (
            <div key={url} className="relative aspect-square overflow-hidden rounded-xl border border-border/60">
              <img src={url} alt="Dating profile photo" className="h-full w-full object-cover" />
              <button onClick={() => setPhotos((p) => p.filter((x) => x !== url))} className="absolute right-1 top-1 rounded-full bg-background/80 p-1" aria-label="Remove photo">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {photos.length < 6 && (
            <button onClick={() => fileRef.current?.click()} className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground">
              <ImagePlus className="h-5 w-5" />
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Age">
          <Input type="number" min={18} value={form.age} onChange={(e) => setForm({ ...form, age: Number(e.target.value) })} className="bg-input/40" />
        </Field>
        <Field label="Location">
          <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Lagos, NG" className="bg-input/40" />
        </Field>
      </div>

      <Field label="I identify as">
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((g) => (
            <Chip key={g} active={form.gender === g} onClick={() => setForm({ ...form, gender: g })}>{g}</Chip>
          ))}
        </div>
      </Field>

      <Field label="Show me">
        <div className="flex flex-wrap gap-2">
          {["everyone", ...GENDERS].map((g) => (
            <Chip key={g} active={form.interested_in.includes(g)} onClick={() => toggleInterest(g)}>{g}</Chip>
          ))}
        </div>
      </Field>

      <Field label="Looking for">
        <div className="flex flex-wrap gap-2">
          {INTENTS.map((g) => (
            <Chip key={g} active={form.looking_for === g} onClick={() => setForm({ ...form, looking_for: g })}>{g}</Chip>
          ))}
        </div>
      </Field>

      <Field label="About you">
        <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} placeholder="What are you exploring right now?" className="bg-input/40" />
      </Field>

      <Field label="Interests (comma separated)">
        <Input value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} placeholder="meditation, music, startups" className="bg-input/40" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Min age"><Input type="number" min={18} value={form.min_age} onChange={(e) => setForm({ ...form, min_age: Number(e.target.value) })} className="bg-input/40" /></Field>
        <Field label="Max age"><Input type="number" value={form.max_age} onChange={(e) => setForm({ ...form, max_age: Number(e.target.value) })} className="bg-input/40" /></Field>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
        <div>
          <div className="text-sm font-semibold">Visible in Discover</div>
          <div className="text-xs text-muted-foreground">Turn off to hide your dating profile.</div>
        </div>
        <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
      </div>

      <Button onClick={save} disabled={saving} className="w-full bg-primary text-primary-foreground">
        {saving ? "Saving…" : firstTime ? "Create dating profile" : "Save changes"}
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs capitalize",
        active ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}