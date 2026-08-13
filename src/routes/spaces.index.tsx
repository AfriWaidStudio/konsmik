import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useEffect, useState } from "react";
import { listSpaces, KIND_LABELS, MEMBER_LABEL, type Space, type SpaceKind } from "@/lib/spaces";
import { CreateSpaceDialog } from "@/components/space/CreateSpaceDialog";
import { Button } from "@/components/ui/button";
import { Plus, Users, Building2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/spaces/")({
  head: () => ({ meta: [{ title: "Groups, Pages & Circles — Konsmia" }] }),
  component: SpacesPage,
});

const TABS: { id: SpaceKind; label: string; Icon: any }[] = [
  { id: "group", label: "Groups", Icon: Users },
  { id: "page", label: "Pages", Icon: Building2 },
  { id: "circle", label: "Circles", Icon: Lock },
];

function SpacesPage() {
  const [tab, setTab] = useState<SpaceKind>("group");
  const [items, setItems] = useState<Space[]>([]);
  const [open, setOpen] = useState(false);

  const load = () => listSpaces(tab).then(setItems).catch(() => setItems([]));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Spaces</h1>
        <Button onClick={() => setOpen(true)} size="sm" className="bg-primary text-primary-foreground gap-1"><Plus className="h-4 w-4" /> Create</Button>
      </div>
      <div className="mt-3 flex gap-2">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold",
              tab === id ? "bg-primary text-primary-foreground" : "border border-border/60 text-foreground/80")}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-muted-foreground">
            No {KIND_LABELS[tab].plural.toLowerCase()} yet. Create the first one.
          </div>
        )}
        {items.map((s) => (
          <Link key={s.id} to="/spaces/$slug" params={{ slug: s.slug }} className="block overflow-hidden rounded-2xl border border-border/60 bg-card transition hover:border-primary/40">
            <div
              className="h-20 w-full"
              style={{
                background: s.cover_url
                  ? `url(${s.cover_url}) center/cover`
                  : `linear-gradient(135deg, ${s.theme_color || "#a855f7"}, hsl(var(--accent)))`,
              }}
            />
            <div className="flex items-center gap-3 p-4">
              <div
                className="-mt-8 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-background text-lg font-bold text-white"
                style={{ background: s.avatar_url ? `url(${s.avatar_url}) center/cover` : (s.theme_color || "#a855f7") }}
              >
                {!s.avatar_url && s.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-semibold">{s.name}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">{s.description ?? "—"}</div>
                <div className="mt-1 text-xs text-primary">{s.member_count} {MEMBER_LABEL[s.kind as SpaceKind]} · {s.visibility.replace("_", " ")}{s.category ? ` · ${s.category}` : ""}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <CreateSpaceDialog open={open} onOpenChange={setOpen} defaultKind={tab} />
    </AppShell>
  );
}
