import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Crown, MessageSquare, Star, Trophy, Users, Building2, Lock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { listSpaces, type Space } from "@/lib/spaces";
import { CreateSpaceDialog } from "@/components/space/CreateSpaceDialog";

export const Route = createFileRoute("/community")({
  head: () => ({ meta: [{ title: "Community — Konsmia" }] }),
  component: CommunityPage,
});

const TABS = [
  { id: "members", label: "Members", Icon: Users },
  { id: "groups", label: "Groups", Icon: Users },
  { id: "pages", label: "Pages", Icon: Building2 },
  { id: "circles", label: "Circles", Icon: Lock },
  { id: "events", label: "Events", Icon: Calendar },
  { id: "board", label: "Board", Icon: Trophy },
] as const;

function CommunityPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("members");
  const [members, setMembers] = useState<any[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (tab === "members" || tab === "board") {
      supabase.from("profiles").select("*").order("tokens_earned", { ascending: false }).limit(50).then(({ data }) => setMembers(data ?? []));
    } else if (tab === "groups") listSpaces("group").then(setSpaces);
    else if (tab === "pages") listSpaces("page").then(setSpaces);
    else if (tab === "circles") listSpaces("circle").then(setSpaces);
  }, [tab]);

  const filtered = members.filter((m) => !search || `${m.display_name} ${m.username}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppShell>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn("flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition",
              tab === id ? "bg-primary text-primary-foreground" : "border border-border/60 text-foreground/80")}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {(tab === "members" || tab === "board") && (
        <div className="mt-3 space-y-3">
          {tab === "members" && <Input placeholder="Search members..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-input/40" />}
          {filtered.map((m, i) => (
            <Link key={m.id} to="/profile/$username" params={{ username: m.username }} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3">
              {tab === "board" && <span className="text-primary font-bold w-6">#{i + 1}</span>}
              <Avatar className="h-12 w-12 bg-primary/20">
                <AvatarFallback className="bg-primary/20 text-primary">
                  {m.display_name?.split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-semibold">{m.display_name}</div>
                <div className="text-xs text-muted-foreground">{m.title}</div>
                <div className="mt-1 flex items-center gap-2 text-xs"><Crown className="h-3 w-3 text-accent" /><Star className="h-3 w-3 text-primary" /> {m.tokens_earned}</div>
              </div>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}

      {(tab === "groups" || tab === "pages" || tab === "circles") && (
        <div className="mt-3 space-y-3">
          <Button onClick={() => setCreateOpen(true)} className="w-full gap-1 bg-primary text-primary-foreground"><Plus className="h-4 w-4" /> Create</Button>
          {spaces.length === 0 && <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-muted-foreground">No {tab} yet.</div>}
          {spaces.map((s) => (
            <Link key={s.id} to="/spaces/$slug" params={{ slug: s.slug }} className="block rounded-2xl border border-border/60 bg-card p-3">
              <div className="font-semibold">{s.name}</div>
              <div className="text-xs text-muted-foreground line-clamp-2">{s.description ?? "—"}</div>
              <div className="mt-1 text-xs text-primary">{s.member_count} members · {s.visibility}</div>
            </Link>
          ))}
        </div>
      )}

      {tab === "events" && <EventsTab />}

      <CreateSpaceDialog open={createOpen} onOpenChange={setCreateOpen} defaultKind={tab === "pages" ? "page" : tab === "circles" ? "circle" : "group"} />
    </AppShell>
  );
}

function EventsTab() {
  const [events, setEvents] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("space_events")
        .select("id, title, description, starts_at, location, space_id")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(50);
      const sids = Array.from(new Set((data ?? []).map((e: any) => e.space_id)));
      const { data: spaces } = sids.length
        ? await supabase.from("spaces").select("id, name, slug").in("id", sids)
        : { data: [] as any[] };
      const smap = new Map((spaces ?? []).map((s: any) => [s.id, s]));
      setEvents((data ?? []).map((e: any) => ({ ...e, space: smap.get(e.space_id) })));
    })();
  }, []);
  if (!events.length) {
    return <div className="mt-4 rounded-2xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">No upcoming events yet. Create one inside any Group or Circle.</div>;
  }
  return (
    <div className="mt-3 space-y-3">
      {events.map((e) => (
        <Link key={e.id} to="/spaces/$slug" params={{ slug: e.space?.slug ?? "" }} className="block rounded-2xl border border-border/60 bg-card p-3">
          <div className="flex items-center gap-2 text-xs text-primary">
            <Calendar className="h-3 w-3" /> {new Date(e.starts_at).toLocaleString()}
          </div>
          <div className="mt-1 font-semibold">{e.title}</div>
          <div className="text-xs text-muted-foreground line-clamp-2">{e.description}</div>
          {e.space && <div className="mt-1 text-[10px] uppercase tracking-wider text-accent">in {e.space.name}</div>}
        </Link>
      ))}
    </div>
  );
}
