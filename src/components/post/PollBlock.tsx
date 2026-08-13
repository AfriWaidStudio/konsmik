import { useState } from "react";
import { castVote, clearMyVotes, type PollData } from "@/lib/polls";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Check, BarChart3 } from "lucide-react";

export function PollBlock({ poll, onChange }: { poll: PollData; onChange?: () => void }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [optimistic, setOptimistic] = useState<string[] | null>(null);
  const closed = poll.closes_at ? new Date(poll.closes_at) < new Date() : false;
  const myVotes = optimistic ?? poll.my_votes;
  const hasVoted = myVotes.length > 0;
  const showResults = hasVoted || closed;
  const total = Math.max(1, poll.total_votes);

  const toggle = async (optionId: string) => {
    if (!user) return toast.error("Sign in to vote");
    if (closed) return;
    if (busy) return;
    let next: string[];
    if (poll.multi_select) {
      next = myVotes.includes(optionId) ? myVotes.filter((x) => x !== optionId) : [...myVotes, optionId];
    } else {
      next = [optionId];
    }
    setOptimistic(next);
    setBusy(true);
    try {
      if (next.length === 0) await clearMyVotes(poll.id, user.id);
      else await castVote(poll.id, user.id, next, poll.multi_select);
      onChange?.();
    } catch (e: any) {
      setOptimistic(null);
      toast.error(e.message ?? "Vote failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-border/60 bg-card/60 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <BarChart3 className="h-4 w-4 text-primary" /> {poll.question}
      </div>
      <div className="mt-3 space-y-2">
        {poll.options.map((opt) => {
          const mine = myVotes.includes(opt.id);
          const pct = Math.round((opt.votes / total) * 100);
          return (
            <button
              key={opt.id}
              onClick={() => toggle(opt.id)}
              disabled={busy || closed}
              className={cn(
                "relative w-full overflow-hidden rounded-lg border border-border/60 bg-background px-3 py-2 text-left text-sm transition",
                mine && "border-primary/60",
                !closed && "hover:border-primary/40",
              )}
            >
              {showResults && (
                <div
                  className={cn("absolute inset-y-0 left-0 -z-0", mine ? "bg-primary/20" : "bg-muted/40")}
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="relative z-10 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  {mine && <Check className="h-3.5 w-3.5 text-primary" />}
                  {opt.label}
                </span>
                {showResults && <span className="text-xs text-muted-foreground">{pct}% · {opt.votes}</span>}
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{poll.total_votes} vote{poll.total_votes === 1 ? "" : "s"}{poll.multi_select && " · multi"}</span>
        {poll.closes_at && (
          <span>{closed ? "Closed" : `Closes ${new Date(poll.closes_at).toLocaleDateString()}`}</span>
        )}
      </div>
    </div>
  );
}