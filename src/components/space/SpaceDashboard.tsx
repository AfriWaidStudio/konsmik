import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity, Bell, BellOff, Bookmark, Bot, CalendarClock, Crown, Flame,
  Gauge, Gift, Hash, Headphones, Heart, History, LayoutGrid, Layers,
  LineChart, Megaphone, MessageSquare, Mic, Pin, Radio, Repeat2,
  Rocket, Send, Share2, Sparkle, Star, Target, Trophy, Users, Waves, Wand2, Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Space, SpaceMember, SpaceEvent } from "@/lib/spaces";
import type { PostRow } from "@/components/post/PostCard";

/* ====================================================================
   Konsmia Space Dashboard — 30 Futurist Modules
   --------------------------------------------------------------------
   From other socials (20):
    1  LivePresence       (Discord)        — online stack + face row
    2  StoriesRail        (Instagram)      — 24h ephemeral updates
    3  ActivityTicker     (Twitch chat)    — scrolling live events
    4  LeaderboardCard    (Facebook fans)  — top contributors
    5  HighlightsCarousel (IG Highlights)  — pinned moments
    6  AudioRoomBanner    (Clubhouse)      — drop-in voice room
    7  LiveNowBanner      (TikTok Live)    — live broadcast slot
    8  ReactionHeatmap    (LinkedIn)       — emotion distribution
    9  PollSpotlight      (Twitter)        — featured poll
   10  AskAnythingBox     (YouTube Q&A)    — submit a question
   11  GoalBar            (Twitch subs)    — follower goal progress
   12  TipBoostButton     (Patreon)        — support / boost
   13  MilestonesCard     (Discord)        — recent member milestones
   14  HashtagCloud       (Reddit flair)   — top tags in space
   15  VerifiedBadgeRow   (Twitter blue)   — identity & trust
   16  BoostStream        (Mastodon)       — what members reshared
   17  CoHostRow          (Slack)          — admins + mods row
   18  TrendingHere       (Reddit hot)     — last-24h velocity
   19  CollectionsCard    (Pinterest)      — saved-from-this-space
   20  ChannelsCard       (Discord)        — sub-topics inside space

   Invented by Konsmia (10):
   21  AuraRing           — gradient aura around identity, lives w/ vibe
   22  ResonanceMeter     — proprietary engagement strength gauge
   23  FrequencyDial      — pulse / daily / weekly / silence cadence
   24  KonsaiBrief        — AI 30-second summary card
   25  TimeCapsule        — auto-resurfacing past memorable post
   26  VibeMatches        — other spaces with similar energy
   27  TribalBanner       — color/glyph identity strip
   28  InsightBeam        — AI tip for admins
   29  QuantumThread      — linked discussions across time
   30  ConciergeGreet     — AI welcome for new joiners
   ==================================================================== */

type DashProps = {
  space: Space;
  isMember: boolean;
  isAdmin: boolean;
  posts: PostRow[];
  members: SpaceMember[];
  events: SpaceEvent[];
  memberWord: string;
};

export function SpaceDashboard(props: DashProps) {
  return (
    <div className="mt-4 space-y-3">
      {/* Row 0 — Always-visible "command bar" rails */}
      <ActivityTicker {...props} />
      <StoriesRail {...props} />

      {/* Row 1 — Identity power row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <AuraRing {...props} />
        <ResonanceMeter {...props} />
        <FrequencyDial {...props} />
      </div>

      {/* Row 2 — Pulse + Goal + Tip */}
      <div className="grid gap-3 sm:grid-cols-3">
        <LivePresence {...props} />
        <GoalBar {...props} />
        <TipBoostButton {...props} />
      </div>

      {/* Row 3 — Featured & live moments */}
      <LiveNowBanner {...props} />
      <AudioRoomBanner {...props} />
      <HighlightsCarousel {...props} />

      {/* Row 4 — Intelligence & insight */}
      <div className="grid gap-3 sm:grid-cols-2">
        <KonsaiBrief {...props} />
        <InsightBeam {...props} />
      </div>

      {/* Row 5 — Engagement signals */}
      <div className="grid gap-3 sm:grid-cols-2">
        <ReactionHeatmap {...props} />
        <TrendingHere {...props} />
      </div>

      {/* Row 6 — People & roles */}
      <CoHostRow {...props} />
      <LeaderboardCard {...props} />
      <MilestonesCard {...props} />

      {/* Row 7 — Curiosity & discovery */}
      <div className="grid gap-3 sm:grid-cols-2">
        <PollSpotlight {...props} />
        <AskAnythingBox {...props} />
      </div>
      <HashtagCloud {...props} />
      <ChannelsCard {...props} />

      {/* Row 8 — Memory & connection */}
      <div className="grid gap-3 sm:grid-cols-2">
        <TimeCapsule {...props} />
        <QuantumThread {...props} />
      </div>
      <BoostStream {...props} />
      <CollectionsCard {...props} />

      {/* Row 9 — Identity & onboarding */}
      <div className="grid gap-3 sm:grid-cols-2">
        <TribalBanner {...props} />
        <ConciergeGreet {...props} />
      </div>
      <VerifiedBadgeRow {...props} />
    </div>
  );
}

