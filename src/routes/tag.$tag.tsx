import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useEffect, useState } from "react";
import { fetchPostsByHashtag } from "@/lib/posts";
import { PostCard, type PostRow } from "@/components/post/PostCard";
import { useAuth } from "@/lib/auth-context";
import { Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isFollowingTag, toggleFollowTag } from "@/lib/feed-prefs";
import { toast } from "sonner";

export const Route = createFileRoute("/tag/$tag")({
  component: TagPage,
});

function TagPage() {
  const { tag } = Route.useParams();
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [following, setFollowing] = useState(false);
  useEffect(() => { fetchPostsByHashtag(tag, user?.id).then(setPosts); }, [tag, user?.id]);
  useEffect(() => { if (user) isFollowingTag(user.id, tag).then(setFollowing); }, [tag, user?.id]);
  const onToggle = async () => {
    if (!user) return toast.error("Sign in to follow tags");
    const now = await toggleFollowTag(user.id, tag);
    setFollowing(now);
    toast.success(now ? `Following #${tag}` : `Unfollowed #${tag}`);
  };
  return (
    <AppShell>
      <Link to="/" className="text-sm text-primary">← Back</Link>
      <div className="mt-2 flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-primary"><Hash className="h-6 w-6" /> {tag}</h1>
        <Button size="sm" variant={following ? "outline" : "default"} onClick={onToggle}>
          {following ? "Following" : "Follow tag"}
        </Button>
      </div>
      <div className="mt-4 space-y-3">
        {posts.length === 0 && <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-muted-foreground">No posts with #{tag} yet.</div>}
        {posts.map((p) => <PostCard key={p.id} post={p} />)}
      </div>
    </AppShell>
  );
}
