import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { markThreadRead } from "@/lib/dm";
import { uploadToMedia } from "@/lib/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ImagePlus, CornerUpLeft, X, Check, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const EMOJIS = ["❤️", "🔥", "😂", "👏", "😮", "🙏"];

export const Route = createFileRoute("/messages/$id")({
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<any[]>([]);
  const [reactions, setReactions] = useState<any[]>([]);
  const [people, setPeople] = useState<Record<string, any>>({});
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [typing, setTyping] = useState<string | null>(null);
  const [otherLastRead, setOtherLastRead] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [body, setBody] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const chanRef = useRef<any>(null);

  const load = async () => {
    const { data } = await supabase.from("dm_messages").select("*").eq("thread_id", id).order("created_at", { ascending: true });
    setMsgs(data ?? []);
    const ids = (data ?? []).map((m: any) => m.id);
    if (ids.length) {
      const { data: rx } = await supabase.from("dm_reactions").select("*").in("message_id", ids);
      setReactions(rx ?? []);
    }
    const { data: mem } = await supabase.from("dm_members").select("user_id").eq("thread_id", id);
    const uids = (mem ?? []).map((m: any) => m.user_id);
    if (uids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", uids);
      setPeople(Object.fromEntries((profs ?? []).map((p: any) => [p.id, p])));
    }
    if (user) {
      const { data: reads } = await supabase.from("dm_reads").select("user_id, last_read_at").eq("thread_id", id).neq("user_id", user.id);
      setOtherLastRead((reads ?? [])[0]?.last_read_at ?? null);
    }
    setTimeout(() => ref.current?.scrollTo({ top: ref.current.scrollHeight }), 50);
    if (user) markThreadRead(id, user.id).catch(() => {});
  };
  useEffect(() => {
    load();
    const ch = supabase
      .channel(`dm-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "dm_messages", filter: `thread_id=eq.${id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "dm_reactions" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "dm_reads", filter: `thread_id=eq.${id}` }, () => load())
      .on("broadcast", { event: "typing" }, ({ payload }: any) => {
        if (payload?.userId && payload.userId !== user?.id) {
          setTyping(payload.name ?? "Someone");
          setTimeout(() => setTyping(null), 2500);
        }
      })
      .subscribe();
    chanRef.current = ch;
    return () => { supabase.removeChannel(ch); chanRef.current = null; };
  }, [id, user?.id]);

  const other = useMemo(() => Object.values(people).find((p: any) => p.id !== user?.id) as any, [people, user?.id]);

  const notifyTyping = () => {
    chanRef.current?.send({ type: "broadcast", event: "typing", payload: { userId: user?.id, name: people[user?.id ?? ""]?.display_name } });
  };

  const send = async (override?: string) => {
    if (!user || !body.trim()) return;
    await supabase.from("dm_messages").insert({ thread_id: id, sender_id: user.id, body: (override ?? body).trim(), reply_to: replyTo?.id ?? null });
    await supabase.from("dm_threads").update({ last_message_at: new Date().toISOString() }).eq("id", id);
    setBody("");
    setReplyTo(null);
  };

  const sendMedia = async (file?: File | null) => {
    if (!file || !user) return;
    setUploading(true);
    try {
      const url = await uploadToMedia(file, user.id, "dm");
      await supabase.from("dm_messages").insert({ thread_id: id, sender_id: user.id, body: url, reply_to: replyTo?.id ?? null });
      await supabase.from("dm_threads").update({ last_message_at: new Date().toISOString() }).eq("id", id);
      setReplyTo(null);
    } catch (e: any) { toast.error(e.message ?? "Upload failed"); }
    setUploading(false);
  };

  const react = async (messageId: string, emoji: string) => {
    if (!user) return;
    const existing = reactions.find((r) => r.message_id === messageId && r.user_id === user.id && r.emoji === emoji);
    if (existing) await supabase.from("dm_reactions").delete().eq("id", existing.id);
    else await supabase.from("dm_reactions").insert({ message_id: messageId, user_id: user.id, emoji });
    load();
  };

  return (
    <AppShell>
      <div className="flex items-center gap-3 border-b border-border/60 pb-3">
        <Link to="/messages" className="text-sm text-primary">←</Link>
        {other?.avatar_url ? (
          <img src={other.avatar_url} alt={other.display_name} className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">{(other?.display_name ?? "?").slice(0, 1).toUpperCase()}</div>
        )}
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{other?.display_name ?? "Conversation"}</div>
          <div className="h-4 text-xs text-primary">{typing ? `${typing} is typing…` : other ? `@${other.username}` : ""}</div>
        </div>
      </div>

      <div ref={ref} className="mt-3 max-h-[58vh] space-y-2 overflow-y-auto pr-1">
        {msgs.map((m) => {
          const mine = m.sender_id === user?.id;
          const parent = m.reply_to ? msgs.find((x) => x.id === m.reply_to) : null;
          const rx = reactions.filter((r) => r.message_id === m.id);
          const isMedia = /^https?:\/\/.+\.(png|jpe?g|gif|webp|mp4|webm)(\?|$)/i.test(m.body ?? "");
          const seen = mine && otherLastRead && new Date(m.created_at) <= new Date(otherLastRead);
          return (
            <div key={m.id} className={cn("group max-w-[82%]", mine && "ml-auto")}>
              <div className={cn("rounded-2xl px-3 py-2 text-sm", mine ? "bg-primary/15" : "border border-border/60 bg-card")}>
                {parent && (
                  <div className="mb-1 truncate border-l-2 border-primary/50 pl-2 text-xs text-muted-foreground">{parent.body}</div>
                )}
                {isMedia ? (
                  /\.(mp4|webm)(\?|$)/i.test(m.body) ? (
                    <video src={m.body} controls className="max-h-64 rounded-lg" />
                  ) : (
                    <img src={m.body} alt="Shared media" className="max-h-64 rounded-lg object-cover" />
                  )
                ) : (
                  <span className="whitespace-pre-wrap break-words">{m.body}</span>
                )}
              </div>
              <div className={cn("mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground", mine && "justify-end")}>
                <span>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                {mine && (seen ? <CheckCheck className="h-3 w-3 text-primary" /> : <Check className="h-3 w-3" />)}
                <button className="opacity-0 transition group-hover:opacity-100" onClick={() => setReplyTo(m)} aria-label="Reply">
                  <CornerUpLeft className="h-3 w-3" />
                </button>
                <div className="flex gap-0.5 opacity-0 transition group-hover:opacity-100">
                  {EMOJIS.map((e) => (
                    <button key={e} onClick={() => react(m.id, e)} aria-label={`React ${e}`}>{e}</button>
                  ))}
                </div>
              </div>
              {rx.length > 0 && (
                <div className={cn("mt-0.5 flex flex-wrap gap-1", mine && "justify-end")}>
                  {Object.entries(rx.reduce((acc: Record<string, number>, r) => ({ ...acc, [r.emoji]: (acc[r.emoji] ?? 0) + 1 }), {} as Record<string, number>)).map(([e, n]) => (
                    <button key={e} onClick={() => react(m.id, e)} className="rounded-full border border-border/60 bg-card px-1.5 text-[10px]">{e} {Number(n)}</button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {replyTo && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2 text-xs">
          <CornerUpLeft className="h-3 w-3 text-primary" />
          <span className="min-w-0 flex-1 truncate text-muted-foreground">{replyTo.body}</span>
          <button onClick={() => setReplyTo(null)} aria-label="Cancel reply"><X className="h-3 w-3" /></button>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <Button variant="outline" size="icon" onClick={() => fileRef.current?.click()} disabled={uploading} aria-label="Send media">
          <ImagePlus className="h-4 w-4" />
        </Button>
        <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={(e) => sendMedia(e.target.files?.[0])} />
        <Input
          value={body}
          onChange={(e) => { setBody(e.target.value); notifyTyping(); }}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Message…"
          className="bg-input/40"
        />
        <Button onClick={() => send()} className="bg-primary text-primary-foreground"><Send className="h-4 w-4" /></Button>
      </div>
    </AppShell>
  );
}
