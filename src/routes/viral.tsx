import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Tv, Heart, MessageCircle, Star, Film, Sparkles, Play } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/viral")({
  head: () => ({
    meta: [
      { title: "Viral — Reels & TV on Konsmia" },
      { name: "description", content: "Short reels and Konsmik Studio movies from the Konsmia universe." },
      { property: "og:title", content: "Viral — Reels & TV on Konsmia" },
      { property: "og:description", content: "Short reels and Konsmik Studio movies from the Konsmia universe." },
    ],
  }),
  component: ViralPage,
});

type Reel = {
  id: string; body: string; media_url: string | null; views: number; tokens: number;
  author: { username: string; display_name: string } | null;
  likes_count: number; comments_count: number;
};

type Show = {
  id: string; slug: string; title: string; studio: string;
  cover_url: string | null; description: string | null; category: string | null;
};

function ViralPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [shows, setShows] = useState<Show[]>([]);

  useEffect(() => {
    (async () => {
      const { data: posts } = await supabase
        .from("posts")
        .select("id, body, media_url, views, tokens, author_id")
        .eq("type", "reel")
        .order("created_at", { ascending: false })
        .limit(30);
      const ids = (posts ?? []).map((p: any) => p.id);
      const aids = Array.from(new Set((posts ?? []).map((p: any) => p.author_id)));
      const [{ data: profs }, { data: likes }, { data: comments }] = await Promise.all([
        aids.length ? supabase.from("profiles").select("id, username, display_name").in("id", aids) : Promise.resolve({ data: [] as any[] }),
        ids.length ? supabase.from("likes").select("post_id").in("post_id", ids) : Promise.resolve({ data: [] as any[] }),
        ids.length ? supabase.from("comments").select("post_id").in("post_id", ids) : Promise.resolve({ data: [] as any[] }),
      ]);
      const pmap = new Map((profs ?? []).map((p: any) => [p.id, p]));
      const lc = new Map<string, number>(); (likes ?? []).forEach((l: any) => lc.set(l.post_id, (lc.get(l.post_id) ?? 0) + 1));
      const cc = new Map<string, number>(); (comments ?? []).forEach((c: any) => cc.set(c.post_id, (cc.get(c.post_id) ?? 0) + 1));
      setReels((posts ?? []).map((p: any) => ({
        id: p.id, body: p.body, media_url: p.media_url, views: p.views, tokens: p.tokens,
        author: pmap.get(p.author_id) ?? null,
        likes_count: lc.get(p.id) ?? 0, comments_count: cc.get(p.id) ?? 0,
      })));

      const { data: tv } = await supabase
        .from("tv_shows")
        .select("id, slug, title, studio, cover_url, description, category")
        .order("created_at", { ascending: false });
      setShows((tv as Show[]) ?? []);
    })();
  }, []);

  return (
    <AppShell>
      <h1 className="flex items-center gap-2 text-2xl font-bold text-primary">
        <Sparkles className="h-6 w-6" /> Viral
      </h1>
      <p className="text-sm text-muted-foreground">Reels and Konsmik Studio movies</p>

      <Tabs defaultValue="reels" className="mt-4">
        <TabsList className="grid w-full grid-cols-2 bg-card">
          <TabsTrigger value="reels" className="gap-1"><Sparkles className="h-4 w-4" /> Reels</TabsTrigger>
          <TabsTrigger value="tv" className="gap-1"><Tv className="h-4 w-4" /> TV</TabsTrigger>
        </TabsList>

        <TabsContent value="reels" className="mt-4">
          {reels.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
              No reels yet — be the first. Tap +, choose Reel.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {reels.map((r) => (
                <Link
                  key={r.id}
                  to="/post/$id"
                  params={{ id: r.id }}
                  className="group relative flex aspect-[9/16] flex-col justify-end overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/30 via-accent/20 to-background"
                >
                  {r.media_url && (r.media_url.endsWith(".mp4") || r.media_url.includes("video")) ? (
                    <video src={r.media_url} muted playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover opacity-80" />
                  ) : r.media_url ? (
                    <img src={r.media_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
                  ) : null}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
                  <div className="relative z-10 p-3">
                    <div className="line-clamp-2 text-sm font-semibold text-foreground">{r.body || "Untitled reel"}</div>
                    <div className="text-xs text-muted-foreground">@{r.author?.username ?? "user"}</div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-foreground/80">
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {r.likes_count}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {r.comments_count}</span>
                      <span className="flex items-center gap-1 text-primary"><Star className="h-3 w-3" /> {r.tokens}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tv" className="mt-4 space-y-3">
          {shows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card p-8 text-center">
              <Film className="mx-auto h-10 w-10 text-primary" />
              <div className="mt-3 text-lg font-semibold">Konsmik Studio</div>
              <p className="mt-1 text-sm text-muted-foreground">Premium movies and shows are being uploaded. Check back soon.</p>
            </div>
          ) : (
            shows.map((s) => (
              <Link
                key={s.id}
                to="/viral"
                className="group relative flex h-40 overflow-hidden rounded-2xl border border-border/60 bg-card"
              >
                {s.cover_url && <img src={s.cover_url} alt={s.title} className="absolute inset-0 h-full w-full object-cover opacity-70" />}
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
                <div className="relative z-10 flex flex-col justify-end p-4">
                  <div className="text-[10px] uppercase tracking-wider text-accent">{s.studio}</div>
                  <div className="text-lg font-bold text-foreground">{s.title}</div>
                  <div className="line-clamp-2 max-w-md text-xs text-muted-foreground">{s.description}</div>
                  <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    <Play className="h-3 w-3" /> Watch
                  </span>
                </div>
              </Link>
            ))
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
