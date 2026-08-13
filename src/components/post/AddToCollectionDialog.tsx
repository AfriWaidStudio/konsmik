import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Check } from "lucide-react";
import { toast } from "sonner";
import {
  addToCollection,
  createCollection,
  fetchMyCollections,
  fetchPostCollections,
  removeFromCollection,
  type Collection,
} from "@/lib/collections";

export function AddToCollectionDialog({
  open,
  onOpenChange,
  userId,
  postId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  postId: string;
}) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [inSet, setInSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [list, mySet] = await Promise.all([
        fetchMyCollections(userId),
        fetchPostCollections(userId, postId),
      ]);
      setCollections(list);
      setInSet(mySet);
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line
  }, [open]);

  const toggle = async (c: Collection) => {
    const has = inSet.has(c.id);
    const next = new Set(inSet);
    if (has) next.delete(c.id); else next.add(c.id);
    setInSet(next);
    try {
      if (has) await removeFromCollection(c.id, postId);
      else await addToCollection(c.id, postId);
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
      setInSet(inSet);
    }
  };

  const create = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const c = await createCollection(userId, newName.trim());
      await addToCollection(c.id, postId);
      setNewName("");
      toast.success("Saved");
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save to collection</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New collection name"
              onKeyDown={(e) => { if (e.key === "Enter") create(); }}
            />
            <Button onClick={create} disabled={creating || !newName.trim()} size="sm">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
          <div className="max-h-72 overflow-auto rounded-md border border-border/60">
            {loading ? (
              <div className="flex justify-center p-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
            ) : collections.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No collections yet. Create one above.</div>
            ) : (
              collections.map((c) => {
                const has = inSet.has(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggle(c)}
                    className="flex w-full items-center justify-between border-b border-border/40 px-3 py-2 text-left text-sm last:border-0 hover:bg-card"
                  >
                    <span>
                      <span className="font-medium">{c.name}</span>
                      {c.is_public && <span className="ml-2 text-xs text-muted-foreground">public</span>}
                    </span>
                    {has && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}