import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { createSpace, KIND_LABELS, type SpaceKind, type SpaceVisibility } from "@/lib/spaces";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { Users, Building2, Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const KINDS: { id: SpaceKind; label: string; desc: string; Icon: any }[] = [
  { id: "group", label: "Group", desc: "Open community around a topic", Icon: Users },
  { id: "page", label: "Page", desc: "Brand or creator with an audience", Icon: Building2 },
  { id: "circle", label: "Circle", desc: "Private friend circle, invite only", Icon: Lock },
];

export function CreateSpaceDialog({ open, onOpenChange, defaultKind = "group" }: { open: boolean; onOpenChange: (v: boolean) => void; defaultKind?: SpaceKind }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [kind, setKind] = useState<SpaceKind>(defaultKind);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<SpaceVisibility>("public");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user) return toast.error("Sign in first");
    if (!name.trim()) return;
    setBusy(true);
    try {
      const s = await createSpace({
        kind,
        name: name.trim(),
        description: description.trim() || undefined,
        visibility: kind === "circle" ? "invite_only" : visibility,
        owner_id: user.id,
      });
      toast.success(`${KIND_LABELS[kind].singular} created`);
      onOpenChange(false);
      setName(""); setDescription("");
      nav({ to: "/spaces/$slug", params: { slug: s.slug } });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-primary/30">
        <DialogHeader><DialogTitle className="text-primary">Create a space</DialogTitle></DialogHeader>
        <div className="grid grid-cols-3 gap-2">
          {KINDS.map(({ id, label, desc, Icon }) => (
            <button
              key={id}
              onClick={() => setKind(id)}
              className={cn(
                "rounded-xl border p-3 text-left transition",
                kind === id ? "border-primary bg-primary/10" : "border-border/60",
              )}
            >
              <Icon className="h-5 w-5 text-primary" />
              <div className="mt-1 text-sm font-semibold">{label}</div>
              <div className="text-[10px] text-muted-foreground">{desc}</div>
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={`${KIND_LABELS[kind].singular} name`} maxLength={60} className="bg-input/40" />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={500} className="bg-input/40" />
        </div>
        {kind !== "circle" && (
          <div className="flex gap-2">
            {(["public", "private"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVisibility(v)}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2 text-sm capitalize",
                  visibility === v ? "border-primary bg-primary/10 text-primary" : "border-border/60",
                )}
              >
                {v}
              </button>
            ))}
          </div>
        )}
        <Button onClick={submit} disabled={busy || !name.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : `Create ${KIND_LABELS[kind].singular}`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