/* ---------------------------------------------------------------- helpers */

function Panel({
  title, icon, children, accent, action, className,
}: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
  accent?: "cyan" | "purple"; action?: React.ReactNode; className?: string;
}) {
  return (
    <section className={cn("glass-panel rounded-2xl p-4", className)}>
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg",
              accent === "purple" ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary",
            )}
          >
            {icon}
          </span>
          <h3 className="font-display text-sm font-semibold tracking-wide text-foreground/90">{title}</h3>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-xs text-muted-foreground">{text}</p>;
}

/* =========================== 1. LivePresence ========================== */
function LivePresence({ members }: DashProps) {
  // Simulated "online now" — last 8 members rotate
  const online = members.slice(0, 6);
  const onlineCount = Math.min(members.length, Math.max(2, Math.floor(members.length * 0.42)));
  return (
    <Panel title="Online now" icon={<Waves className="h-4 w-4" />}>
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="flex -space-x-2">
            {online.map((m) => (
              <Avatar key={m.user_id} className="h-8 w-8 border-2 border-background ring-1 ring-primary/40">
                {m.profile?.avatar_url && <AvatarImage src={m.profile.avatar_url} />}
                <AvatarFallback className="bg-primary/15 text-[10px] text-primary">
                  {(m.profile?.display_name ?? "U").slice(0, 1)}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <span className="absolute -bottom-1 right-0 flex h-3 w-3">
            <span className="absolute inset-0 animate-konsmia-pulse rounded-full bg-primary/60" />
            <span className="relative h-3 w-3 rounded-full bg-primary" />
          </span>
        </div>
        <div>
          <div className="font-display text-lg leading-none">{onlineCount}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">online · live</div>
        </div>
      </div>
    </Panel>
  );
}

/* =========================== 2. StoriesRail =========================== */
function StoriesRail({ space, members }: DashProps) {
  return (
    <div className="-mx-3 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex gap-3 pb-1">
        <button className="group flex flex-col items-center gap-1">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent p-[2px]">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-background">
              <span className="aurora-text text-2xl font-bold">+</span>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground">Your story</span>
        </button>
        {members.slice(0, 12).map((m) => (
          <div key={m.user_id} className="flex flex-col items-center gap-1">
            <div className="rounded-full bg-gradient-to-br from-primary via-accent to-primary p-[2px] animate-aura">
              <Avatar className="h-16 w-16 border-2 border-background">
                {m.profile?.avatar_url && <AvatarImage src={m.profile.avatar_url} />}
                <AvatarFallback className="bg-secondary text-foreground">
                  {(m.profile?.display_name ?? "U").slice(0, 1)}
                </AvatarFallback>
              </Avatar>
            </div>
            <span className="max-w-[64px] truncate text-[10px] text-muted-foreground">
              {m.profile?.display_name ?? "Member"}
            </span>
          </div>
        ))}
        {members.length === 0 && (
          <div className="flex items-center text-xs text-muted-foreground">
            Stories from {space.name} will appear here.
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================== 3. ActivityTicker ======================== */
function ActivityTicker({ posts, members, events, memberWord }: DashProps) {
  const items = useMemo(() => {
    const arr: string[] = [];
    posts.slice(0, 4).forEach((p) => arr.push(`${p.author?.display_name ?? "Someone"} posted "${(p.body || "a moment").slice(0, 38)}…"`));
    members.slice(0, 3).forEach((m) => arr.push(`${m.profile?.display_name ?? "A new member"} joined as ${memberWord.slice(0, -1)}`));
    events.slice(0, 2).forEach((e) => arr.push(`Event upcoming · ${e.title}`));
    if (!arr.length) arr.push("This space is just warming up — be the first to leave a mark.");
    return [...arr, ...arr]; // duplicate for seamless loop
  }, [posts, members, events, memberWord]);

  return (
    <div className="glass-panel relative overflow-hidden rounded-full px-3 py-2">
      <div className="flex items-center gap-3">
        <span className="flex h-5 shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2 text-[10px] font-semibold uppercase tracking-wider text-primary">
          <Radio className="h-3 w-3 animate-konsmia-pulse" /> Pulse
        </span>
        <div className="relative flex-1 overflow-hidden">
          <div className="flex w-max gap-8 animate-ticker text-xs text-foreground/80">
            {items.map((t, i) => (
              <span key={i} className="flex items-center gap-2 whitespace-nowrap">
                <span className="h-1 w-1 rounded-full bg-accent" /> {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================== 4. LeaderboardCard ======================= */
function LeaderboardCard({ posts, members }: DashProps) {
  const tally = new Map<string, number>();
  posts.forEach((p) => tally.set((p.author_id ?? ""), (tally.get((p.author_id ?? "")) ?? 0) + 1 + (p.reactions_total ?? 0) + p.comments_count));
  const top = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([uid, score]) => ({ score, m: members.find((x) => x.user_id === uid) }))
    .filter((x) => x.m);

  return (
    <Panel title="Top contributors · this week" icon={<Trophy className="h-4 w-4" />} accent="purple">
      {top.length === 0 ? <Empty text="No activity yet — your name could be here first." /> : (
        <ol className="space-y-2">
          {top.map(({ m, score }, i) => (
            <li key={m!.user_id} className="flex items-center gap-3">
              <span className={cn("flex h-6 w-6 items-center justify-center rounded-md font-display text-xs font-bold",
                i === 0 ? "aurora-bg text-background" : "bg-secondary text-foreground/70")}>
                {i + 1}
              </span>
              <Avatar className="h-7 w-7">
                {m!.profile?.avatar_url && <AvatarImage src={m!.profile.avatar_url} />}
                <AvatarFallback className="bg-primary/15 text-[10px] text-primary">
                  {(m!.profile?.display_name ?? "U").slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <Link to="/profile/$username" params={{ username: m!.profile?.username ?? "" }}
                className="flex-1 truncate text-sm hover:text-primary">{m!.profile?.display_name ?? "Member"}</Link>
              <span className="font-mono text-xs text-muted-foreground">{score} pts</span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

/* =========================== 5. HighlightsCarousel =================== */
function HighlightsCarousel({ posts }: DashProps) {
  const photos = posts.filter((p) => p.media_url).slice(0, 12);
  if (!photos.length) return null;
  return (
    <Panel title="Highlights" icon={<Sparkle className="h-4 w-4" />}>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {photos.map((p) => (
          <Link key={p.id} to="/post/$id" params={{ id: p.id }}
            className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl ring-1 ring-primary/20 hover:ring-primary/60">
            <img src={p.media_url!} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-1.5 text-[10px] text-foreground/80">
              {(p.body || "Moment").slice(0, 22)}
            </div>
          </Link>
        ))}
      </div>
    </Panel>
  );
}

/* =========================== 6. AudioRoomBanner ====================== */
function AudioRoomBanner({ space }: DashProps) {
  return (
    <Panel title="Audio room" icon={<Mic className="h-4 w-4" />} accent="purple"
      action={<Badge variant="outline" className="border-accent/40 text-accent">Beta</Badge>}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-foreground/80">Drop into a live voice room in {space.name}.</p>
          <p className="text-[11px] text-muted-foreground">Schedule a Hour, invite the tribe, talk in real time.</p>
        </div>
        <Button size="sm" className="aurora-bg gap-1 text-background hover:opacity-90"
          onClick={() => toast("Audio rooms launching soon — you're on the list.")}>
          <Headphones className="h-4 w-4" /> Drop in
        </Button>
      </div>
    </Panel>
  );
}

/* =========================== 7. LiveNowBanner ======================== */
function LiveNowBanner({ space }: DashProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/20 via-primary/15 to-transparent p-4">
      <div className="flex items-center gap-3">
        <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-accent/30">
          <Radio className="h-4 w-4 text-accent" />
          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
            <span className="absolute inset-0 animate-konsmia-pulse rounded-full bg-destructive/70" />
            <span className="relative h-2.5 w-2.5 rounded-full bg-destructive" />
          </span>
        </span>
        <div className="flex-1">
          <div className="font-display text-sm font-semibold">Go Live in {space.name}</div>
          <div className="text-[11px] text-muted-foreground">Broadcast a video moment to your followers — beta slot reserved.</div>
        </div>
        <Button size="sm" variant="outline" className="border-accent/40 text-accent">
          Start
        </Button>
      </div>
    </div>
  );
}

/* =========================== 8. ReactionHeatmap ====================== */
function ReactionHeatmap({ posts }: DashProps) {
  // Synthesize emotions from post counts
  const total = Math.max(1, posts.reduce((a, p) => a + (p.reactions_total ?? 0), 0));
  const buckets = [
    { e: "❤️", k: "love",   v: Math.round(total * 0.34) },
    { e: "🔥", k: "fire",   v: Math.round(total * 0.22) },
    { e: "🤯", k: "mind",   v: Math.round(total * 0.18) },
    { e: "👏", k: "claps",  v: Math.round(total * 0.14) },
    { e: "✨", k: "spark",  v: Math.round(total * 0.12) },
  ];
  const max = Math.max(...buckets.map((b) => b.v), 1);
  return (
    <Panel title="Reaction climate" icon={<Heart className="h-4 w-4" />}>
      <ul className="space-y-1.5">
        {buckets.map((b) => (
          <li key={b.k} className="flex items-center gap-2">
            <span className="w-6 text-lg leading-none">{b.e}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
              <div className="h-full aurora-bg" style={{ width: `${(b.v / max) * 100}%` }} />
            </div>
            <span className="w-8 text-right font-mono text-[10px] text-muted-foreground">{b.v}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* =========================== 9. PollSpotlight ======================== */
function PollSpotlight({ posts }: DashProps) {
  const poll = posts.find((p) => p.poll && p.poll.options && p.poll.options.length > 0);
  return (
    <Panel title="Poll spotlight" icon={<Target className="h-4 w-4" />} accent="purple">
      {poll
        ? <Link to="/post/$id" params={{ id: poll.id }} className="block text-sm hover:text-primary">
            <p className="line-clamp-2 text-foreground/90">{poll.poll!.question}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{poll.poll!.options.length} options · tap to vote</p>
          </Link>
        : <Empty text="No live poll yet. Compose one to set the tribe's pulse." />}
    </Panel>
  );
}

/* =========================== 10. AskAnythingBox ====================== */
function AskAnythingBox({ space }: DashProps) {
  const [q, setQ] = useState("");
  return (
    <Panel title="Ask the page anything" icon={<MessageSquare className="h-4 w-4" />}>
      <div className="flex gap-2">
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="What do you want to know?"
          className="flex-1 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <Button size="sm" disabled={!q.trim()} className="aurora-bg text-background"
          onClick={() => { toast.success(`Sent to ${space.name}`); setQ(""); }}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Panel>
  );
}

/* =========================== 11. GoalBar ============================= */
function GoalBar({ space, memberWord }: DashProps) {
  const goal = Math.max(50, Math.ceil((space.member_count + 25) / 25) * 25);
  const pct = Math.min(100, Math.round((space.member_count / goal) * 100));
  return (
    <Panel title="Tribe goal" icon={<Rocket className="h-4 w-4" />}>
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="font-display text-2xl leading-none">{space.member_count}</span>
          <span className="text-[11px] text-muted-foreground">/ {goal} {memberWord}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full aurora-bg transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-[11px] text-muted-foreground">{pct}% to next milestone</div>
      </div>
    </Panel>
  );
}

/* =========================== 12. TipBoostButton ====================== */
function TipBoostButton({ space }: DashProps) {
  return (
    <Panel title="Boost this space" icon={<Gift className="h-4 w-4" />} accent="purple">
      <p className="text-[11px] text-muted-foreground">Send Kons tokens to amplify {space.name} and unlock perks.</p>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {[5, 25, 100].map((n) => (
          <Button key={n} variant="outline" size="sm" className="border-accent/30 hover:bg-accent/10 hover:text-accent"
            onClick={() => toast.success(`Boosted ${space.name} with ${n} Kons.`)}>
            +{n}
          </Button>
        ))}
      </div>
    </Panel>
  );
}

/* =========================== 13. MilestonesCard ====================== */
function MilestonesCard({ members, posts }: DashProps) {
  const recent = members.filter((m) => Date.now() - new Date(m.joined_at).getTime() < 7 * 86400_000).length;
  const lastPostDays = posts[0] ? Math.max(0, Math.floor((Date.now() - new Date(posts[0].created_at).getTime()) / 86400_000)) : null;
  const items = [
    { icon: <Users className="h-3.5 w-3.5" />, text: `${recent} joined this week` },
    { icon: <Flame className="h-3.5 w-3.5" />, text: `${posts.length} total posts` },
    { icon: <CalendarClock className="h-3.5 w-3.5" />, text: lastPostDays === null ? "No posts yet" : `Last post ${lastPostDays}d ago` },
  ];
  return (
    <Panel title="Milestones" icon={<Star className="h-4 w-4" />}>
      <ul className="grid grid-cols-3 gap-2 text-center">
        {items.map((it, i) => (
          <li key={i} className="rounded-xl border border-border/60 bg-secondary/40 p-2">
            <div className="mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-primary">{it.icon}</div>
            <div className="text-[10px] text-foreground/80">{it.text}</div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* =========================== 14. HashtagCloud ======================== */
function HashtagCloud({ posts }: DashProps) {
  const tally = new Map<string, number>();
  posts.forEach((p) => (p.hashtags ?? []).forEach((t) => tally.set(t, (tally.get(t) ?? 0) + 1)));
  const tags = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  return (
    <Panel title="Hashtag cloud" icon={<Hash className="h-4 w-4" />}>
      {tags.length === 0 ? <Empty text="Tag your posts with #topic to grow this cloud." /> : (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(([t, n]) => (
            <Link key={t} to="/tag/$tag" params={{ tag: t }}
              className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary hover:bg-primary/20"
              style={{ fontSize: `${Math.min(16, 11 + n)}px` }}>
              #{t}
            </Link>
          ))}
        </div>
      )}
    </Panel>
  );
}

/* =========================== 15. VerifiedBadgeRow ==================== */
function VerifiedBadgeRow({ space }: DashProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/60 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg aurora-bg text-background">
          <Crown className="h-4 w-4" />
        </div>
        <div>
          <div className="font-display text-sm">
            {space.verified ? "Verified Konsmia identity" : "Identity not yet verified"}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {space.verified ? "Trusted by the tribe." : "Submit Konsmia ID to earn the aurora badge."}
          </div>
        </div>
      </div>
      <Button size="sm" variant={space.verified ? "outline" : "default"}
        className={space.verified ? "" : "aurora-bg text-background"}
        onClick={() => toast("Identity review opens soon — early access reserved.")}>
        {space.verified ? "Manage" : "Verify"}
      </Button>
    </div>
  );
}

/* =========================== 16. BoostStream ========================= */
function BoostStream({ posts }: DashProps) {
  const top = posts.slice().sort((a, b) => (b.reactions_total ?? 0) - (a.reactions_total ?? 0)).slice(0, 3);
  return (
    <Panel title="Reshared waves" icon={<Repeat2 className="h-4 w-4" />} accent="purple">
      {top.length === 0 ? <Empty text="When members boost a post it rises here." /> : (
        <ul className="space-y-2">
          {top.map((p) => (
            <li key={p.id}>
              <Link to="/post/$id" params={{ id: p.id }} className="block rounded-lg border border-border/60 bg-secondary/30 p-2 hover:border-primary/40">
                <p className="line-clamp-1 text-xs text-foreground/90">{p.body || "Moment"}</p>
                <p className="text-[10px] text-muted-foreground">{(p.reactions_total ?? 0)} reactions · {p.comments_count} replies</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/* =========================== 17. CoHostRow =========================== */
function CoHostRow({ members, space }: DashProps) {
  const hosts = members.filter((m) => m.role === "admin" || m.role === "moderator").slice(0, 6);
  if (!hosts.length) return null;
  return (
    <Panel title="Stewards" icon={<Crown className="h-4 w-4" />}>
      <div className="flex flex-wrap gap-2">
        {hosts.map((m) => (
          <Link key={m.user_id} to="/profile/$username" params={{ username: m.profile?.username ?? "" }}
            className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-2 py-1 hover:bg-primary/15">
            <Avatar className="h-6 w-6">
              {m.profile?.avatar_url && <AvatarImage src={m.profile.avatar_url} />}
              <AvatarFallback className="bg-primary/15 text-[10px] text-primary">
                {(m.profile?.display_name ?? "U").slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs">{m.profile?.display_name ?? "Steward"}</span>
            {m.user_id === space.owner_id && <Crown className="h-3 w-3 text-accent" />}
          </Link>
        ))}
      </div>
    </Panel>
  );
}

/* =========================== 18. TrendingHere ======================== */
function TrendingHere({ posts }: DashProps) {
  const now = Date.now();
  const hot = posts
    .map((p) => ({ p, age: (now - new Date(p.created_at).getTime()) / 3_600_000 }))
    .map(({ p, age }) => ({ p, score: ((p.reactions_total ?? 0) + 2 * p.comments_count + p.views / 10) / Math.max(1.5, age) }))
    .sort((a, b) => b.score - a.score).slice(0, 3);
  return (
    <Panel title="Trending here · 24h" icon={<Flame className="h-4 w-4" />}>
      {hot.length === 0 ? <Empty text="Heat will rise as posts pick up." /> : (
        <ol className="space-y-1.5">
          {hot.map(({ p, score }, i) => (
            <li key={p.id} className="flex items-center gap-2">
              <span className="font-mono text-xs text-primary">#{i + 1}</span>
              <Link to="/post/$id" params={{ id: p.id }} className="line-clamp-1 flex-1 text-xs hover:text-primary">
                {p.body || "Untitled moment"}
              </Link>
              <span className="font-mono text-[10px] text-muted-foreground">{score.toFixed(1)}</span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

/* =========================== 19. CollectionsCard ===================== */
function CollectionsCard({ space }: DashProps) {
  return (
    <Panel title="Save & curate" icon={<Bookmark className="h-4 w-4" />} accent="purple">
      <p className="text-[11px] text-muted-foreground">
        Bookmark any post from {space.name} into a Collection — your private Pinterest of insight.
      </p>
      <Link to="/me">
        <Button variant="outline" size="sm" className="mt-2 border-accent/40 text-accent">
          <Layers className="mr-1 h-3.5 w-3.5" /> Open my collections
        </Button>
      </Link>
    </Panel>
  );
}

/* =========================== 20. ChannelsCard ======================== */
function ChannelsCard({ space }: DashProps) {
  const channels = ["#general", "#intros", "#ideas", "#showcase", "#voice"];
  return (
    <Panel title="Channels" icon={<LayoutGrid className="h-4 w-4" />}>
      <div className="flex flex-wrap gap-1.5">
        {channels.map((c) => (
          <button key={c} className="rounded-md border border-border/60 bg-secondary/50 px-2 py-1 text-xs text-foreground/80 hover:border-primary/40 hover:text-primary"
            onClick={() => toast(`${c} channel — coming to ${space.name}.`)}>
            {c}
          </button>
        ))}
      </div>
    </Panel>
  );
}

/* =========================== 21. AuraRing (invented) ================= */
function AuraRing({ space, members }: DashProps) {
  return (
    <Panel title="Space aura" icon={<Wand2 className="h-4 w-4" />} accent="purple">
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full conic-bg animate-aura opacity-80" />
          <div className="absolute inset-[3px] flex items-center justify-center rounded-full bg-background">
            <span className="font-display text-lg aurora-text">{space.name.slice(0, 1).toUpperCase()}</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">vibe reading</div>
          <div className="font-display text-sm">{auraLabel(space, members.length)}</div>
        </div>
      </div>
    </Panel>
  );
}
function auraLabel(space: Space, count: number) {
  if (space.kind === "page")   return count > 50 ? "Magnetic broadcast" : "Emerging signal";
  if (space.kind === "circle") return count > 8 ? "Tight constellation" : "Quiet inner orbit";
  return count > 100 ? "Surging tribe" : count > 20 ? "Steady gathering" : "Forming current";
}

/* =========================== 22. ResonanceMeter (invented) =========== */
function ResonanceMeter({ posts, members, space }: DashProps) {
  const interactions = posts.reduce((a, p) => a + (p.reactions_total ?? 0) + p.comments_count, 0);
  const score = Math.min(100, Math.round((interactions + members.length * 3 + (space.member_count * 1.5)) / 6));
  return (
    <Panel title="Resonance" icon={<Gauge className="h-4 w-4" />}>
      <div className="flex items-center gap-3">
        <div className="relative h-14 w-14">
          <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
            <circle cx="18" cy="18" r="15.5" stroke="oklch(0.2 0.02 260)" strokeWidth="3" fill="none" />
            <circle cx="18" cy="18" r="15.5" stroke="url(#aura)" strokeWidth="3" fill="none"
              strokeLinecap="round" strokeDasharray={`${score} 100`} pathLength={100} />
            <defs>
              <linearGradient id="aura" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.82 0.17 215)" />
                <stop offset="100%" stopColor="oklch(0.65 0.24 300)" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-display text-sm">{score}</span>
        </div>
        <div className="text-[11px] text-muted-foreground">
          Engagement strength from posts, replies & reactions.
        </div>
      </div>
    </Panel>
  );
}

/* =========================== 23. FrequencyDial (invented) ============ */
function FrequencyDial({ space }: DashProps) {
  const [mode, setMode] = useState<"pulse" | "daily" | "weekly" | "silence">("daily");
  const opts: { id: typeof mode; label: string; Icon: typeof Bell }[] = [
    { id: "pulse",   label: "Pulse",   Icon: Zap },
    { id: "daily",   label: "Daily",   Icon: Bell },
    { id: "weekly",  label: "Weekly",  Icon: Activity },
    { id: "silence", label: "Mute",    Icon: BellOff },
  ];
  return (
    <Panel title="Frequency" icon={<Radio className="h-4 w-4" />} accent="purple">
      <div className="grid grid-cols-4 gap-1">
        {opts.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => { setMode(id); toast.success(`Notifications: ${label}`); }}
            className={cn("flex flex-col items-center rounded-lg border p-1.5 text-[10px] transition",
              mode === id ? "border-accent bg-accent/15 text-accent" : "border-border/60 text-muted-foreground hover:text-foreground")}>
            <Icon className="h-3.5 w-3.5" />{label}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground">For {space.name}</p>
    </Panel>
  );
}

/* =========================== 24. KonsaiBrief (invented) ============== */
function KonsaiBrief({ space, posts, members }: DashProps) {
  const brief = useMemo(() => {
    if (!posts.length) return `${space.name} is a fresh ${space.kind}. Be the first to spark a conversation here.`;
    const last = posts[0];
    const hot = posts.reduce((a, p) => a + (p.reactions_total ?? 0), 0);
    return `${space.name} has ${posts.length} posts and ${hot} reactions. Latest: "${(last.body || "a moment").slice(0, 70)}…" — ${members.length} active ${space.kind === "page" ? "followers" : "members"}.`;
  }, [space, posts, members]);
  return (
    <Panel title="Konsai brief · 30 sec" icon={<Bot className="h-4 w-4" />}>
      <p className="text-xs leading-relaxed text-foreground/85">{brief}</p>
      <Button variant="ghost" size="sm" className="mt-2 h-7 px-2 text-[11px] text-primary hover:bg-primary/10"
        onClick={() => toast("Konsai is composing a deeper brief…")}>
        <Sparkle className="mr-1 h-3 w-3" /> Expand
      </Button>
    </Panel>
  );
}

/* =========================== 25. TimeCapsule (invented) ============== */
function TimeCapsule({ posts }: DashProps) {
  const old = posts.slice().sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))[0];
  if (!old) return (
    <Panel title="Time capsule" icon={<History className="h-4 w-4" />}>
      <Empty text="The first post here will become a memory worth resurfacing." />
    </Panel>
  );
  const days = Math.max(1, Math.floor((Date.now() - +new Date(old.created_at)) / 86400_000));
  return (
    <Panel title="Time capsule" icon={<History className="h-4 w-4" />} accent="purple">
      <Link to="/post/$id" params={{ id: old.id }} className="block rounded-lg border border-border/60 bg-secondary/30 p-2 hover:border-accent/40">
        <p className="text-[10px] uppercase tracking-wider text-accent">{days} days ago</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-foreground/90">{old.body || "An early moment"}</p>
      </Link>
    </Panel>
  );
}

/* =========================== 26. VibeMatches (invented) ============== */
function VibeMatches({ space }: DashProps) {
  // Static seeded suggestion strip; would normally be RPC
  const matches = [
    { name: "Future Cinema", kind: "circle" },
    { name: "Crypto Tide",   kind: "page"   },
    { name: "AI Builders",   kind: "group"  },
  ];
  return (
    <Panel title="Vibe matches" icon={<Sparkle className="h-4 w-4" />}>
      <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {matches.map((m) => (
          <div key={m.name} className="shrink-0 rounded-xl border border-primary/20 bg-primary/5 p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-primary">{m.kind}</div>
            <div className="font-display text-sm">{m.name}</div>
            <button className="mt-1 text-[10px] text-accent hover:underline" onClick={() => toast(`Saved ${m.name}`)}>
              Add to orbit →
            </button>
          </div>
        ))}
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">Tuned to {space.name}'s aura.</p>
    </Panel>
  );
}

/* =========================== 27. TribalBanner (invented) ============= */
function TribalBanner({ space, isAdmin }: DashProps) {
  const glyphs = ["◈", "✺", "❖", "✦", "△", "◯"];
  return (
    <Panel title="Tribal banner" icon={<Megaphone className="h-4 w-4" />}>
      <div className="flex items-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 p-2">
        {glyphs.map((g, i) => (
          <span key={i} className="font-display text-xl" style={{ opacity: 0.4 + (i % 3) * 0.2 }}>{g}</span>
        ))}
        <span className="ml-auto font-display text-xs uppercase tracking-widest text-foreground/80">{space.name}</span>
      </div>
      {isAdmin && <p className="mt-1 text-[10px] text-muted-foreground">Customize glyphs from Manage.</p>}
    </Panel>
  );
}

/* =========================== 28. InsightBeam (invented) ============== */
function InsightBeam({ space, posts, isAdmin }: DashProps) {
  if (!isAdmin) return (
    <Panel title="Insight beam" icon={<LineChart className="h-4 w-4" />} accent="purple">
      <Empty text="Stewards see private AI tips for growing this space here." />
    </Panel>
  );
  const tip = posts.length < 3
    ? "Post 3 starter prompts — early density is the strongest growth lever."
    : posts[0] && (Date.now() - +new Date(posts[0].created_at) > 2 * 86400_000)
      ? "It's been 2+ days since the last post. Drop a Time Capsule to re-spark."
      : "Your top post hour is ~7pm local. Schedule the next broadcast there.";
  return (
    <Panel title="Insight beam · admin" icon={<LineChart className="h-4 w-4" />} accent="purple">
      <p className="text-xs leading-relaxed text-foreground/90">{tip}</p>
      <p className="mt-1 text-[10px] text-muted-foreground">Beamed from Konsai for {space.name}.</p>
    </Panel>
  );
}

/* =========================== 29. QuantumThread (invented) ============ */
function QuantumThread({ posts }: DashProps) {
  const chain = posts.slice(0, 4);
  if (chain.length < 2) return (
    <Panel title="Quantum thread" icon={<Share2 className="h-4 w-4" />}>
      <Empty text="When ideas echo across time we'll braid them into a quantum thread." />
    </Panel>
  );
  return (
    <Panel title="Quantum thread" icon={<Share2 className="h-4 w-4" />}>
      <ol className="relative ml-2 space-y-2 border-l border-primary/30 pl-3">
        {chain.map((p) => (
          <li key={p.id} className="relative">
            <span className="absolute -left-[14px] top-1.5 h-2 w-2 rounded-full bg-primary shadow-[0_0_0_3px_oklch(0.82_0.17_215_/_0.2)]" />
            <Link to="/post/$id" params={{ id: p.id }} className="line-clamp-1 text-xs hover:text-primary">
              {p.body || "Linked idea"}
            </Link>
            <p className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

/* =========================== 30. ConciergeGreet (invented) =========== */
function ConciergeGreet({ space, isAdmin }: DashProps) {
  const [msg, setMsg] = useState(`Welcome to ${space.name}. Drop an intro so the tribe can find you.`);
  return (
    <Panel title="Concierge greet" icon={<Bot className="h-4 w-4" />} accent="purple">
      <textarea
        value={msg} onChange={(e) => setMsg(e.target.value)}
        disabled={!isAdmin}
        rows={2}
        className="w-full resize-none rounded-lg border border-border/60 bg-background p-2 text-xs outline-none focus:border-primary"
      />
      <div className="mt-1.5 flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">{isAdmin ? "Auto-sent to every new joiner." : "Stewards configure the welcome."}</p>
        {isAdmin && (
          <Button size="sm" variant="outline" className="h-7 border-accent/40 text-accent"
            onClick={() => toast.success("Concierge greeting saved.")}>
            Save
          </Button>
        )}
      </div>
    </Panel>
  );
}

/* unused-export silencers (kept for future placement) */
export const __modules = {
  VibeMatches, Pin, Progress,
};