import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Bell, Heart, MessageCircle, UserPlus, Star, AtSign } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Konsmia" }] }),
  component: Page,
});

const ICONS: Record<string, any> = { like: Heart, comment: MessageCircle, follow: UserPlus, token: Star, mention: AtSign };

const TABS = [
  { id: "all", label: "All" },
  { id: "important", label: "Important" },
  { id: "social", label: "Social" },
  { id: "system", label: "System" },
] as const;

function Page() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");

  const load = () => {
    if (!user) return;
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => setItems(data ?? []));
  };

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase.channel("notif-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filtered = tab === "all" ? items : items.filter((n) => (n.priority ?? "social") === tab);

  // Bundle same type+target within 1 hour
  const bundled: any[] = [];
  filtered.forEach((n) => {
    const key = `${n.type}:${n.payload?.post_id ?? ""}`;
    const last = bundled[bundled.length - 1];
    if (last && last._key === key && (new Date(last.created_at).getTime() - new Date(n.created_at).getTime()) < 3600_000) {
      last._bundle = (last._bundle ?? 1) + 1;
    } else {
      bundled.push({ ...n, _key: key });
    }
  });

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    load();
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-primary"><Bell className="h-6 w-6" /> Notifications</h1>
        <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold",
              tab === t.id ? "bg-primary text-primary-foreground" : "border border-border/60 text-foreground/70",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {bundled.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
            You're all caught up.
          </div>
        )}
        {bundled.map((n) => {
          const Icon = ICONS[n.type] ?? Bell;
          const msg = n._bundle && n._bundle > 1
            ? `${n._bundle} ${n.type}s on your post`
            : (n.payload?.message ?? n.type);
          return (
            <div key={n.id} className={cn("flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3", !n.read && "border-primary/40 bg-primary/5")}>
              <Icon className="h-4 w-4 text-primary" />
              <div className="flex-1 text-sm">{msg}</div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}