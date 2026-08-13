import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PostCard, type PostRow } from "@/components/post/PostCard";
import { fetchPostById } from "@/lib/posts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Reply, Smile } from "lucide-react";

export const Route = createFileRoute("/post/$id")({
  head: () => ({ meta: [{ title: "Post — Konsmia" }] }),
  component: Page,
});

type CommentRow = {
  id: string;
  body: string;
  created_at: string;
  parent_id: string | null;
  user_id: string;
  user: { username: string; display_name: string; avatar_url: string | null } | null;
  reactions: { emoji: string; user_id: string }[];
};

const EMOJIS = ["👍", "❤️", "😂", "🔥", "🙏"];

function Page() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [post, setPost] = useState<PostRow | null>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<CommentRow | null>(null);

  const load = async () => {
    const p = await fetchPostById(id, user?.id);
    setPost(p);
    const { data: c } = await supabase
      .from("comments")
      .select("id, body, created_at, parent_id, user_id")
      .eq("post_id", id)
      .order("created_at", { ascending: true });
    const rows = (c ?? []) as any[];
    const uids = Array.from(new Set(rows.map((r) => r.user_id)));
    const cids = rows.map((r) => r.id);
    const [{ data: profiles }, { data: reactions }] = await Promise.all([
      uids.length
        ? supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", uids)
        : Promise.resolve({ data: [] as any[] }),
      cids.length
        ? supabase.from("comment_reactions").select("comment_id, emoji, user_id").in("comment_id", cids)
        : Promise.resolve({ data: [] as any[] }),
    ]);
    const pmap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const rmap = new Map<string, { emoji: string; user_id: string }[]>();
    (reactions ?? []).forEach((r: any) => {
      const arr = rmap.get(r.comment_id) ?? [];
      arr.push({ emoji: r.emoji, user_id: r.user_id });
      rmap.set(r.comment_id, arr);
    });
    setComments(
      rows.map((r) => ({
        id: r.id,
        body: r.body,
        created_at: r.created_at,
        parent_id: r.parent_id,
        user_id: r.user_id,
        user: pmap.get(r.user_id) ?? null,
        reactions: rmap.get(r.id) ?? [],
      })),
    );
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  const tree = useMemo(() => {
    const byParent = new Map<string | null, CommentRow[]>();
    comments.forEach((c) => {
      const arr = byParent.get(c.parent_id) ?? [];
      arr.push(c);
      byParent.set(c.parent_id, arr);
    });
    return byParent;
  }, [comments]);

  const submit = async () => {
    if (!user) return toast.error("Sign in to comment");
    if (!body.trim()) return;
    const { error } = await supabase
      .from("comments")
      .insert({ post_id: id, user_id: user.id, body: body.trim(), parent_id: replyTo?.id ?? null });
    if (error) return toast.error(error.message);
    setBody("");
    setReplyTo(null);
    load();
  };

  const toggleReact = async (commentId: string, emoji: string) => {
    if (!user) return toast.error("Sign in to react");
    const c = comments.find((x) => x.id === commentId);
    const mine = c?.reactions.find((r) => r.user_id === user.id && r.emoji === emoji);
    if (mine) {
      await supabase.from("comment_reactions").delete().eq("comment_id", commentId).eq("user_id", user.id).eq("emoji", emoji);
    } else {
      await supabase.from("comment_reactions").delete().eq("comment_id", commentId).eq("user_id", user.id);
      await supabase.from("comment_reactions").insert({ comment_id: commentId, user_id: user.id, emoji });
    }
    load();
  };

  const renderThread = (parent: string | null, depth: number) => {
    const items = tree.get(parent) ?? [];
    return items.map((c) => <CommentNode key={c.id} c={c} depth={depth} onReply={setReplyTo} onReact={toggleReact} children={renderThread(c.id, depth + 1)} />);
  };

  return (
    <AppShell>
      <Link to="/" className="text-sm text-primary">← Back</Link>
      <div className="mt-3">{post ? <PostCard post={post} onChange={load} /> : <div className="text-muted-foreground">Loading…</div>}</div>

      <h2 className="mt-6 text-sm font-semibold text-foreground/80">Comments ({comments.length})</h2>
      <div className="mt-3 space-y-3">{renderThread(null, 0)}</div>

      <div className="sticky bottom-16 mt-4 space-y-2 rounded-2xl border border-border/60 bg-card p-3">
        {replyTo && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Replying to <span className="text-primary">@{replyTo.user?.username}</span></span>
            <button onClick={() => setReplyTo(null)} className="text-primary">Cancel</button>
          </div>
        )}
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add a comment..." rows={3} className="bg-input/40" />
        <Button onClick={submit} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Post comment</Button>
      </div>
    </AppShell>
  );
}

function CommentNode({
  c, depth, onReply, onReact, children,
}: {
  c: CommentRow;
  depth: number;
  onReply: (c: CommentRow) => void;
  onReact: (id: string, emoji: string) => void;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [pickerOpen, setPickerOpen] = useState(false);
  const initials = (c.user?.display_name ?? "U").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const grouped = c.reactions.reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
    return acc;
  }, {});
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border border-border/60 bg-card p-3", depth > 0 && "ml-6 border-l-2 border-l-primary/30")}>
      <Link to="/profile/$username" params={{ username: c.user?.username ?? "" }}>
        <Avatar className="h-8 w-8 bg-primary/20">
          {c.user?.avatar_url && <AvatarImage src={c.user.avatar_url} />}
          <AvatarFallback className="bg-primary/20 text-primary">{initials}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1">
        <div className="text-sm font-semibold">{c.user?.display_name}</div>
        <div className="text-sm text-foreground/80 whitespace-pre-wrap">{c.body}</div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {Object.entries(grouped).map(([emoji, n]) => {
            const mine = !!user && c.reactions.some((r) => r.emoji === emoji && r.user_id === user.id);
            return (
              <button
                key={emoji}
                onClick={() => onReact(c.id, emoji)}
                className={cn("rounded-full border px-2 py-0.5", mine ? "border-primary/60 bg-primary/10 text-primary" : "border-border")}
              >
                {emoji} {n}
              </button>
            );
          })}
          <div className="relative">
            <button onClick={() => setPickerOpen((v) => !v)} className="flex items-center gap-1 hover:text-primary"><Smile className="h-3 w-3" /> React</button>
            {pickerOpen && (
              <div className="absolute bottom-6 left-0 z-10 flex gap-1 rounded-full border border-border bg-card p-1 shadow-lg">
                {EMOJIS.map((e) => (
                  <button key={e} onClick={() => { onReact(c.id, e); setPickerOpen(false); }} className="rounded-full px-1 text-lg hover:scale-125 transition">{e}</button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => onReply(c)} className="flex items-center gap-1 hover:text-primary"><Reply className="h-3 w-3" /> Reply</button>
        </div>
        {children && <div className="mt-2 space-y-2">{children}</div>}
      </div>
    </div>
  );
}