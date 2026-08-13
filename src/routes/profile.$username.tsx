import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { fetchPostsByAuthor } from "@/lib/posts";
import { PostCard, type PostRow } from "@/components/post/PostCard";
import { toast } from "sonner";
import { UserPlus, UserCheck, MessageSquare, MapPin, LinkIcon, CalendarDays, MoreHorizontal, VolumeX, Ban } from "lucide-react";
import { blockUser, muteUser, fetchFollowList } from "@/lib/social";
import { findOrCreateDirectThread } from "@/lib/dm";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/profile/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — Konsmia` },
      { name: "description", content: `See posts, media and activity from @${params.username} on Konsmia.` },
      { property: "og:title", content: `@${params.username} — Konsmia` },
      { property: "og:description", content: `See posts, media and activity from @${params.username} on Konsmia.` },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

type Tab = "posts" | "media" | "likes";

function ProfilePage() {
  const { username } = Route.useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [liked, setLiked] = useState<PostRow[]>([]);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [following, setFollowing] = useState(false);
  const [tab, setTab] = useState<Tab>("posts");
  const [listKind, setListKind] = useState<"followers" | "following" | null>(null);
  const [list, setList] = useState<any[]>([]);

  const load = async () => {
    const { data: p } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
    setProfile(p);
    if (!p) return;
    setPosts(await fetchPostsByAuthor(p.id, user?.id));
    const [{ count: fers }, { count: fing }] = await Promise.all([
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", p.id),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", p.id),
    ]);
    setCounts({ followers: fers ?? 0, following: fing ?? 0 });
    if (user) {
      const { data: f } = await supabase.from("follows").select("follower_id").eq("follower_id", user.id).eq("following_id", p.id).maybeSingle();
      setFollowing(!!f);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [username, user?.id]);

  useEffect(() => {
    if (tab !== "likes" || !profile) return;
    (async () => {
      const { data } = await supabase.from("likes").select("post_id").eq("user_id", profile.id).limit(50);
      const ids = (data ?? []).map((l: any) => l.post_id);
      if (!ids.length) return setLiked([]);
      const { data: rows } = await supabase
        .from("posts")
        .select("id, body, category, hashtags, trending, views, tokens, created_at, type, author_id, space_id, pinned, edited_at, media_url")
        .in("id", ids);
      const { fetchPostById } = await import("@/lib/posts");
      const full = await Promise.all((rows ?? []).map((r: any) => fetchPostById(r.id, user?.id)));
      setLiked(full.filter(Boolean) as PostRow[]);
    })();
  }, [tab, profile?.id]);

  const openList = async (kind: "followers" | "following") => {
    if (!profile) return;
    setListKind(kind);
    setList(await fetchFollowList(profile.id, kind));
  };

  const toggleFollow = async () => {
    if (!user || !profile) return toast.error("Sign in to follow");
    if (user.id === profile.id) return;
    if (following) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", profile.id);
      setFollowing(false);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: profile.id });
      setFollowing(true);
    }
    load();
  };

  const message = async () => {
    if (!user || !profile) return toast.error("Sign in to message");
    try {
      const id = await findOrCreateDirectThread(user.id, profile.id);
      window.location.href = `/messages/${id}`;
    } catch (e: any) {
      toast.error(e.message ?? "Could not open chat");
    }
  };

  if (!profile) return <AppShell><div className="text-muted-foreground">Loading…</div></AppShell>;

  const initials = (profile.display_name ?? "U").split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase();
  const media = posts.filter((p) => p.media_url);
  const shown = tab === "posts" ? posts : tab === "media" ? media : liked;

  return (
    <AppShell>
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="h-28 w-full bg-gradient-to-r from-primary/30 to-accent/30">
          {profile.cover_url && <img src={profile.cover_url} alt={`${profile.display_name} cover`} className="h-28 w-full object-cover" />}
        </div>
        <div className="p-4">
          <div className="-mt-12 flex items-end justify-between">
            <Avatar className="h-20 w-20 border-4 border-card bg-primary/20">
              {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt={profile.display_name} /> : null}
              <AvatarFallback className="bg-primary/20 text-primary">{initials}</AvatarFallback>
            </Avatar>
            {user && user.id !== profile.id && (
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-full border border-border/60 p-2"><MoreHorizontal className="h-4 w-4" /></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={async () => { await muteUser(user.id, profile.id); toast.success("Muted"); }}>
                    <VolumeX className="mr-2 h-4 w-4" /> Mute
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={async () => { await blockUser(user.id, profile.id); toast.success("Blocked"); }}>
                    <Ban className="mr-2 h-4 w-4" /> Block
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-bold text-primary">{profile.display_name}</h1>
          <div className="text-sm text-muted-foreground">@{profile.username}{profile.title ? ` · ${profile.title}` : ""}</div>
          {profile.bio && <p className="mt-2 text-sm text-foreground/80">{profile.bio}</p>}
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {profile.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{profile.location}</span>}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary">
                <LinkIcon className="h-3 w-3" />{profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </span>
          </div>
          {Array.isArray(profile.interests) && profile.interests.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile.interests.map((i: string) => (
                <span key={i} className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-foreground/70">{i}</span>
              ))}
            </div>
          )}
          <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground">
            <div><div className="text-base font-bold text-foreground">{posts.length}</div>posts</div>
            <button onClick={() => openList("followers")}><div className="text-base font-bold text-foreground">{counts.followers}</div>followers</button>
            <button onClick={() => openList("following")}><div className="text-base font-bold text-foreground">{counts.following}</div>following</button>
          </div>
          {user && user.id === profile.id ? (
            <Link to="/settings" className="mt-4 block"><Button variant="outline" className="w-full">Edit profile</Button></Link>
          ) : user ? (
            <div className="mt-4 flex gap-2">
              <Button onClick={toggleFollow} className={following ? "flex-1 bg-secondary text-foreground" : "flex-1 bg-primary text-primary-foreground"}>
                {following ? <><UserCheck className="mr-1 h-4 w-4" />Following</> : <><UserPlus className="mr-1 h-4 w-4" />Follow</>}
              </Button>
              <Button onClick={message} variant="outline" className="flex-1 gap-1"><MessageSquare className="h-4 w-4" /> Message</Button>
            </div>
          ) : (
            <Link to="/login" className="mt-4 block"><Button className="w-full bg-primary text-primary-foreground">Sign in to follow</Button></Link>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {(["posts", "media", "likes"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn("flex-1 rounded-lg px-3 py-2 text-sm font-semibold capitalize", tab === t ? "bg-primary text-primary-foreground" : "text-foreground/70")}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {shown.length === 0 && <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-muted-foreground">Nothing here yet.</div>}
        {shown.map((p) => <PostCard key={p.id} post={p} onChange={load} />)}
      </div>

      <Dialog open={!!listKind} onOpenChange={(o) => !o && setListKind(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="capitalize">{listKind}</DialogTitle></DialogHeader>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {list.length === 0 && <p className="text-sm text-muted-foreground">Nobody yet.</p>}
            {list.map((p: any) => (
              <Link key={p.id} to="/profile/$username" params={{ username: p.username }} onClick={() => setListKind(null)} className="flex items-center gap-3 rounded-lg p-2 hover:bg-secondary/50">
                <Avatar className="h-9 w-9 bg-primary/20">
                  {p.avatar_url ? <AvatarImage src={p.avatar_url} alt={p.display_name} /> : null}
                  <AvatarFallback className="bg-primary/20 text-primary">{(p.display_name ?? "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-semibold">{p.display_name}</div>
                  <div className="text-xs text-muted-foreground">@{p.username}</div>
                </div>
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
