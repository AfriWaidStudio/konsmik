import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Heart, MessageCircle, Star, LogOut, Settings, Bookmark } from "lucide-react";

export const Route = createFileRoute("/me")({
  head: () => ({ meta: [{ title: "Profile — Konsmia" }] }),
  component: Page,
});

function Page() {
  const { user, profile, signOut } = useAuth();
  const nav = useNavigate();
  const [stats, setStats] = useState({ posts: 0, likes: 0, views: 0, comments: 0, tokens: 0, followers: 0, following: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: posts } = await supabase.from("posts").select("id, views, tokens").eq("author_id", user.id);
      const ids = (posts ?? []).map((p) => p.id);
      const [{ count: likes }, { count: comments }, { count: followers }, { count: following }] = await Promise.all([
        supabase.from("likes").select("*", { count: "exact", head: true }).in("post_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
        supabase.from("comments").select("*", { count: "exact", head: true }).in("post_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id),
      ]);
      setStats({
        posts: posts?.length ?? 0,
        likes: likes ?? 0,
        views: (posts ?? []).reduce((s, p) => s + (p.views ?? 0), 0),
        comments: comments ?? 0,
        tokens: (posts ?? []).reduce((s, p) => s + (p.tokens ?? 0), 0),
        followers: followers ?? 0,
        following: following ?? 0,
      });
    })();
  }, [user]);

  if (!user) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-border/60 bg-card p-6 text-center">
          <p className="text-foreground/80">Sign in to view your profile.</p>
          <Link to="/login" className="mt-3 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Sign in</Link>
        </div>
      </AppShell>
    );
  }

  const initials = (profile?.display_name ?? "U").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <AppShell>
      <div className="flex items-center gap-3">
        <Avatar className="h-16 w-16 bg-primary/20"><AvatarFallback className="bg-primary/20 text-primary">{initials}</AvatarFallback></Avatar>
        <div>
          <h1 className="text-2xl font-bold text-primary">{profile?.display_name}</h1>
          <div className="text-sm text-muted-foreground">@{profile?.username}</div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-3 text-center text-xs text-muted-foreground">
        <div><div className="text-base font-bold text-foreground">{stats.posts}</div>posts</div>
        <div><div className="text-base font-bold text-foreground">{stats.followers}</div>followers</div>
        <div><div className="text-base font-bold text-foreground">{stats.following}</div>following</div>
        <div><div className="text-base font-bold text-foreground">{profile?.tokens_earned ?? 0}</div>tokens</div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link to="/bookmarks" className="flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-card p-3 text-sm hover:border-primary/40">
          <Bookmark className="h-4 w-4 text-primary" /> Bookmarks
        </Link>
        <Link to="/settings" className="flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-card p-3 text-sm hover:border-primary/40">
          <Settings className="h-4 w-4 text-primary" /> Settings
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Stat label="Total Likes" value={stats.likes} icon={<Heart className="h-4 w-4 text-primary" />} />
        <Stat label="Total Views" value={stats.views} icon={<Eye className="h-4 w-4 text-accent" />} />
        <Stat label="Tokens Earned" value={stats.tokens} icon={<Star className="h-4 w-4 text-primary" />} />
        <Stat label="Comments" value={stats.comments} icon={<MessageCircle className="h-4 w-4 text-accent" />} />
      </div>

      <Button onClick={() => { signOut().then(() => nav({ to: "/" })); }} variant="outline" className="mt-6 w-full gap-2">
        <LogOut className="h-4 w-4" /> Sign out
      </Button>
    </AppShell>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 text-center">
      <div className="mx-auto mb-1 flex h-6 w-6 items-center justify-center">{icon}</div>
      <div className="text-xl font-bold text-foreground">{value.toLocaleString()}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}