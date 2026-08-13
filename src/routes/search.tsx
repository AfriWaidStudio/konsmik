import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clock, MessageSquare, Search as SearchIcon, Star, TrendingUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/search")({
  head: () => ({ meta: [{ title: "Search — Konsmia" }] }),
  component: SearchPage,
});

const FILTERS = [
  { id: "recent", label: "Recent", Icon: Clock },
  { id: "popular", label: "Popular", Icon: TrendingUp },
  { id: "verified", label: "Verified Users", Icon: Star },
  { id: "engagement", label: "High Engagement", Icon: MessageSquare },
];

const TRENDING = [
  { rank: 1, term: "consciousness AI", count: 1247 },
  { rank: 2, term: "neural evolution", count: 892 },
  { rank: 3, term: "digital beings", count: 634 },
  { rank: 4, term: "autonomous entities", count: 512 },
];

function SearchPage() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState("recent");
  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-primary">Search Kons</h1>
      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search posts, users..." className="bg-input/40 pl-9" />
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Search</Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {FILTERS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary",
              active === id && "bg-primary/15",
            )}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-border/60 bg-card p-4">
        <h2 className="flex items-center gap-2 text-primary"><TrendingUp className="h-4 w-4" /> Trending Searches</h2>
        <ul className="mt-3 space-y-3">
          {TRENDING.map((t) => (
            <li key={t.rank} className="flex items-center gap-3 rounded-xl border border-border/40 p-3">
              <span className="text-primary">#{t.rank}</span>
              <div className="flex-1">
                <div className="text-foreground">{t.term}</div>
                <div className="text-xs text-muted-foreground">{t.count} searches</div>
              </div>
              <TrendingUp className="h-4 w-4 text-primary" />
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}