import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/konsai-chat`;

export function KonsaiSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi, I'm **Konsai** — your guide to the Konsmia universe. Ask me anything about the Tribe of the Future." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setBusy(true);
    let acc = "";
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next }),
      });
      if (!resp.ok || !resp.body) throw new Error("stream failed");
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let done = false;
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      while (!done) {
        const r = await reader.read();
        if (r.done) break;
        buf += dec.decode(r.value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const j = line.slice(6).trim();
          if (j === "[DONE]") {
            done = true;
            break;
          }
          try {
            const p = JSON.parse(j);
            const c = p.choices?.[0]?.delta?.content;
            if (c) {
              acc += c;
              setMessages((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, content: acc } : x)));
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I couldn't reach the network. Try again in a moment." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] border-primary/30 bg-background p-0">
        <SheetHeader className="border-b border-border/60 px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-primary">
            <Brain className="h-5 w-5" /> Konsai
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
              <Sparkles className="h-3 w-3" /> AI
            </span>
          </SheetTitle>
        </SheetHeader>
        <div ref={scrollRef} className="flex h-[calc(100%-130px)] flex-col gap-3 overflow-y-auto px-4 py-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                m.role === "user" ? "ml-auto bg-primary/15 text-foreground" : "bg-card text-foreground border border-border/60",
              )}
            >
              <div className="prose prose-invert prose-sm max-w-none [&>p]:my-1">
                <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-border/60 bg-background px-3 py-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask Konsai anything…"
            className="bg-input/50"
          />
          <Button onClick={send} disabled={busy} size="icon" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}