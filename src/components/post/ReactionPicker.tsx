import { useState } from "react";
import { REACTIONS, type ReactionKind } from "@/lib/reactions";
import { cn } from "@/lib/utils";

export function ReactionPicker({
  mine,
  total,
  onPick,
}: {
  mine: ReactionKind | null;
  total: number;
  onPick: (kind: ReactionKind | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = REACTIONS.find((r) => r.kind === mine);

  let timer: any;
  const show = () => { clearTimeout(timer); setOpen(true); };
  const hide = () => { timer = setTimeout(() => setOpen(false), 150); };

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <button
        onClick={() => onPick(mine ? null : "like")}
        className={cn(
          "flex items-center gap-1.5 transition hover:text-primary",
          active && active.color,
        )}
      >
        <span className="text-base leading-none">{active?.emoji ?? "👍"}</span>
        <span>{total}</span>
      </button>
      {open && (
        <div
          className="absolute -top-12 left-0 z-30 flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-lg animate-in fade-in zoom-in-95"
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          {REACTIONS.map((r) => (
            <button
              key={r.kind}
              onClick={() => { onPick(r.kind); setOpen(false); }}
              title={r.label}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-lg transition hover:scale-125",
                mine === r.kind && "bg-primary/20",
              )}
            >
              {r.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}