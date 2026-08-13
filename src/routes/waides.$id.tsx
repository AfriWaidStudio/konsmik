import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { beingChat, runMission } from "@/lib/beings.functions";
import {
  addTred,
  bumpRuns,
  clearBeingChat,
  completeMission,
  createMission,
  deleteBeing,
  deleteMission,
  getBeing,
  listBeingMessages,
  listMissions,
  listTreds,
  removeTred,
  saveBeingMessage,
  updateBeing,
  updateTred,
  type Being,
  type BeingMessage,
  type Mission,
  type TredBeing,
} from "@/lib/beings";
import { cn } from "@/lib/utils";
import { Bot, Loader2, Plus, Send, Sparkles, Trash2, UserCircle2, Workflow } from "lucide-react";

export const Route = createFileRoute("/waides/$id")({
  head: () => ({
    meta: [
      { title: "SmaiBeing console — Waides" },
      { name: "description", content: "Talk to your SmaiBeing, manage its TredBeings and assign missions it completes for you." },
      { property: "og:title", content: "SmaiBeing console — Konsmia Waides" },
      { property: "og:description", content: "An AI being with sub-workers that actually do the work." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const { user, profile } = useAuth();
  const nav = useNavigate();

  const [being, setBeing] = useState<Being | null>(null);
  const [treds, setTreds] = useState<TredBeing[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [messages, setMessages] = useState<BeingMessage[]>([]);
  const [input, setInput] = useState("");
  const [activeTred, setActiveTred] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  const [tredForm, setTredForm] = useState({ name: "", duty: "", instructions: "" });
  const [missionForm, setMissionForm] = useState({ title: "", brief: "", tred_id: "" });
  const [running, setRunning] = useState(false);

  const owner = !!user && being?.owner_id === user.id;

  const load = async () => {
    setLoading(true);
    const b = await getBeing(id);
    setBeing(b);
    if (b) {
      setTreds(await listTreds(b.id));
      if (user && b.owner_id === user.id) {
        setMissions(await listMissions(b.id));
      }
      if (user) setMessages(await listBeingMessages(b.id, user.id));
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending]);

  const spec = being
    ? {
        name: being.name,
        role: being.role,
        purpose: being.purpose,
        personality: being.personality,
        skills: being.skills,
        owner: profile?.display_name ?? null,
      }
    : null;

  const tredSpec = (tredId: string | null) => {
    const t = treds.find((x) => x.id === tredId);
    return t ? { name: t.name, duty: t.duty, instructions: t.instructions } : null;
  };

  const send = async () => {
    if (!being || !spec || !user) return toast.error("Sign in to talk to beings");
    const text = input.trim();
    if (!text) return;
    setInput("");
    const optimistic: BeingMessage = {
      id: `tmp-${Date.now()}`,
      being_id: being.id,
      tred_id: activeTred,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    setSending(true);
    try {
      await saveBeingMessage(user.id, being.id, "user", text, activeTred);
      const res = await beingChat({
        data: {
          being: spec,
          tred: tredSpec(activeTred),
          twin: being.kind === "twin",
          model: being.model,
          messages: [...messages, optimistic].map((m) => ({ role: m.role, content: m.content })),
        },
      });
      await saveBeingMessage(user.id, being.id, "assistant", res.content, activeTred);
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          being_id: being.id,
          tred_id: activeTred,
          role: "assistant",
          content: res.content,
          created_at: new Date().toISOString(),
        },
      ]);
      await bumpRuns(being.id, being.runs);
      setBeing({ ...being, runs: being.runs + 1 });
    } catch (e: any) {
      toast.error(e.message ?? "The being went quiet");
    } finally {
      setSending(false);
    }
  };

  const assignMission = async () => {
    if (!being || !spec || !user) return toast.error("Sign in first");
    if (!missionForm.title.trim() || !missionForm.brief.trim()) return toast.error("Title and brief are required");
    setRunning(true);
    let created: Mission | null = null;
    try {
      created = await createMission(user.id, {
        being_id: being.id,
        tred_id: missionForm.tred_id || null,
        title: missionForm.title.trim(),
        brief: missionForm.brief.trim(),
      });
      setMissions((m) => [created!, ...m]);
      const res = await runMission({
        data: {
          being: spec,
          tred: tredSpec(missionForm.tred_id || null),
          twin: being.kind === "twin",
          model: being.model,
          title: created.title,
          brief: created.brief,
        },
      });
      await completeMission(created.id, res.content, res.model, true);
      setMissions((m) =>
        m.map((x) => (x.id === created!.id ? { ...x, status: "done", result: res.content, model: res.model } : x)),
      );
      await bumpRuns(being.id, being.runs);
      setBeing({ ...being, runs: being.runs + 1 });
      setMissionForm({ title: "", brief: "", tred_id: "" });
      toast.success("Mission complete");
    } catch (e: any) {
      if (created) {
        await completeMission(created.id, e.message ?? "Failed", being.model, false);
        setMissions((m) => m.map((x) => (x.id === created!.id ? { ...x, status: "failed", result: e.message } : x)));
      }
      toast.error(e.message ?? "Mission failed");
    } finally {
      setRunning(false);
    }
  };

  const createTred = async () => {
    if (!being || !user) return;
    if (!tredForm.name.trim() || !tredForm.duty.trim()) return toast.error("Name and duty are required");
    await addTred(user.id, being.id, {
      name: tredForm.name.trim(),
      duty: tredForm.duty.trim(),
      instructions: tredForm.instructions.trim() || undefined,
      sort_order: treds.length,
    });
    setTredForm({ name: "", duty: "", instructions: "" });
    setTreds(await listTreds(being.id));
    toast.success("TredBeing assigned");
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </AppShell>
    );
  }

  if (!being) {
    return (
      <AppShell>
        <div className="rounded-xl border border-border/60 bg-card p-6 text-center text-sm text-muted-foreground">
          This being does not exist, or it is private.
          <div className="mt-3"><Link to="/waides" className="text-primary">Back to Waides</Link></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="mb-4 rounded-2xl border border-border/60 bg-card p-4" style={{ borderColor: `${being.accent}55` }}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full border-2"
            style={{ borderColor: being.accent, color: being.accent }}
          >
            {being.kind === "twin" ? <UserCircle2 className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold">{being.name}</h1>
            <p className="text-xs text-muted-foreground">{being.role} · {being.runs} runs · {treds.length} TredBeings</p>
          </div>
        </div>
        {being.purpose && <p className="mt-3 text-sm text-muted-foreground">{being.purpose}</p>}
        {!!being.skills?.length && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {being.skills.map((s) => (
              <span key={s} className="rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground">{s}</span>
            ))}
          </div>
        )}
      </header>

      <Tabs defaultValue="chat">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="treds">Treds</TabsTrigger>
          <TabsTrigger value="missions">Missions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-4">
          <div className="mb-2 flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveTred(null)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px]",
                activeTred === null ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-muted-foreground",
              )}
            >
              Whole being
            </button>
            {treds.filter((t) => t.active).map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTred(t.id)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px]",
                  activeTred === t.id ? "border-accent bg-accent/15 text-accent" : "border-border/60 text-muted-foreground",
                )}
              >
                {t.name}
              </button>
            ))}
          </div>

          <div className="min-h-[240px] space-y-2 rounded-xl border border-border/60 bg-card p-3">
            {!messages.length && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Say anything. {being.name} answers as itself — pick a Tred above to speak to one of its sub-workers.
              </p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
                  m.role === "user"
                    ? "ml-auto bg-primary/15 text-foreground"
                    : "mr-auto border border-border/60 bg-background text-foreground",
                )}
              >
                {m.content}
              </div>
            ))}
            {sending && (
              <div className="mr-auto flex items-center gap-2 rounded-2xl border border-border/60 px-3 py-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> thinking…
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="mt-2 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={`Message ${being.name}…`}
            />
            <Button onClick={send} disabled={sending}><Send className="h-4 w-4" /></Button>
          </div>
          {owner && !!messages.length && (
            <button
              className="mt-2 text-xs text-muted-foreground hover:text-destructive"
              onClick={async () => { if (user) { await clearBeingChat(being.id, user.id); setMessages([]); } }}
            >
              Clear this conversation
            </button>
          )}
        </TabsContent>

        <TabsContent value="treds" className="mt-4 space-y-3">
          {treds.map((t) => (
            <div key={t.id} className="rounded-xl border border-border/60 bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Workflow className="h-4 w-4 text-accent" /> {t.name}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{t.duty}</p>
                  {t.instructions && <p className="mt-1 text-[11px] text-muted-foreground/80">{t.instructions}</p>}
                </div>
                {owner && (
                  <div className="flex shrink-0 items-center gap-2">
                    <Switch
                      checked={t.active}
                      onCheckedChange={async (v) => {
                        await updateTred(t.id, { active: v });
                        setTreds((cur) => cur.map((x) => (x.id === t.id ? { ...x, active: v } : x)));
                      }}
                    />
                    <button
                      onClick={async () => { await removeTred(t.id); setTreds((cur) => cur.filter((x) => x.id !== t.id)); }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {!treds.length && (
            <p className="rounded-xl border border-border/60 bg-card p-4 text-sm text-muted-foreground">
              No TredBeings yet. A Tred is a sub-worker with exactly one duty — give this being a team.
            </p>
          )}

          {owner && (
            <div className="rounded-xl border border-border/60 bg-card p-3">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Plus className="h-4 w-4" /> New TredBeing</h2>
              <div className="space-y-2">
                <Input placeholder="Tred name" value={tredForm.name} onChange={(e) => setTredForm({ ...tredForm, name: e.target.value })} />
                <Input placeholder="Its single duty" value={tredForm.duty} onChange={(e) => setTredForm({ ...tredForm, duty: e.target.value })} />
                <Textarea placeholder="Standing instructions (optional)" value={tredForm.instructions} onChange={(e) => setTredForm({ ...tredForm, instructions: e.target.value })} />
                <Button className="w-full" onClick={createTred}>Assign Tred</Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="missions" className="mt-4 space-y-3">
          {owner && (
            <div className="rounded-xl border border-border/60 bg-card p-3">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-accent" /> Assign a mission</h2>
              <div className="space-y-2">
                <Input placeholder="Mission title" value={missionForm.title} onChange={(e) => setMissionForm({ ...missionForm, title: e.target.value })} />
                <Textarea placeholder="Brief — what exactly should be delivered?" value={missionForm.brief} onChange={(e) => setMissionForm({ ...missionForm, brief: e.target.value })} />
                <select
                  className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                  value={missionForm.tred_id}
                  onChange={(e) => setMissionForm({ ...missionForm, tred_id: e.target.value })}
                >
                  <option value="">Assign to the whole being</option>
                  {treds.filter((t) => t.active).map((t) => (
                    <option key={t.id} value={t.id}>{t.name} — {t.duty}</option>
                  ))}
                </select>
                <Button className="w-full" onClick={assignMission} disabled={running}>
                  {running ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run mission"}
                </Button>
              </div>
            </div>
          )}

          {missions.map((m) => (
            <div key={m.id} className="rounded-xl border border-border/60 bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{m.title}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {m.status.toUpperCase()} · {new Date(m.created_at).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={async () => { await deleteMission(m.id); setMissions((cur) => cur.filter((x) => x.id !== m.id)); }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{m.brief}</p>
              {m.result && (
                <div className="mt-2 whitespace-pre-wrap rounded-lg border border-border/60 bg-background p-2 text-sm">{m.result}</div>
              )}
            </div>
          ))}
          {owner && !missions.length && (
            <p className="rounded-xl border border-border/60 bg-card p-4 text-sm text-muted-foreground">
              No missions yet. Missions return finished work, not plans.
            </p>
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-4 space-y-3">
          {!owner ? (
            <p className="rounded-xl border border-border/60 bg-card p-4 text-sm text-muted-foreground">
              Only the owner of this being can change its settings.
            </p>
          ) : (
            <div className="space-y-3 rounded-xl border border-border/60 bg-card p-3">
              <Input value={being.name} onChange={(e) => setBeing({ ...being, name: e.target.value })} placeholder="Name" />
              <Input value={being.role} onChange={(e) => setBeing({ ...being, role: e.target.value })} placeholder="Role" />
              <Textarea value={being.purpose ?? ""} onChange={(e) => setBeing({ ...being, purpose: e.target.value })} placeholder="Purpose" />
              <Input value={being.personality} onChange={(e) => setBeing({ ...being, personality: e.target.value })} placeholder="Personality" />
              <Input
                value={(being.skills ?? []).join(", ")}
                onChange={(e) => setBeing({ ...being, skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                placeholder="Skills, comma separated"
              />
              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <div>
                  <div className="text-sm font-semibold">List for hire</div>
                  <p className="text-xs text-muted-foreground">Public beings appear in the Waides hire directory.</p>
                </div>
                <Switch checked={being.is_public} onCheckedChange={(v) => setBeing({ ...being, is_public: v })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Hire rate (MK)</label>
                <Input
                  type="number"
                  min={0}
                  value={being.hire_rate}
                  onChange={(e) => setBeing({ ...being, hire_rate: Number(e.target.value) })}
                />
              </div>
              <Button
                className="w-full"
                onClick={async () => {
                  try {
                    await updateBeing(being.id, {
                      name: being.name,
                      role: being.role,
                      purpose: being.purpose,
                      personality: being.personality,
                      skills: being.skills,
                      is_public: being.is_public,
                      hire_rate: being.hire_rate,
                    });
                    toast.success("Being updated");
                  } catch (e: any) {
                    toast.error(e.message ?? "Could not save");
                  }
                }}
              >
                Save being
              </Button>
              {being.kind !== "twin" && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={async () => {
                    await deleteBeing(being.id);
                    toast.success("Being released");
                    nav({ to: "/waides" });
                  }}
                >
                  Release this being
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}