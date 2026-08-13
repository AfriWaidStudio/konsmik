import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { listMyThreads, searchUsersByUsername, findOrCreateDirectThread } from "@/lib/dm";
import { MessageSquare, PenSquare, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages — Konsmia" }] }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [threads, setThreads] = useState<any[]>([]);
  const [openNew, setOpenNew] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) listMyThreads(user.id).then(setThreads); }, [user]);
  useEffect(() => {
    if (!user || !openNew) return;
    const t = setTimeout(async () => setResults(await searchUsersByUsername(q, user.id)), 200);
    return () => clearTimeout(t);
  }, [q, openNew, user]);

  const start = async (otherId: string) => {
    if (!user) return;
    setBusy(true);
    try {
      const tid = await findOrCreateDirectThread(user.id, otherId);
      nav({ to: "/messages/$id", params: { id: tid } });
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  if (!user) return <AppShell><div className="rounded-xl border border-dashed p-8 text-center">Sign in to see messages.</div></AppShell>;
  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-primary"><MessageSquare className="h-6 w-6" /> Messages</h1>
        <Button size="sm" onClick={() => setOpenNew((v) => !v)} className="bg-primary text-primary-foreground gap-1">
          <PenSquare className="h-4 w-4" /> New
        </Button>
      </div>

      {openNew && (
        <div className="mt-3 rounded-2xl border border-border/60 bg-card p-3 space-y-2">
          <Input autoFocus placeholder="Search @username…" value={q} onChange={(e) => setQ(e.target.value)} className="bg-background" />
          <div className="max-h-60 overflow-y-auto space-y-1">
            {results.map((p) => (
              <button key={p.id} disabled={busy} onClick={() => start(p.id)}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-muted">
                <Avatar className="h-8 w-8 bg-primary/20">
                  {p.avatar_url && <AvatarImage src={p.avatar_url} />}
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">{(p.display_name ?? "U").slice(0,1)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{p.display_name}</div>
                  <div className="text-xs text-muted-foreground">@{p.username}</div>
                </div>
              </button>
            ))}
            {q && results.length === 0 && <div className="text-xs text-muted-foreground p-2">No users found</div>}
          </div>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {threads.length === 0 && <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">No conversations yet. Open someone's profile to start one.</div>}
        {threads.map((t) => (
          <Link key={t.id} to="/messages/$id" params={{ id: t.id }} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 hover:border-primary/40">
            <Avatar className="h-10 w-10 bg-primary/20">
              {t.others[0]?.avatar_url && <AvatarImage src={t.others[0].avatar_url} />}
              <AvatarFallback className="bg-primary/20 text-primary text-sm">{(t.others[0]?.display_name ?? "U").slice(0,1)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{t.others.map((o: any) => o.display_name).join(", ") || "Conversation"}</div>
              <div className="text-xs text-muted-foreground truncate">
                {t.last_message?.body ?? `@${t.others[0]?.username ?? "—"}`}
              </div>
            </div>
            {t.unread && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
            {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
