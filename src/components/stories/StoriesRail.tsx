import { useEffect, useRef, useState } from "react";
import { Plus, X, Trash2, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  fetchActiveStoryGroups,
  createStory,
  markStoryViewed,
  deleteStory,
  type StoryGroup,
} from "@/lib/stories";
import { supabase } from "@/integrations/supabase/client";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function StoriesRail() {
  const { user, profile } = useAuth();
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [viewer, setViewer] = useState<{ group: number; index: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const g = await fetchActiveStoryGroups(user?.id);
      setGroups(g);
    } catch (e: any) {
      // silent
    }
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("stories-rail")
      .on("postgres_changes", { event: "*", schema: "public", table: "stories" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !user) return;
    setUploading(true);
    try {
      await createStory(f, user.id);
      toast.success("Story posted");
      await load();
    } catch (err: any) {
      toast.error(err.message ?? "Failed");
    } finally {
      setUploading(false);
    }
  };

  const openGroup = (i: number) => setViewer({ group: i, index: 0 });

  const myAvatar = profile?.avatar_url ?? null;
  const myName = profile?.display_name ?? "You";

  return (
    <div className="-mx-1 flex items-start gap-3 overflow-x-auto px-1 pb-1">
      {user && (
        <button
          onClick={() => fileRef.current?.click()}
          className="flex w-16 shrink-0 flex-col items-center gap-1"
          aria-label="Add story"
        >
          <div className="relative h-16 w-16 rounded-full border-2 border-dashed border-primary/60 p-0.5">
            <Avatar className="h-full w-full bg-primary/20">
              {myAvatar && <AvatarImage src={myAvatar} />}
              <AvatarFallback className="bg-primary/20 text-primary text-xs">{initials(myName)}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            </div>
          </div>
          <span className="max-w-[64px] truncate text-[10px] text-muted-foreground">Your story</span>
          <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={onFile} />
        </button>
      )}
      {groups.map((g, i) => {
        const av = g.author.avatar_url;
        return (
          <button
            key={g.author.id}
            onClick={() => openGroup(i)}
            className="flex w-16 shrink-0 flex-col items-center gap-1"
          >
            <div
              className={cn(
                "h-16 w-16 rounded-full p-0.5",
                g.seen
                  ? "bg-border"
                  : "bg-gradient-to-tr from-primary via-accent to-primary",
              )}
            >
              <div className="h-full w-full rounded-full bg-background p-0.5">
                <Avatar className="h-full w-full bg-primary/20">
                  {av && <AvatarImage src={av} />}
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {initials(g.author.display_name)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <span className="max-w-[64px] truncate text-[10px] text-foreground/80">
              {g.author.display_name}
            </span>
          </button>
        );
      })}
      {viewer && (
        <StoryViewer
          groups={groups}
          start={viewer}
          onClose={() => { setViewer(null); load(); }}
        />
      )}
    </div>
  );
}

function StoryViewer({
  groups,
  start,
  onClose,
}: {
  groups: StoryGroup[];
  start: { group: number; index: number };
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [gi, setGi] = useState(start.group);
  const [si, setSi] = useState(start.index);
  const [progress, setProgress] = useState(0);

  const group = groups[gi];
  const story = group?.stories[si];

  useEffect(() => {
    if (!story || !user) return;
    markStoryViewed(story.id, user.id);
  }, [story?.id, user?.id]);

  useEffect(() => {
    if (!story) return;
    if (story.media_type === "video") return; // video advances via onEnded
    setProgress(0);
    const started = Date.now();
    const dur = 5000;
    const t = setInterval(() => {
      const p = Math.min(1, (Date.now() - started) / dur);
      setProgress(p);
      if (p >= 1) {
        clearInterval(t);
        advance();
      }
    }, 60);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gi, si]);

  const advance = () => {
    if (!group) return onClose();
    if (si + 1 < group.stories.length) {
      setSi(si + 1);
    } else if (gi + 1 < groups.length) {
      setGi(gi + 1);
      setSi(0);
    } else {
      onClose();
    }
  };

  const back = () => {
    if (si > 0) setSi(si - 1);
    else if (gi > 0) {
      const prev = groups[gi - 1];
      setGi(gi - 1);
      setSi(prev.stories.length - 1);
    }
  };

  if (!story || !group) return null;
  const mine = user?.id === group.author.id;

  const onDelete = async () => {
    if (!confirm("Delete this story?")) return;
    try {
      await deleteStory(story.id);
      toast.success("Deleted");
      advance();
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
      <div className="relative flex h-full w-full max-w-md flex-col">
        <div className="flex gap-1 p-2">
          {group.stories.map((_, idx) => (
            <div key={idx} className="h-0.5 flex-1 overflow-hidden rounded bg-white/20">
              <div
                className="h-full bg-white transition-[width]"
                style={{
                  width:
                    idx < si ? "100%" : idx === si ? `${progress * 100}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-3 pb-2">
          <div className="flex items-center gap-2 text-white">
            <Avatar className="h-8 w-8">
              {group.author.avatar_url && <AvatarImage src={group.author.avatar_url} />}
              <AvatarFallback className="bg-primary/40 text-xs">
                {initials(group.author.display_name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-semibold">{group.author.display_name}</span>
          </div>
          <div className="flex items-center gap-3 text-white">
            {mine && (
              <button onClick={onDelete} aria-label="Delete">
                <Trash2 className="h-5 w-5" />
              </button>
            )}
            <button onClick={onClose} aria-label="Close">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        <div className="relative flex-1">
          {story.media_type === "video" ? (
            <video
              key={story.id}
              src={story.media_url}
              autoPlay
              playsInline
              onEnded={advance}
              className="h-full w-full object-contain"
            />
          ) : (
            <img src={story.media_url} alt="" className="h-full w-full object-contain" />
          )}
          {story.caption && (
            <div className="absolute bottom-6 left-0 right-0 px-4 text-center text-sm text-white drop-shadow">
              {story.caption}
            </div>
          )}
          <button
            aria-label="Previous"
            onClick={back}
            className="absolute inset-y-0 left-0 w-1/3"
          />
          <button
            aria-label="Next"
            onClick={advance}
            className="absolute inset-y-0 right-0 w-1/3"
          />
        </div>
      </div>
    </div>
  );
}