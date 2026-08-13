import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PostCard, type PostRow } from "@/components/post/PostCard";
import { fetchPosts, fetchTrendingPosts, fetchFollowingPosts } from "@/lib/posts";
import { fetchMutedIds } from "@/lib/social";
import { useAuth } from "@/lib/auth-context";
import { Activity, Flame, Target, Hash, Filter, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDraft } from "@/lib/drafts";
import { ImagePlus, Film, BarChart3, X } from "lucide-react";
import { uploadToMedia } from "@/lib/upload";
import { createPost } from "@/lib/posts";
import { Input } from "@/components/ui/input";
import { StoriesRail } from "@/components/stories/StoriesRail";
import { WhoToFollow } from "@/components/social/WhoToFollow";

export const Route = createFileRoute("/")({
  component: Index,
});

const TABS = [
  { id: "feed", label: "For you", Icon: Activity },
  { id: "following", label: "Following", Icon: Target },
  { id: "trending", label: "Trending", Icon: Flame },
  { id: "topics", label: "Topics", Icon: Hash },
] as const;

function Composer({ onPosted }: { onPosted: () => void }) {
  const { user, profile } = useAuth();
  const { body, setBody, clear } = useDraft(user?.id, "post");
  const [busy, setBusy] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [pollQ, setPollQ] = useState("");
  const [pollOpts, setPollOpts] = useState<string[]>(["", ""]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    setUploading(true);
    try {
      const url = await uploadToMedia(file, user.id, "posts");
      setMediaUrl(url);
      setMediaType(file.type.startsWith("video") ? "video" : "image");
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const setOpt = (i: number, v: string) => setPollOpts((prev) => prev.map((o, idx) => (idx === i ? v : o)));
  const addOpt = () => setPollOpts((prev) => (prev.length >= 6 ? prev : [...prev, ""]));
  const removeOpt = (i: number) => setPollOpts((prev) => (prev.length <= 2 ? prev : prev.filter((_, idx) => idx !== i)));

  const submit = async () => {
    if (!user) {
      toast.error("Sign in to post");
      return;
    }
    if (!body.trim() && !mediaUrl && !showPoll) return;
    setBusy(true);
    try {
      const poll = showPoll && pollQ.trim() && pollOpts.filter((o) => o.trim()).length >= 2
        ? { question: pollQ, options: pollOpts.filter((o) => o.trim()), multi_select: false, closes_at: null }
        : null;
      await createPost({
        author_id: user.id,
        body: body.trim(),
        type: mediaType === "video" ? "reel" : mediaType === "image" ? "image" : "discussion",
        media_url: mediaUrl,
        poll,
      });
      await clear();
      setMediaUrl(null);
      setMediaType(null);
      setShowPoll(false);
      setPollQ("");
      setPollOpts(["", ""]);
      toast.success("Posted!");
      onPosted();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to post");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="text-center text-sm font-semibold text-foreground/70">{profile?.display_name ?? "You"}</div>
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share your thoughts, ideas, or discoveries with the Kons community..."
        rows={4}
        className="mt-3 bg-background"
      />

      {mediaUrl && (
        <div className="relative mt-3 overflow-hidden rounded-xl border border-border/60">
          {mediaType === "video" ? (
            <video src={mediaUrl} controls className="max-h-72 w-full bg-black" />
          ) : (
            <img src={mediaUrl} alt="" className="max-h-72 w-full object-cover" />
          )}
          <button onClick={() => { setMediaUrl(null); setMediaType(null); }} className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {showPoll && (
        <div className="mt-3 space-y-2 rounded-xl border border-border/60 bg-background p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground/80">Poll</span>
            <button onClick={() => setShowPoll(false)} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
          </div>
          <Input value={pollQ} onChange={(e) => setPollQ(e.target.value)} placeholder="Ask a question..." />
          {pollOpts.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={o} onChange={(e) => setOpt(i, e.target.value)} placeholder={`Option ${i + 1}`} />
              {pollOpts.length > 2 && (
                <button onClick={() => removeOpt(i)} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
              )}
            </div>
          ))}
          {pollOpts.length < 6 && <button onClick={addOpt} className="text-xs text-primary">+ Add option</button>}
        </div>
      )}

      <div className="mt-3 flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-primary">
          <ImagePlus className="h-4 w-4" /> Photo
          <input type="file" accept="image/*" hidden onChange={onFile} disabled={uploading} />
        </label>
        <label className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-primary">
          <Film className="h-4 w-4" /> Video
          <input type="file" accept="video/*" hidden onChange={onFile} disabled={uploading} />
        </label>
        <button onClick={() => setShowPoll((v) => !v)} className={cn("flex items-center gap-1 text-xs", showPoll ? "text-primary" : "text-muted-foreground hover:text-primary")}>
          <BarChart3 className="h-4 w-4" /> Poll
        </button>
        {uploading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3 w-3 text-accent" /> Posts earn tokens based on community engagement
      </div>
      <Button onClick={submit} disabled={busy || (!body.trim() && !mediaUrl && !showPoll)} className="mt-3 w-full bg-primary/20 text-primary hover:bg-primary/30">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>+ Share Post</>}
      </Button>
      {!user && (
        <Link to="/login" className="mt-2 block text-center text-xs text-primary underline">
          Sign in to share
        </Link>
      )}
    </div>
  );
}

function Index() {
  const { user } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("feed");
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const rows = tab === "trending"
        ? await fetchTrendingPosts(user?.id)
        : tab === "following" && user
          ? await fetchFollowingPosts(user.id)
          : await fetchPosts("kons", user?.id);
      const muted = user ? await fetchMutedIds(user.id) : new Set<string>();
      setPosts((rows as PostRow[]).filter((p) => !muted.has(p.author_id ?? "")));
    } catch (e: any) {
      toast.error(e.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("posts-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "reactions" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, tab]);

  const visible = posts;

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition",
                tab === id ? "bg-primary text-primary-foreground" : "text-foreground/70",
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
          <button className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60">
            <Filter className="h-4 w-4" />
          </button>
        </div>

        <Composer onPosted={load} />
        <StoriesRail />
        <WhoToFollow />

        {loading ? (
          <div className="flex justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-muted-foreground">
            No posts yet. Be the first to share!
          </div>
        ) : (
          visible.map((p) => <PostCard key={p.id} post={p} onChange={load} />)
        )}
      </div>
    </AppShell>
  );
}
