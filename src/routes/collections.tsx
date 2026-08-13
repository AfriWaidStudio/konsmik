import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  createCollection,
  deleteCollection,
  fetchCollectionPostIds,
  fetchMyCollections,
  type Collection,
} from "@/lib/collections";
import { fetchPostById } from "@/lib/posts";
import { PostCard, type PostRow } from "@/components/post/PostCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderPlus, Trash2, ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/collections")({
  head: () => ({
    meta: [
      { title: "Collections — Konsmia" },
      { name: "description", content: "Organize saved posts into collections." },
      { property: "og:title", content: "Collections — Konsmia" },
      { property: "og:description", content: "Organize saved posts into collections." },
    ],
  }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [active, setActive] = useState<Collection | null>(null);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  const loadList = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      setCollections(await fetchMyCollections(user.id));
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async (c: Collection) => {
    if (!user) return;
    setLoading(true);
    const ids = await fetchCollectionPostIds(c.id);
    const rows = await Promise.all(ids.map((id) => fetchPostById(id, user.id)));
    setPosts(rows.filter(Boolean) as PostRow[]);
    setLoading(false);
  };

  useEffect(() => { loadList(); /* eslint-disable-next-line */ }, [user?.id]);
  useEffect(() => { if (active) loadPosts(active); /* eslint-disable-next-line */ }, [active?.id]);

  const create = async () => {
    if (!user || !newName.trim()) return;
    setBusy(true);
    try {
      await createCollection(user.id, newName.trim());
      setNewName("");
      await loadList();
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  };

  const del = async (c: Collection) => {
    if (!confirm(`Delete "${c.name}"? Posts stay saved elsewhere.`)) return;
    try {
      await deleteCollection(c.id);
      if (active?.id === c.id) setActive(null);
      await loadList();
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  };

  if (!user) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-muted-foreground">
          Sign in to view your collections. <Link to="/login" className="text-primary underline">Sign in</Link>
        </div>
      </AppShell>
    );
  }

  if (active) {
    return (
      <AppShell>
        <button onClick={() => setActive(null)} className="mb-3 flex items-center gap-1 text-sm text-primary">
          <ChevronLeft className="h-4 w-4" /> All collections
        </button>
        <h1 className="text-2xl font-bold">{active.name}</h1>
        {active.description && <p className="text-sm text-muted-foreground">{active.description}</p>}
        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-muted-foreground">
              Empty. Add posts from the save menu on any post.
            </div>
          ) : posts.map((p) => <PostCard key={p.id} post={p} onChange={() => loadPosts(active)} />)}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="flex items-center gap-2 text-2xl font-bold text-primary"><FolderPlus className="h-6 w-6" /> Collections</h1>
      <p className="text-sm text-muted-foreground">Group saved posts into themed folders.</p>
      <div className="mt-4 flex gap-2">
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New collection name" onKeyDown={(e) => { if (e.key === "Enter") create(); }} />
        <Button onClick={create} disabled={busy || !newName.trim()}>Create</Button>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {loading ? (
          <div className="col-span-full flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : collections.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-border/60 p-8 text-center text-muted-foreground">
            No collections yet.
          </div>
        ) : collections.map((c) => (
          <div key={c.id} className="group flex items-center justify-between rounded-2xl border border-border/60 bg-card p-4">
            <button onClick={() => setActive(c)} className="flex-1 text-left">
              <div className="font-semibold">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.is_public ? "Public" : "Private"}</div>
            </button>
            <button onClick={() => del(c)} className="text-muted-foreground hover:text-destructive" aria-label="Delete">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}