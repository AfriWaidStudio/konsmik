import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useEffect, useState } from "react";
import {
  getSpaceBySlug, getMembership, joinSpace, leaveSpace, listSpaceMembers,
  KIND_LABELS, MEMBER_LABEL, ensureCircleThread,
  listSpaceEvents, createSpaceEvent, deleteSpaceEvent,
  listSpaceReviews, upsertSpaceReview, getReviewSummary,
  listJoinRequests, decideJoinRequest, requestToJoin,
  listSpaceServices, createSpaceService, deleteSpaceService,
  listAlbums, createAlbum, listAlbumPhotos, addAlbumPhoto, removeAlbumPhoto, deleteAlbum,
  getSpaceAnalytics, messagePageAdmin,
  type Space, type SpaceMember, type SpaceEvent, type SpaceReview,
  type SpaceJoinRequest, type SpaceService, type SpaceAlbum, type AlbumPhoto,
} from "@/lib/spaces";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { fetchPostsBySpace, createPost } from "@/lib/posts";
import { PostCard, type PostRow } from "@/components/post/PostCard";
import {
  Settings, Loader2, Lock, Globe, Users, Calendar, Link as LinkIcon, Crown,
  Star, Mail, Phone, MessageCircle, MapPin, Image as ImageIcon, Trash2, Plus,
  BadgeCheck, BarChart3, ShoppingBag, Send, Camera, ChevronRight,
} from "lucide-react";
import { uploadToMedia } from "@/lib/upload";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/spaces/$slug")({
  component: SpacePage,
});

