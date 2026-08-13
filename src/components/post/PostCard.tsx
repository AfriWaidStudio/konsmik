import { Link, useNavigate } from "@tanstack/react-router";
import { MessageCircle, Share2, Eye, Clock, Flame, Star, Bookmark, Flag, Pin, Pencil, MoreHorizontal, Repeat2, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ReactionPicker } from "./ReactionPicker";
import { setMyReaction, type ReactionKind } from "@/lib/reactions";
import { PostMedia } from "./PostMedia";
import { PollBlock } from "./PollBlock";
import type { PollData } from "@/lib/polls";
import { findOrCreateDirectThread, searchUsersByUsername } from "@/lib/dm";
import { AddToCollectionDialog } from "./AddToCollectionDialog";
import { FolderPlus } from "lucide-react";
import { useViewTracker } from "@/hooks/use-view-tracker";

export type PostRow = {
  id: string;
  body: string;
  category: string | null;
  hashtags: string[];
  trending: boolean;
  views: number;
  tokens: number;
  created_at: string;
  type: string;
  author_id?: string;
  pinned?: boolean;
  edited_at?: string | null;
  author: { username: string; display_name: string; title: string | null; avatar_url: string | null } | null;
  space_id?: string | null;
  space?: { id: string; slug: string; name: string; kind: "group" | "page" | "circle"; avatar_url: string | null; theme_color?: string | null; verified?: boolean } | null;
  likes_count: number;
  comments_count: number;
  liked_by_me: boolean;
  reactions_total?: number;
  my_reaction?: ReactionKind | null;
  media_url?: string | null;
  poll?: PollData | null;
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function renderBody(body: string) {
  // Linkify @mentions and #hashtags inline
  const parts = body.split(/(\s+)/);
  return parts.map((p, i) => {
    if (/^@[a-z0-9_]{2,30}$/i.test(p)) {
      const u = p.slice(1);
      return <Link key={i} to="/profile/$username" params={{ username: u }} className="text-accent">@{u}</Link>;
    }
    if (/^#[a-z0-9_]{2,40}$/i.test(p)) {
      const t = p.slice(1);
      return <Link key={i} to="/tag/$tag" params={{ tag: t }} className="text-primary">#{t}</Link>;
    }
    return <span key={i}>{p}</span>;
  });
}

export function PostCard({ post, onChange }: { post: PostRow; onChange?: () => void }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [bookmarked, setBookmarked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareQuery, setShareQuery] = useState("");
  const [shareResults, setShareResults] = useState<{ id: string; username: string; display_name: string }[]>([]);
  const [collectOpen, setCollectOpen] = useState(false);
  const [mine, setMine] = useState<ReactionKind | null>(post.my_reaction ?? null);
  const [total, setTotal] = useState<number>(post.reactions_total ?? post.likes_count);
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(post.body);
  const { ref: viewRef, views } = useViewTracker(post.id, post.views);

  useEffect(() => {
    setMine(post.my_reaction ?? null);
    setTotal(post.reactions_total ?? post.likes_count);
    setBody(post.body);
  }, [post.my_reaction, post.reactions_total, post.likes_count, post.body]);

  useEffect(() => {
    if (!user) return;
    supabase.from("bookmarks").select("id").eq("user_id", user.id).eq("post_id", post.id).maybeSingle().then(({ data }) => setBookmarked(!!data));
  }, [user, post.id]);

  useEffect(() => {
    supabase.from("reposts").select("user_id", { count: "exact" }).eq("post_id", post.id).then(({ data, count }) => {
      setRepostCount(count ?? 0);
      if (user) setReposted(!!(data ?? []).find((r: any) => r.user_id === user.id));
    });
  }, [user, post.id]);

  useEffect(() => {
    if (!shareOpen || !shareQuery.trim()) { setShareResults([]); return; }
    const t = setTimeout(async () => {
      const rs = await searchUsersByUsername(shareQuery, user?.id);
      setShareResults(rs as any);
    }, 200);
    return () => clearTimeout(t);
  }, [shareOpen, shareQuery, user?.id]);

  const toggleRepost = async () => {
    if (!user) return toast.error("Sign in to repost");
    if (reposted) {
      setReposted(false); setRepostCount((n) => Math.max(0, n - 1));
      await supabase.from("reposts").delete().eq("post_id", post.id).eq("user_id", user.id);
    } else {
      setReposted(true); setRepostCount((n) => n + 1);
      await supabase.from("reposts").insert({ post_id: post.id, user_id: user.id });
      toast.success("Reposted");
    }
  };

  const shareToDm = async (otherId: string) => {
    if (!user) return;
    try {
      const tid = await findOrCreateDirectThread(user.id, otherId);
      const url = `${window.location.origin}/post/${post.id}`;
      await supabase.from("dm_messages").insert({ thread_id: tid, sender_id: user.id, body: url });
      toast.success("Sent");
      setShareOpen(false); setShareQuery(""); setShareResults([]);
      nav({ to: "/messages/$id", params: { id: tid } });
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  const pickReaction = async (kind: ReactionKind | null) => {
    if (!user) return toast.error("Sign in to react");
    const prev = mine;
    // Optimistic
    setMine(kind);
    setTotal((n) => n + (kind ? (prev ? 0 : 1) : prev ? -1 : 0));
    await setMyReaction(post.id, user.id, kind);
    onChange?.();
  };

  const toggleBookmark = async () => {
    if (!user) return toast.error("Sign in to bookmark");
    if (bookmarked) {
      setBookmarked(false);
      await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("post_id", post.id);
    } else {
      setBookmarked(true);
      await supabase.from("bookmarks").insert({ user_id: user.id, post_id: post.id });
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      if (navigator.share) await navigator.share({ url, title: "Konsmia post" });
      else { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
    } catch {/* ignore */}
  };

  const report = async () => {
    if (!user) return toast.error("Sign in to report");
    const reason = prompt("Reason for report?");
    if (!reason) return;
    const { error } = await supabase.from("reports").insert({ reporter_id: user.id, target_type: "post", target_id: post.id, reason });
    if (error) toast.error(error.message); else toast.success("Reported. Thank you.");
  };

  const isMine = user && post.author_id === user.id;
  const togglePin = async () => {
    if (!isMine) return;
    const { error } = await supabase.from("posts").update({ pinned: !post.pinned }).eq("id", post.id);
    if (error) toast.error(error.message); else { toast.success(post.pinned ? "Unpinned" : "Pinned"); onChange?.(); }
  };
  const saveEdit = async () => {
    const { error } = await supabase.from("posts").update({ body, edited_at: new Date().toISOString() }).eq("id", post.id);
    if (error) return toast.error(error.message);
    setEditing(false); toast.success("Updated"); onChange?.();
  };
  const deletePost = async () => {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); onChange?.(); }
  };

  const initials = (post.author?.display_name ?? "??").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <article ref={viewRef as any} className="rounded-2xl border border-border/60 bg-card p-4">
      {post.pinned && (
        <div className="mb-2 flex items-center gap-1 text-xs text-primary"><Pin className="h-3 w-3" /> Pinned</div>
      )}
      <div className="flex items-start gap-3">
        {post.space ? (
          <Link to="/spaces/$slug" params={{ slug: post.space.slug }}>
            <Avatar className="h-10 w-10 rounded-lg bg-accent/20">
              {post.space.avatar_url && <AvatarImage src={post.space.avatar_url} alt={post.space.name} className="rounded-lg" />}
              <AvatarFallback className="rounded-lg bg-accent/20 text-accent">{post.space.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Link to="/profile/$username" params={{ username: post.author?.username ?? "" }}>
            <Avatar className="h-10 w-10 bg-primary/20"><AvatarFallback className="bg-primary/20 text-primary">{initials}</AvatarFallback></Avatar>
          </Link>
        )}
        <div className="flex-1">
          {post.space ? (
            <>
              <Link to="/spaces/$slug" params={{ slug: post.space.slug }} className="font-semibold text-foreground hover:text-primary">
                {post.space.name}
              </Link>
              <div className="text-[10px] uppercase tracking-wide text-accent">{post.space.kind}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                <span>Posted by</span>
                <Link to="/profile/$username" params={{ username: post.author?.username ?? "" }} className="hover:text-primary">
                  @{post.author?.username ?? "unknown"}
                </Link>
                <span>·</span>
                <Clock className="h-3 w-3" /> {timeAgo(post.created_at)}
                {post.edited_at && <span className="ml-1 italic">· edited</span>}
              </div>
            </>
          ) : (
            <>
              <Link to="/profile/$username" params={{ username: post.author?.username ?? "" }} className="font-semibold text-foreground hover:text-primary">
                {post.author?.display_name ?? "Unknown"}
              </Link>
              {post.author?.title && (
                <div className="mt-1 inline-flex w-fit rounded-full border border-border/60 px-2 py-0.5 text-xs text-foreground/80">{post.author.title}</div>
              )}
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> {timeAgo(post.created_at)}
                {post.edited_at && <span className="ml-1 italic">· edited</span>}
              </div>
            </>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {post.category && <span className="rounded-full bg-accent/20 px-3 py-0.5 text-xs font-semibold text-accent">{post.category}</span>}
            {post.trending && (
              <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 px-2 py-0.5 text-xs font-semibold text-accent">
                <Flame className="h-3 w-3" /> Trending
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isMine && (
            <>
              <button onClick={togglePin} aria-label="Pin" className="text-muted-foreground hover:text-primary"><Pin className={cn("h-4 w-4", post.pinned && "fill-primary text-primary")} /></button>
              <button onClick={() => setEditing(true)} aria-label="Edit" className="text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
              <button onClick={deletePost} aria-label="Delete" className="text-muted-foreground hover:text-destructive"><MoreHorizontal className="h-4 w-4" /></button>
            </>
          )}
          <button onClick={report} aria-label="Report" className="text-muted-foreground hover:text-destructive"><Flag className="h-4 w-4" /></button>
        </div>
      </div>

      {editing ? (
        <div className="mt-3 space-y-2">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="w-full rounded-lg border border-border bg-background p-2 text-sm" />
          <div className="flex gap-2">
            <button onClick={saveEdit} className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Save</button>
            <button onClick={() => { setEditing(false); setBody(post.body); }} className="rounded-md border border-border px-3 py-1 text-xs">Cancel</button>
          </div>
        </div>
      ) : (
        <Link to="/post/$id" params={{ id: post.id }} className="mt-3 block whitespace-pre-wrap text-foreground">
          {renderBody(post.body)}
        </Link>
      )}

      {post.media_url && <PostMedia url={post.media_url} />}
      {post.poll && <PollBlock poll={post.poll} onChange={onChange} />}

      {post.hashtags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {post.hashtags.map((h) => (
            <Link key={h} to="/tag/$tag" params={{ tag: h }} className="rounded-full border border-primary/40 px-2 py-0.5 text-xs text-primary">#{h}</Link>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-5 border-t border-border/60 pt-3 text-sm text-muted-foreground">
        <ReactionPicker mine={mine} total={total} onPick={pickReaction} />
        <Link to="/post/$id" params={{ id: post.id }} className="flex items-center gap-1.5 hover:text-primary">
          <MessageCircle className="h-4 w-4" /> {post.comments_count}
        </Link>
        <button onClick={toggleRepost} className={cn("flex items-center gap-1.5 hover:text-primary", reposted && "text-primary")}>
          <Repeat2 className={cn("h-4 w-4", reposted && "text-primary")} /> {repostCount || ""}
        </button>
        <button onClick={() => setShareOpen((v) => !v)} className="flex items-center gap-1.5 hover:text-primary" aria-label="Send"><Send className="h-4 w-4" /></button>
        <button onClick={share} className="flex items-center gap-1.5 hover:text-primary"><Share2 className="h-4 w-4" /></button>
        <button onClick={toggleBookmark} className={cn("flex items-center gap-1.5 hover:text-primary ml-auto", bookmarked && "text-primary")}>
          <Bookmark className={cn("h-4 w-4", bookmarked && "fill-primary")} />
        </button>
        <button
          onClick={() => { if (!user) return toast.error("Sign in to save"); setCollectOpen(true); }}
          className="flex items-center gap-1.5 hover:text-primary"
          aria-label="Save to collection"
        >
          <FolderPlus className="h-4 w-4" />
        </button>
        <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" /> {views}</span>
      </div>
      {user && collectOpen && (
        <AddToCollectionDialog open={collectOpen} onOpenChange={setCollectOpen} userId={user.id} postId={post.id} />
      )}
      {shareOpen && (
        <div className="mt-3 rounded-xl border border-border/60 bg-background p-3">
          <div className="mb-2 text-xs text-muted-foreground">Send to a user</div>
          <input
            autoFocus
            value={shareQuery}
            onChange={(e) => setShareQuery(e.target.value)}
            placeholder="Search @username"
            className="w-full rounded-md border border-border bg-card px-2 py-1 text-sm"
          />
          <div className="mt-2 max-h-48 space-y-1 overflow-auto">
            {shareResults.map((r) => (
              <button key={r.id} onClick={() => shareToDm(r.id)} className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-card">
                <span>{r.display_name} <span className="text-xs text-muted-foreground">@{r.username}</span></span>
                <span className="text-xs text-primary">Send</span>
              </button>
            ))}
            {shareQuery.trim() && shareResults.length === 0 && <div className="p-2 text-xs text-muted-foreground">No users found.</div>}
          </div>
        </div>
      )}
      <div className="mt-3">
        <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 px-3 py-0.5 text-xs text-primary">
          <Star className="h-3 w-3" /> {post.tokens} tokens
        </span>
      </div>
    </article>
  );
}
