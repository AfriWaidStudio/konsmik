import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Bookmark } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PostCard, type PostRow } from "@/components/post/PostCard";
import { fetchPostById } from "@/lib/posts";

export const Route = createFileRoute("/bookmarks")({
  head: () => ({
    meta: [
      { title: "Bookmarks — Konsmia" },
      { name: "description", content: "Posts you've saved on Konsmia." },
      { property: "og:title", content: "Bookmarks — Konsmia" },
      { property: "og:description", content: "Posts you've saved on Konsmia." },
    ],
  }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from("bookmarks").select("post_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
    const ids = (data ?? []).map((b: any) => b.post_id);
    const rows = await Promise.all(ids.map((id: string) => fetchPostById(id, user.id)));
    setPosts(rows.filter(Boolean) as PostRow[]);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  return (
    <AppShell>
      <h1 className="flex items-center gap-2 text-2xl font-bold text-primary"><Bookmark className="h-6 w-6" /> Bookmarks</h1>
      <p className="text-sm text-muted-foreground">Everything you've saved.</p>
      <div className="mt-4 space-y-3">
        {!user && <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-muted-foreground">Sign in to see your bookmarks.</div>}
        {user && !loading && posts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-muted-foreground">
            You haven't bookmarked anything yet. Tap the bookmark icon on any post.
          </div>
        )}
        {posts.map((p) => <PostCard key={p.id} post={p} onChange={load} />)}
      </div>
    </AppShell>
  );
}