function SpacePage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [space, setSpace] = useState<Space | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [events, setEvents] = useState<SpaceEvent[]>([]);
  const [reviews, setReviews] = useState<SpaceReview[]>([]);
  const [reviewSummary, setReviewSummary] = useState<{ count: number; avg: number }>({ count: 0, avg: 0 });
  const [joinRequests, setJoinRequests] = useState<SpaceJoinRequest[]>([]);
  const [services, setServices] = useState<SpaceService[]>([]);
  const [albums, setAlbums] = useState<SpaceAlbum[]>([]);

  const load = async () => {
    const s = await getSpaceBySlug(slug);
    setSpace(s);
    if (s && user) {
      const m = await getMembership(s.id, user.id);
      setRole(m?.role ?? (s.owner_id === user.id ? "admin" : null));
    }
    if (s) {
      setPosts(await fetchPostsBySpace(s.id, user?.id));
      setMembers(await listSpaceMembers(s.id));
      if (s.kind === "group" || s.kind === "circle") setEvents(await listSpaceEvents(s.id));
      if (s.kind === "page") {
        setReviews(await listSpaceReviews(s.id));
        setReviewSummary(await getReviewSummary(s.id));
        setServices(await listSpaceServices(s.id));
      }
      if (s.kind === "circle") setAlbums(await listAlbums(s.id));
      if ((s.kind === "group" || s.kind === "circle") && user) {
        const m = await getMembership(s.id, user.id);
        const admin = m?.role === "admin" || m?.role === "moderator" || s.owner_id === user.id;
        if (admin) setJoinRequests(await listJoinRequests(s.id));
      }
      if (s.kind === "page" && user) {
        const m = await getMembership(s.id, user.id);
        const admin = m?.role === "admin" || m?.role === "moderator" || s.owner_id === user.id;
        if (admin) setJoinRequests(await listJoinRequests(s.id));
      }
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [slug, user?.id]);

  if (!space) return <AppShell><div className="text-muted-foreground">Loading…</div></AppShell>;

  const isMember = !!role;
  const isAdmin = role === "admin" || role === "moderator" || space.owner_id === user?.id;
  const restricted = space.visibility !== "public" && !isMember;
  const theme = space.theme_color || "#a855f7";
  const labels = KIND_LABELS[space.kind];
  const memberWord = MEMBER_LABEL[space.kind];

  const handleJoin = async () => {
    if (!user) return nav({ to: "/login" });
    if (space.visibility === "invite_only" && !isAdmin) return toast.error("Invite only");
    await joinSpace(space.id, user.id);
    toast.success(space.kind === "page" ? "Following" : "Joined");
    load();
  };
  const handleLeave = async () => {
    if (!user) return;
    await leaveSpace(space.id, user.id);
    toast.success(space.kind === "page" ? "Unfollowed" : "Left");
    load();
  };

  const openCircleChat = async () => {
    if (!user) return nav({ to: "/login" });
    try {
      const tid = await ensureCircleThread(space, user.id);
      nav({ to: "/messages/$id", params: { id: tid } });
    } catch (e: any) { toast.error(e.message ?? "Could not open chat"); }
  };

  const messageAdmin = async () => {
    if (!user) return nav({ to: "/login" });
    try {
      const tid = await messagePageAdmin(space, user.id);
      nav({ to: "/messages/$id", params: { id: tid } });
    } catch (e: any) { toast.error(e.message ?? "Could not start chat"); }
  };

  const requestJoin = async () => {
    if (!user) return nav({ to: "/login" });
    try {
      await requestToJoin(space.id, user.id);
      toast.success("Request sent to admins");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <AppShell>
      <div
        className="relative h-40 w-full overflow-hidden rounded-2xl border border-border/60"
        style={{
          background: space.cover_url
            ? `url(${space.cover_url}) center/cover`
            : `linear-gradient(135deg, ${theme}, hsl(var(--accent)))`,
        }}
      />

      <div className="relative -mt-10 rounded-2xl border border-border/60 bg-card p-4">
        <div className="flex items-end gap-3">
          <Avatar className="h-20 w-20 border-4 border-background" style={{ background: theme }}>
            {space.avatar_url && <AvatarImage src={space.avatar_url} alt={space.name} />}
            <AvatarFallback className="text-2xl font-bold text-white" style={{ background: theme }}>
              {space.name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-primary">
              {space.visibility === "public" ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {labels.singular} · {space.visibility.replace("_", " ")}
              {space.category && <span className="text-muted-foreground">· {space.category}</span>}
            </div>
            <h1 className="text-xl font-bold leading-tight">{space.name}</h1>
            {space.verified && (
              <span className="inline-flex items-center gap-1 text-[10px] text-accent"><BadgeCheck className="h-3 w-3" /> Verified</span>
            )}
            <div className="text-xs text-muted-foreground">
              {space.member_count} {memberWord}
              {space.kind === "page" && reviewSummary.count > 0 && (
                <span className="ml-2 text-accent">★ {reviewSummary.avg.toFixed(1)} ({reviewSummary.count})</span>
              )}
            </div>
          </div>
        </div>

        {space.description && <p className="mt-3 text-sm text-foreground/80">{space.description}</p>}

        <div className="mt-3 flex flex-wrap gap-2">
          {isMember ? (
            <Button variant="outline" size="sm" onClick={handleLeave}>
              {space.kind === "page" ? "Unfollow" : "Leave"}
            </Button>
          ) : space.visibility === "private" && space.kind === "group" ? (
            <Button size="sm" onClick={requestJoin} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Request to join
            </Button>
          ) : (
            <Button size="sm" onClick={handleJoin} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {labels.verb}
            </Button>
          )}
          {space.kind === "circle" && isMember && (
            <Button size="sm" variant="outline" onClick={openCircleChat} className="gap-1">
              <MessageCircle className="h-4 w-4" /> Group chat
            </Button>
          )}
          {space.kind === "page" && space.cta_url && space.cta_label && (
            <a href={space.cta_url} target="_blank" rel="noreferrer">
              <Button size="sm" className="gap-1 bg-accent text-accent-foreground hover:bg-accent/90">
                <ShoppingBag className="h-4 w-4" /> {space.cta_label}
              </Button>
            </a>
          )}
          {space.kind === "page" && (
            <Button size="sm" variant="outline" onClick={messageAdmin} className="gap-1">
              <Send className="h-4 w-4" /> Message
            </Button>
          )}
          {space.kind === "page" && space.contact_email && (
            <a href={`mailto:${space.contact_email}`}>
              <Button variant="outline" size="sm" className="gap-1"><Mail className="h-4 w-4" /> Contact</Button>
            </a>
          )}
          {space.kind === "page" && space.phone && (
            <a href={`tel:${space.phone}`}>
              <Button variant="outline" size="sm" className="gap-1"><Phone className="h-4 w-4" /> Call</Button>
            </a>
          )}
          {isAdmin && (
            <Link to="/spaces/$slug/admin" params={{ slug: space.slug }}>
              <Button variant="outline" size="sm" className="gap-1"><Settings className="h-4 w-4" /> Manage</Button>
            </Link>
          )}
          {space.website && (
            <a href={space.website} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="gap-1"><LinkIcon className="h-4 w-4" /> Website</Button>
            </a>
          )}
        </div>
      </div>

      {restricted ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border/60 p-8 text-center text-muted-foreground">
          <Lock className="mx-auto h-6 w-6 text-primary" />
          <p className="mt-2">This {space.kind} is {space.visibility.replace("_", " ")}. Join to see posts.</p>
        </div>
      ) : (
        <KindTabs
          space={space}
          isMember={isMember}
          isAdmin={isAdmin}
          posts={posts}
          members={members}
          events={events}
          reviews={reviews}
          reviewSummary={reviewSummary}
          joinRequests={joinRequests}
          services={services}
          albums={albums}
          memberWord={memberWord}
          onReload={load}
          openCircleChat={openCircleChat}
        />
      )}
    </AppShell>
  );
}

/* -------------------- Per-kind tab sets -------------------- */

function KindTabs(props: {
  space: Space;
  isMember: boolean;
  isAdmin: boolean;
  posts: PostRow[];
  members: SpaceMember[];
  events: SpaceEvent[];
  reviews: SpaceReview[];
  reviewSummary: { count: number; avg: number };
  joinRequests: SpaceJoinRequest[];
  services: SpaceService[];
  albums: SpaceAlbum[];
  memberWord: string;
  onReload: () => void;
  openCircleChat: () => void;
}) {
  const { space } = props;
  if (space.kind === "page") return <PageTabs {...props} />;
  if (space.kind === "circle") return <CircleTabs {...props} />;
  return <GroupTabs {...props} />;
}

function ComposerCard({ space, onPosted, label }: { space: Space; onPosted: () => void; label?: string }) {
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f || !user) return;
    setUploading(true);
    try {
      const url = await uploadToMedia(f, user.id, `spaces/${space.id}`);
      setMediaUrl(url);
    } catch (err: any) { toast.error(err.message); } finally { setUploading(false); }
  };

  const post = async () => {
    if (!user) return toast.error("Sign in");
    if (!body.trim() && !mediaUrl) return;
    setBusy(true);
    try {
      await createPost({
        author_id: user.id, body: body.trim(), space_id: space.id,
        media_url: mediaUrl, type: mediaUrl ? "image" : "discussion",
      });
      setBody(""); setMediaUrl(null);
      toast.success("Posted"); onPosted();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3}
        placeholder={label ?? `Post in ${space.name}…`} className="bg-background" />
      {mediaUrl && (
        <div className="relative mt-2"><img src={mediaUrl} alt="" className="max-h-48 w-full rounded-lg object-cover" />
          <button onClick={() => setMediaUrl(null)} className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white text-xs">×</button></div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-primary">
          <ImageIcon className="h-4 w-4" /> Photo
          <input type="file" accept="image/*" hidden onChange={onFile} disabled={uploading} />
        </label>
        <Button onClick={post} disabled={busy || (!body.trim() && !mediaUrl)} size="sm" className="bg-primary text-primary-foreground">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Share"}
        </Button>
      </div>
    </div>
  );
}

function MembersList({ members, space, kindLabel }: { members: SpaceMember[]; space: Space; kindLabel: string }) {
  return (
    <div className="space-y-2">
      <div className="text-xs uppercase text-muted-foreground">{members.length} {kindLabel}</div>
      {members.map((m) => (
        <Link key={m.user_id} to="/profile/$username" params={{ username: m.profile?.username ?? "" }}
          className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 hover:border-primary/40">
          <Avatar className="h-9 w-9 bg-primary/20">
            {m.profile?.avatar_url && <AvatarImage src={m.profile.avatar_url} />}
            <AvatarFallback className="bg-primary/20 text-primary">
              {(m.profile?.display_name ?? "U").slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="text-sm font-semibold flex items-center gap-1">
              {m.profile?.display_name ?? "User"}
              {m.user_id === space.owner_id && <Crown className="h-3 w-3 text-accent" />}
            </div>
            <div className="text-xs text-muted-foreground">@{m.profile?.username} · {m.role}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function AboutCard({ space }: { space: Space }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Calendar className="h-4 w-4 text-primary" /> Created {new Date(space.created_at).toLocaleDateString()}
      </div>
      {space.category && <div className="text-muted-foreground">Category: <span className="text-foreground">{space.category}</span></div>}
      {space.description && <div><div className="text-xs uppercase text-primary mb-1">Description</div><p>{space.description}</p></div>}
      {space.rules && <div><div className="text-xs uppercase text-primary mb-1">Rules</div><p className="whitespace-pre-wrap">{space.rules}</p></div>}
      {space.contact_email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> {space.contact_email}</div>}
      {space.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {space.phone}</div>}
    </div>
  );
}

/* ----- GROUP: Posts | Discussions | Events | Members | About ----- */
function GroupTabs(props: any) {
  const { space, isMember, isAdmin, posts, members, events, joinRequests, onReload } = props;
  const pinned = posts.filter((p: PostRow) => p.pinned);
  const tabsCount = isAdmin ? 6 : 5;
  return (
    <Tabs defaultValue="posts" className="mt-4">
      <TabsList className={cn("grid w-full bg-card", tabsCount === 6 ? "grid-cols-6" : "grid-cols-5")}>
        <TabsTrigger value="posts">Posts</TabsTrigger>
        <TabsTrigger value="discuss">Discuss</TabsTrigger>
        <TabsTrigger value="events">Events</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="about">About</TabsTrigger>
        {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
      </TabsList>

      <TabsContent value="posts" className="mt-4 space-y-3">
        {isMember && <ComposerCard space={space} onPosted={onReload} />}
        {pinned.length > 0 && (
          <div className="space-y-2">
            <div className="text-[10px] uppercase text-primary">Pinned</div>
            {pinned.map((p: PostRow) => <PostCard key={p.id} post={p} onChange={onReload} />)}
          </div>
        )}
        {posts.length === 0
          ? <div className="rounded-2xl border border-dashed border-border/60 p-6 text-center text-muted-foreground">No posts yet.</div>
          : posts.filter((p: PostRow) => !p.pinned).map((p: PostRow) => <PostCard key={p.id} post={p} onChange={onReload} />)}
      </TabsContent>

      <TabsContent value="discuss" className="mt-4 space-y-3">
        {isMember && <ComposerCard space={space} onPosted={onReload} label="Start a discussion…" />}
        {posts.filter((p: PostRow) => p.type === "discussion").map((p: PostRow) => <PostCard key={p.id} post={p} onChange={onReload} />)}
      </TabsContent>

      <TabsContent value="events" className="mt-4 space-y-3">
        <EventsPanel space={space} events={events} isMember={isMember} onReload={onReload} />
      </TabsContent>

      <TabsContent value="members" className="mt-4">
        <MembersList members={members} space={space} kindLabel="members" />
      </TabsContent>

      <TabsContent value="about" className="mt-4"><AboutCard space={space} /></TabsContent>

      {isAdmin && (
        <TabsContent value="admin" className="mt-4 space-y-3">
          <JoinRequestsPanel space={space} requests={joinRequests} onReload={onReload} />
          <ShareInvitePanel space={space} />
        </TabsContent>
      )}
    </Tabs>
  );
}

/* ----- PAGE: Posts | Photos | Reviews | About | Followers ----- */
function PageTabs(props: any) {
  const { space, isAdmin, posts, members, reviews, reviewSummary, services, onReload } = props;
  const photoPosts = posts.filter((p: PostRow) => p.media_url);
  const cols = isAdmin ? 7 : 6;
  return (
    <Tabs defaultValue="posts" className="mt-4">
      <TabsList className={cn("grid w-full bg-card", cols === 7 ? "grid-cols-7" : "grid-cols-6")}>
        <TabsTrigger value="posts">Posts</TabsTrigger>
        <TabsTrigger value="photos">Photos</TabsTrigger>
        <TabsTrigger value="services">Offerings</TabsTrigger>
        <TabsTrigger value="reviews">Reviews</TabsTrigger>
        <TabsTrigger value="about">About</TabsTrigger>
        <TabsTrigger value="followers">Followers</TabsTrigger>
        {isAdmin && <TabsTrigger value="insights">Insights</TabsTrigger>}
      </TabsList>

      <TabsContent value="posts" className="mt-4 space-y-3">
        {isAdmin
          ? <ComposerCard space={space} onPosted={onReload} label={`Broadcast as ${space.name}…`} />
          : <div className="rounded-xl border border-border/60 bg-card p-3 text-xs text-muted-foreground">Only the page owner can post.</div>}
        {posts.length === 0
          ? <div className="rounded-2xl border border-dashed border-border/60 p-6 text-center text-muted-foreground">No posts yet.</div>
          : posts.map((p: PostRow) => <PostCard key={p.id} post={p} onChange={onReload} />)}
      </TabsContent>

      <TabsContent value="photos" className="mt-4">
        {photoPosts.length === 0
          ? <div className="rounded-2xl border border-dashed border-border/60 p-6 text-center text-muted-foreground">No photos yet.</div>
          : <div className="grid grid-cols-3 gap-1">
              {photoPosts.map((p: PostRow) => (
                <Link key={p.id} to="/post/$id" params={{ id: p.id }} className="aspect-square overflow-hidden rounded-md bg-muted">
                  <img src={p.media_url ?? ""} alt="" className="h-full w-full object-cover" />
                </Link>
              ))}
            </div>}
      </TabsContent>

      <TabsContent value="services" className="mt-4">
        <ServicesPanel space={space} services={services} isAdmin={isAdmin} onReload={onReload} />
      </TabsContent>

      <TabsContent value="reviews" className="mt-4 space-y-3">
        <ReviewsPanel space={space} reviews={reviews} summary={reviewSummary} onReload={onReload} />
      </TabsContent>

      <TabsContent value="about" className="mt-4"><AboutCard space={space} /></TabsContent>

      <TabsContent value="followers" className="mt-4">
        <MembersList members={members} space={space} kindLabel="followers" />
      </TabsContent>

      {isAdmin && (
        <TabsContent value="insights" className="mt-4">
          <InsightsPanel space={space} />
        </TabsContent>
      )}
    </Tabs>
  );
}

/* ----- CIRCLE: Moments | Chat | Members | About ----- */
function CircleTabs(props: any) {
  const { space, isMember, isAdmin, posts, members, events, albums, onReload, openCircleChat } = props;
  return (
    <Tabs defaultValue="moments" className="mt-4">
      <TabsList className="grid w-full grid-cols-6 bg-card">
        <TabsTrigger value="moments">Moments</TabsTrigger>
        <TabsTrigger value="chat">Chat</TabsTrigger>
        <TabsTrigger value="albums">Albums</TabsTrigger>
        <TabsTrigger value="events">Events</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="about">About</TabsTrigger>
      </TabsList>

      <TabsContent value="moments" className="mt-4 space-y-3">
        {isMember && <ComposerCard space={space} onPosted={onReload} label="Share a moment with the circle…" />}
        {posts.length === 0
          ? <div className="rounded-2xl border border-dashed border-border/60 p-6 text-center text-muted-foreground">No moments yet.</div>
          : posts.map((p: PostRow) => <PostCard key={p.id} post={p} onChange={onReload} />)}
      </TabsContent>

      <TabsContent value="chat" className="mt-4 space-y-3">
        <div className="rounded-2xl border border-border/60 bg-card p-6 text-center">
          <MessageCircle className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Private group chat for everyone in this circle.</p>
          <Button onClick={openCircleChat} className="mt-3 bg-primary text-primary-foreground">Open chat</Button>
        </div>
      </TabsContent>

      <TabsContent value="albums" className="mt-4">
        <AlbumsPanel space={space} albums={albums} isMember={isMember} onReload={onReload} />
      </TabsContent>

      <TabsContent value="events" className="mt-4 space-y-3">
        <EventsPanel space={space} events={events} isMember={isMember} onReload={onReload} />
      </TabsContent>

      <TabsContent value="members" className="mt-4 space-y-2">
        {isAdmin && <InvitePanel space={space} onReload={onReload} />}
        <MembersList members={members} space={space} kindLabel="members" />
      </TabsContent>

      <TabsContent value="about" className="mt-4"><AboutCard space={space} /></TabsContent>
    </Tabs>
  );
}

/* -------------------- Sub-panels -------------------- */

function EventsPanel({ space, events, isMember, onReload }: { space: Space; events: SpaceEvent[]; isMember: boolean; onReload: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(""); const [desc, setDesc] = useState("");
  const [loc, setLoc] = useState(""); const [start, setStart] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!user || !title.trim() || !start) return;
    setBusy(true);
    try {
      await createSpaceEvent({ space_id: space.id, created_by: user.id, title, description: desc || undefined, location: loc || undefined, start_at: new Date(start).toISOString() });
      setTitle(""); setDesc(""); setLoc(""); setStart(""); setOpen(false);
      toast.success("Event created"); onReload();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      {isMember && (
        <div className="rounded-2xl border border-border/60 bg-card p-3">
          {!open ? (
            <Button size="sm" variant="outline" className="gap-1" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New event</Button>
          ) : (
            <div className="space-y-2">
              <Input placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-background" />
              <Textarea placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} className="bg-background" />
              <Input placeholder="Location" value={loc} onChange={(e) => setLoc(e.target.value)} className="bg-background" />
              <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="bg-background" />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
                <Button size="sm" onClick={create} disabled={busy || !title.trim() || !start} className="flex-1 bg-primary text-primary-foreground">Create</Button>
              </div>
            </div>
          )}
        </div>
      )}
      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-6 text-center text-muted-foreground">No upcoming events.</div>
      ) : events.map((e) => (
        <div key={e.id} className="rounded-2xl border border-border/60 bg-card p-4">
          <div className="text-xs text-primary">{new Date(e.start_at).toLocaleString()}</div>
          <div className="font-semibold mt-1">{e.title}</div>
          {e.location && <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {e.location}</div>}
          {e.description && <p className="mt-2 text-sm text-foreground/80 whitespace-pre-wrap">{e.description}</p>}
          {user?.id === e.created_by && (
            <button onClick={async () => { await deleteSpaceEvent(e.id); onReload(); }} className="mt-2 text-xs text-destructive flex items-center gap-1">
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function ReviewsPanel({ space, reviews, summary, onReload }: { space: Space; reviews: SpaceReview[]; summary: { count: number; avg: number }; onReload: () => void }) {
  const { user } = useAuth();
  const mine = reviews.find((r) => r.user_id === user?.id);
  const [rating, setRating] = useState<number>(mine?.rating ?? 0);
  const [body, setBody] = useState<string>(mine?.body ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => { setRating(mine?.rating ?? 0); setBody(mine?.body ?? ""); }, [mine?.id]);

  const submit = async () => {
    if (!user) return toast.error("Sign in to review");
    if (rating < 1) return toast.error("Pick a rating");
    setBusy(true);
    try {
      await upsertSpaceReview(space.id, user.id, rating, body);
      toast.success(mine ? "Review updated" : "Review added"); onReload();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border/60 bg-card p-4 text-center">
        <div className="text-3xl font-bold text-accent">{summary.avg ? summary.avg.toFixed(1) : "—"}</div>
        <div className="text-xs text-muted-foreground">{summary.count} review{summary.count === 1 ? "" : "s"}</div>
      </div>
      {user && user.id !== space.owner_id && (
        <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-2">
          <div className="text-xs text-muted-foreground">Your review</div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)}>
                <Star className={cn("h-6 w-6", n <= rating ? "fill-accent text-accent" : "text-muted-foreground")} />
              </button>
            ))}
          </div>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Share your experience…" className="bg-background" maxLength={1000} />
          <Button onClick={submit} disabled={busy} size="sm" className="bg-primary text-primary-foreground">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mine ? "Update review" : "Post review"}
          </Button>
        </div>
      )}
      {reviews.map((r) => (
        <div key={r.id} className="rounded-2xl border border-border/60 bg-card p-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7 bg-primary/20">
              {r.profile?.avatar_url && <AvatarImage src={r.profile.avatar_url} />}
              <AvatarFallback className="bg-primary/20 text-primary text-xs">{(r.profile?.display_name ?? "U").slice(0, 1)}</AvatarFallback>
            </Avatar>
            <div className="text-sm font-semibold">{r.profile?.display_name ?? "User"}</div>
            <div className="ml-auto flex">
              {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={cn("h-3 w-3", n <= r.rating ? "fill-accent text-accent" : "text-muted-foreground")} />)}
            </div>
          </div>
          {r.body && <p className="mt-2 text-sm text-foreground/80 whitespace-pre-wrap">{r.body}</p>}
        </div>
      ))}
    </div>
  );
}

function InvitePanel({ space, onReload }: { space: Space; onReload: () => void }) {
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const invite = async () => {
    if (!user) return;
    const u = username.replace(/^@/, "").trim().toLowerCase();
    if (!u) return;
    setBusy(true);
    try {
      const { data: prof } = await (await import("@/integrations/supabase/client")).supabase
        .from("profiles").select("id").eq("username", u).maybeSingle();
      if (!prof) { toast.error("User not found"); return; }
      const { inviteToSpace } = await import("@/lib/spaces");
      await inviteToSpace(space.id, prof.id, user.id);
      toast.success("Invite sent"); setUsername(""); onReload();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-3">
      <div className="flex gap-2">
        <Input placeholder="@username to invite" value={username} onChange={(e) => setUsername(e.target.value)} className="bg-background" />
        <Button onClick={invite} disabled={busy || !username.trim()} className="bg-primary text-primary-foreground">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Invite"}
        </Button>
      </div>
    </div>
  );
}

/* ----- Join Requests (Groups admin) ----- */
function JoinRequestsPanel({ space, requests, onReload }: { space: Space; requests: SpaceJoinRequest[]; onReload: () => void }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const decide = async (req: SpaceJoinRequest, accept: boolean) => {
    if (!user) return;
    setBusy(req.id);
    try {
      await decideJoinRequest(req.id, accept, space.id, req.user_id, user.id);
      toast.success(accept ? "Approved" : "Declined");
      onReload();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  };
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="text-sm font-semibold">Join requests</div>
      {requests.length === 0 ? (
        <div className="mt-2 text-xs text-muted-foreground">No pending requests.</div>
      ) : (
        <div className="mt-2 space-y-2">
          {requests.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border/60 p-2">
              <Avatar className="h-8 w-8 bg-primary/20">
                {r.profile?.avatar_url && <AvatarImage src={r.profile.avatar_url} />}
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {(r.profile?.display_name ?? "U").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-xs">
                <div className="font-semibold">{r.profile?.display_name ?? "User"}</div>
                <div className="text-muted-foreground">@{r.profile?.username}</div>
                {r.message && <div className="mt-1 italic">"{r.message}"</div>}
              </div>
              <Button size="sm" disabled={busy === r.id} onClick={() => decide(r, true)} className="h-7 bg-primary text-primary-foreground">Accept</Button>
              <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => decide(r, false)} className="h-7">Decline</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----- Share link (any kind) ----- */
function ShareInvitePanel({ space }: { space: Space }) {
  const url = typeof window !== "undefined" ? `${window.location.origin}/spaces/${space.slug}` : "";
  const copy = async () => { await navigator.clipboard.writeText(url); toast.success("Link copied"); };
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="text-sm font-semibold">Invite link</div>
      <div className="mt-2 flex gap-2">
        <Input value={url} readOnly className="bg-background text-xs" />
        <Button onClick={copy} size="sm" className="bg-primary text-primary-foreground">Copy</Button>
      </div>
    </div>
  );
}

/* ----- Services (Pages) ----- */
function ServicesPanel({ space, services, isAdmin, onReload }: { space: Space; services: SpaceService[]; isAdmin: boolean; onReload: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(""); const [desc, setDesc] = useState("");
  const [price, setPrice] = useState(""); const [url, setUrl] = useState(""); const [img, setImg] = useState("");
  const [busy, setBusy] = useState(false);
  const create = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await createSpaceService({ space_id: space.id, title: title.trim(),
        description: desc || null, price_label: price || null, url: url || null, image_url: img || null });
      setTitle(""); setDesc(""); setPrice(""); setUrl(""); setImg(""); setOpen(false);
      toast.success("Added"); onReload();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-3">
      {isAdmin && (
        <div className="rounded-2xl border border-border/60 bg-card p-3">
          {!open ? (
            <Button size="sm" variant="outline" className="gap-1" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add offering</Button>
          ) : (
            <div className="space-y-2">
              <Input placeholder="Title (e.g. Consultation)" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-background" />
              <Textarea placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} className="bg-background" />
              <Input placeholder="Price label (e.g. $99 / hr)" value={price} onChange={(e) => setPrice(e.target.value)} className="bg-background" />
              <Input placeholder="Link URL" value={url} onChange={(e) => setUrl(e.target.value)} className="bg-background" />
              <Input placeholder="Image URL (optional)" value={img} onChange={(e) => setImg(e.target.value)} className="bg-background" />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
                <Button size="sm" onClick={create} disabled={busy || !title.trim()} className="flex-1 bg-primary text-primary-foreground">Add</Button>
              </div>
            </div>
          )}
        </div>
      )}
      {services.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-6 text-center text-muted-foreground">No offerings yet.</div>
      ) : services.map((s) => (
        <div key={s.id} className="flex gap-3 rounded-2xl border border-border/60 bg-card p-3">
          {s.image_url && <img src={s.image_url} alt="" className="h-16 w-16 rounded-lg object-cover" />}
          <div className="flex-1">
            <div className="font-semibold text-sm">{s.title}</div>
            {s.price_label && <div className="text-xs text-accent">{s.price_label}</div>}
            {s.description && <div className="mt-1 text-xs text-muted-foreground">{s.description}</div>}
            {s.url && <a href={s.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary">Open <ChevronRight className="h-3 w-3" /></a>}
          </div>
          {isAdmin && (
            <button onClick={async () => { await deleteSpaceService(s.id); onReload(); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ----- Insights (Page admin) ----- */
function InsightsPanel({ space }: { space: Space }) {
  const [data, setData] = useState<any>(null);
  const [days, setDays] = useState(7);
  useEffect(() => { getSpaceAnalytics(space.id, days).then(setData).catch(() => setData(null)); }, [space.id, days]);
  if (!data) return <div className="rounded-2xl border border-dashed border-border/60 p-6 text-center text-muted-foreground">Loading insights…</div>;
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {[7, 30, 90].map((d) => (
          <button key={d} onClick={() => setDays(d)}
            className={cn("rounded-lg border px-2.5 py-1 text-xs", days === d ? "border-primary bg-primary/10 text-primary" : "border-border/60")}>
            Last {d}d
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {[
          { label: "Posts", value: data.posts },
          { label: "Comments", value: data.comments },
          { label: "Reactions", value: data.reactions },
          { label: "Views", value: data.views },
          { label: "New followers", value: data.new_members },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border/60 bg-card p-3 text-center">
            <div className="text-lg font-bold text-primary">{s.value ?? 0}</div>
            <div className="text-[10px] uppercase text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
      {Array.isArray(data.top_posts) && data.top_posts.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card p-3">
          <div className="text-xs uppercase text-muted-foreground">Top posts by views</div>
          <div className="mt-2 space-y-2">
            {data.top_posts.map((p: any) => (
              <Link key={p.id} to="/post/$id" params={{ id: p.id }} className="flex items-center justify-between rounded-lg border border-border/60 p-2 text-xs hover:border-primary/40">
                <span className="line-clamp-1">{p.body || "—"}</span>
                <span className="text-primary">{p.views} views</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ----- Albums (Circles) ----- */
function AlbumsPanel({ space, albums, isMember, onReload }: { space: Space; albums: SpaceAlbum[]; isMember: boolean; onReload: () => void }) {
  const { user } = useAuth();
  const [newOpen, setNewOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [active, setActive] = useState<SpaceAlbum | null>(null);

  const create = async () => {
    if (!user || !title.trim()) return;
    try { await createAlbum(space.id, title.trim(), user.id); setTitle(""); setNewOpen(false); toast.success("Album created"); onReload(); }
    catch (e: any) { toast.error(e.message); }
  };

  if (active) return <AlbumDetail album={active} onBack={() => setActive(null)} />;

  return (
    <div className="space-y-3">
      {isMember && (
        <div className="rounded-2xl border border-border/60 bg-card p-3">
          {!newOpen ? (
            <Button size="sm" variant="outline" className="gap-1" onClick={() => setNewOpen(true)}><Plus className="h-4 w-4" /> New album</Button>
          ) : (
            <div className="flex gap-2">
              <Input placeholder="Album name" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-background" />
              <Button size="sm" onClick={create} className="bg-primary text-primary-foreground">Create</Button>
              <Button size="sm" variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
            </div>
          )}
        </div>
      )}
      {albums.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-6 text-center text-muted-foreground">No albums yet.</div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {albums.map((a) => (
            <button key={a.id} onClick={() => setActive(a)} className="overflow-hidden rounded-xl border border-border/60 bg-card text-left">
              <div className="aspect-square bg-muted" style={{ background: a.cover_url ? `url(${a.cover_url}) center/cover` : undefined }}>
                {!a.cover_url && <div className="flex h-full items-center justify-center text-muted-foreground"><Camera className="h-6 w-6" /></div>}
              </div>
              <div className="p-2 text-xs font-semibold line-clamp-1">{a.title}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AlbumDetail({ album, onBack }: { album: SpaceAlbum; onBack: () => void }) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<AlbumPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const load = () => listAlbumPhotos(album.id).then(setPhotos).catch(() => setPhotos([]));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [album.id]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f || !user) return;
    setUploading(true);
    try {
      const url = await uploadToMedia(f, user.id, `albums/${album.id}`);
      await addAlbumPhoto(album.id, url, user.id);
      load();
    } catch (err: any) { toast.error(err.message); } finally { setUploading(false); }
  };

  return (
    <div className="space-y-3">
      <button onClick={onBack} className="text-xs text-primary">← Back to albums</button>
      <div className="flex items-center justify-between">
        <div className="font-semibold">{album.title}</div>
        <label className="flex cursor-pointer items-center gap-1 rounded-lg border border-border/60 px-2 py-1 text-xs hover:border-primary/40">
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Add photo
          <input type="file" accept="image/*" hidden onChange={onFile} disabled={uploading} />
        </label>
      </div>
      {photos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-6 text-center text-muted-foreground">No photos yet.</div>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {photos.map((p) => (
            <div key={p.id} className="group relative aspect-square overflow-hidden rounded-md bg-muted">
              <img src={p.url} alt={p.caption ?? ""} className="h-full w-full object-cover" />
              {user?.id === p.uploaded_by && (
                <button onClick={async () => { await removeAlbumPhoto(p.id); load(); }}
                  className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
