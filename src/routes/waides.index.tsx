import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import {
  BEING_TEMPLATES,
  createBeing,
  ensureTwin,
  hireBeing,
  listMyBeings,
  listPublicBeings,
  spawnFromTemplate,
  type Being,
  type DirectoryBeing,
} from "@/lib/beings";
import { Bot, Coins, Loader2, Plus, Search, Sparkles, UserCircle2, Workflow } from "lucide-react";

export const Route = createFileRoute("/waides/")({
  head: () => ({
    meta: [
      { title: "Waides — SmaiBeings, your AI workforce" },
      {
        name: "description",
        content:
          "Waides is Konsmia's being layer: every account gets a Twin SmaiBeing, and you can create AI worker beings with TredBeings that carry out real duties.",
      },
      { property: "og:title", content: "Waides — SmaiBeings on Konsmia" },
      { property: "og:description", content: "Create AI beings with sub-workers, run missions, hire beings with Maiki." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { user, profile } = useAuth();
  const nav = useNavigate();
  const [twin, setTwin] = useState<Being | null>(null);
  const [mine, setMine] = useState<Being[]>([]);
  const [dir, setDir] = useState<DirectoryBeing[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", role: "", purpose: "", personality: "", skills: "" });

  const load = async () => {
    if (user) {
      const t = await ensureTwin(user.id);
      setTwin(t);
      const all = await listMyBeings(user.id);
      setMine(all.filter((b) => b.kind !== "twin"));
      if (t) setTwin(all.find((b) => b.kind === "twin") ?? t);
    }
    setDir(await listPublicBeings());
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const spawn = async (id: string) => {
    if (!user) return toast.error("Sign in to create a being");
    setBusy(id);
    try {
      const b = await spawnFromTemplate(user.id, id);
      toast.success(`${b.name} is alive`);
      nav({ to: "/waides/$id", params: { id: b.id } });
    } catch (e: any) {
      toast.error(e.message ?? "Could not create being");
    } finally {
      setBusy(null);
    }
  };

  const createCustom = async () => {
    if (!user) return toast.error("Sign in to create a being");
    if (!form.name.trim() || !form.role.trim()) return toast.error("Name and role are required");
    setBusy("custom");
    try {
      const b = await createBeing(user.id, {
        name: form.name.trim(),
        role: form.role.trim(),
        purpose: form.purpose.trim() || null,
        personality: form.personality.trim() || "calm, precise, useful",
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      });
      toast.success(`${b.name} is alive`);
      nav({ to: "/waides/$id", params: { id: b.id } });
    } catch (e: any) {
      toast.error(e.message ?? "Could not create being");
    } finally {
      setBusy(null);
    }
  };

  const hire = async (b: DirectoryBeing) => {
    setBusy(b.id);
    try {
      await hireBeing(b.id);
      toast.success(`${b.name} hired${b.hire_rate > 0 ? ` for ${b.hire_rate} MK` : ""}`);
    } catch (e: any) {
      toast.error(e.message ?? "Could not hire");
    } finally {
      setBusy(null);
    }
  };

  return (
    <AppShell>
      <header className="mb-4">
        <div className="flex items-center gap-2 text-accent">
          <Bot className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-widest">Waides · Being layer</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold">Your SmaiBeings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every account is born with a Twin. Beyond it you can raise worker beings — and each being commands TredBeings, small
          sub-workers with a single duty each. They chat, they run missions, they can be hired with Maiki.
        </p>
      </header>

      {!user && (
        <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
          <p className="font-semibold text-primary">Sign in to meet your Twin</p>
          <p className="mt-1 text-muted-foreground">Your Twin SmaiBeing is created automatically with your account.</p>
          <div className="mt-3 flex gap-2">
            <Link to="/login" className="rounded-md border border-primary/40 px-3 py-2 text-xs font-semibold text-primary">Sign in</Link>
            <Link to="/signup" className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">Create account</Link>
          </div>
        </div>
      )}

      <Tabs defaultValue="beings">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="beings">My beings</TabsTrigger>
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="market">Hire</TabsTrigger>
        </TabsList>

        <TabsContent value="beings" className="mt-4 space-y-3">
          {twin && <BeingCard being={twin} twin />}
          {mine.map((b) => (
            <BeingCard key={b.id} being={b} />
          ))}
          {user && !mine.length && (
            <p className="rounded-xl border border-border/60 bg-card p-4 text-sm text-muted-foreground">
              No worker beings yet. Spawn one from the Create tab — it arrives with its TredBeings already assigned.
            </p>
          )}
        </TabsContent>

        <TabsContent value="create" className="mt-4 space-y-4">
          <div>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-accent" /> Spawn an archetype
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {BEING_TEMPLATES.map((t) => (
                <div key={t.id} className="rounded-xl border border-border/60 bg-card p-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.accent }} />
                    <span className="text-sm font-semibold">{t.name}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{t.purpose}</p>
                  <p className="mt-2 text-[11px] text-accent">{t.treds.length} TredBeings included</p>
                  <Button size="sm" className="mt-3 w-full" disabled={busy === t.id} onClick={() => spawn(t.id)}>
                    {busy === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-1 h-4 w-4" /> Spawn</>}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-3">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Workflow className="h-4 w-4 text-primary" /> Or design your own being
            </h2>
            <div className="space-y-2">
              <Input placeholder="Being name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Role (e.g. Legal Analyst)" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
              <Textarea placeholder="Purpose — what does it exist to do?" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
              <Input placeholder="Personality (e.g. blunt, witty, precise)" value={form.personality} onChange={(e) => setForm({ ...form, personality: e.target.value })} />
              <Input placeholder="Skills, comma separated" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
              <Button className="w-full" disabled={busy === "custom"} onClick={createCustom}>
                {busy === "custom" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Bring it to life"}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="market" className="mt-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search beings by skill or role" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Button variant="secondary" onClick={async () => setDir(await listPublicBeings(q))}>Search</Button>
          </div>
          {dir.map((b) => (
            <div key={b.id} className="rounded-xl border border-border/60 bg-card p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link to="/waides/$id" params={{ id: b.id }} className="text-sm font-semibold hover:text-primary">
                    {b.name}
                  </Link>
                  <div className="text-xs text-muted-foreground">{b.role}</div>
                  {b.owner && <div className="mt-0.5 text-[11px] text-muted-foreground">raised by @{b.owner.username}</div>}
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs font-semibold text-accent">
                    <Coins className="h-3.5 w-3.5" /> {b.hire_rate > 0 ? `${b.hire_rate} MK` : "Free"}
                  </div>
                  <Button size="sm" className="mt-2" disabled={busy === b.id || !user} onClick={() => hire(b)}>
                    {busy === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hire"}
                  </Button>
                </div>
              </div>
              {b.purpose && <p className="mt-2 text-xs text-muted-foreground">{b.purpose}</p>}
              <div className="mt-2 text-[11px] text-muted-foreground">{b.runs} missions run</div>
            </div>
          ))}
          {!dir.length && (
            <p className="rounded-xl border border-border/60 bg-card p-4 text-sm text-muted-foreground">
              No public beings yet. Make one of yours public and it will appear here for others to hire.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function BeingCard({ being, twin }: { being: Being; twin?: boolean }) {
  return (
    <Link
      to="/waides/$id"
      params={{ id: being.id }}
      className="block rounded-xl border border-border/60 bg-card p-3 transition hover:border-primary/50"
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full border"
          style={{ borderColor: being.accent, color: being.accent }}
        >
          {twin ? <UserCircle2 className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{being.name}</span>
            {twin && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">TWIN</span>}
            {being.is_public && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">FOR HIRE</span>}
          </div>
          <div className="truncate text-xs text-muted-foreground">{being.role}</div>
        </div>
        <div className="text-right text-[11px] text-muted-foreground">{being.runs} runs</div>
      </div>
      {being.purpose && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{being.purpose}</p>}
    </Link>
  );
}