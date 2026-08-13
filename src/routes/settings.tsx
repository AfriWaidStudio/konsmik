import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Settings as SettingsIcon, User, Bell, Lock, Palette, Shield, LogOut, Camera, Loader2, Trash2, KeyRound } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fetchFeedPrefs, saveFeedPrefs, fetchFollowedTags, toggleFollowTag, DEFAULT_PREFS, type FeedPrefs } from "@/lib/feed-prefs";
import {
  INTERESTS, fetchSettings, saveSettings, DEFAULT_SETTINGS, type UserSettings,
  uploadProfileImage, updateProfile, fetchMuted, fetchBlocked, unmuteUser, unblockUser,
} from "@/lib/social";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Konsmia" },
      { name: "description", content: "Manage your Konsmia profile, privacy, notifications and security." },
      { property: "og:title", content: "Settings — Konsmia" },
      { property: "og:description", content: "Manage your Konsmia profile, privacy, notifications and security." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const nav = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "cover" | null>(null);
  const [prefs, setPrefs] = useState<FeedPrefs>(DEFAULT_PREFS);
  const [muted, setMuted] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [mutedUsers, setMutedUsers] = useState<any[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? "");
    setTitle(profile.title ?? "");
    setBio(profile.bio ?? "");
    setLocation((profile as any).location ?? "");
    setWebsite((profile as any).website ?? "");
    setInterests(((profile as any).interests as string[]) ?? []);
  }, [profile?.id]);

  useEffect(() => {
    if (!user) return;
    fetchFeedPrefs(user.id).then((p) => { setPrefs(p); setMuted(p.muted_words.join(", ")); });
    fetchFollowedTags(user.id).then(setTags);
    fetchSettings(user.id).then(setSettings);
    fetchMuted(user.id).then(setMutedUsers);
    fetchBlocked(user.id).then(setBlockedUsers);
  }, [user?.id]);

  const savePrefs = async (next: Partial<FeedPrefs>) => {
    if (!user) return;
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    try { await saveFeedPrefs(user.id, merged); toast.success("Feed settings saved"); }
    catch (e: any) { toast.error(e.message ?? "Could not save"); }
  };

  const setSetting = async (next: Partial<UserSettings>) => {
    if (!user) return;
    const merged = { ...settings, ...next };
    setSettings(merged);
    try { await saveSettings(user.id, merged); } catch (e: any) { toast.error(e.message ?? "Could not save"); }
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.id, { display_name: displayName, title, bio, location, website, interests });
      await refreshProfile();
      toast.success("Profile updated");
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const onImage = (kind: "avatar" | "cover") => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    setUploading(kind);
    try { await uploadProfileImage(file, user.id, kind); await refreshProfile(); toast.success("Photo updated"); }
    catch (err: any) { toast.error(err.message ?? "Upload failed"); }
    finally { setUploading(null); }
  };

  const changePassword = async () => {
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return toast.error(error.message);
    setNewPassword("");
    toast.success("Password updated");
  };

  const deleteAccount = async () => {
    if (!user) return;
    if (!confirm("This permanently deletes your profile, posts and messages. Continue?")) return;
    const { error } = await supabase.from("profiles").delete().eq("id", user.id);
    if (error) return toast.error(error.message);
    await signOut();
    nav({ to: "/" });
    toast.success("Your account data has been deleted");
  };

  if (!user) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-border/60 bg-card p-6 text-center">
          <p className="text-foreground/80">Sign in to manage settings.</p>
          <Link to="/login" className="mt-3 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Sign in</Link>
        </div>
      </AppShell>
    );
  }

  const initials = (displayName || "U").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <AppShell>
      <h1 className="flex items-center gap-2 text-2xl font-bold text-primary"><SettingsIcon className="h-6 w-6" /> Settings</h1>

      <Section icon={<User className="h-4 w-4" />} title="Profile">
        <div className="relative mb-3 overflow-hidden rounded-xl border border-border/60">
          <div className="h-24 w-full bg-gradient-to-r from-primary/30 to-accent/30">
            {(profile as any)?.cover_url && <img src={(profile as any).cover_url} alt="Cover" className="h-24 w-full object-cover" />}
          </div>
          <label className="absolute right-2 top-2 cursor-pointer rounded-full bg-background/80 p-2">
            {uploading === "cover" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            <input type="file" accept="image/*" hidden onChange={onImage("cover")} />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <label className="relative cursor-pointer">
            <Avatar className="h-16 w-16 bg-primary/20">
              {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt={displayName} /> : null}
              <AvatarFallback className="bg-primary/20 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 rounded-full bg-primary p-1 text-primary-foreground">
              {uploading === "avatar" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
            </span>
            <input type="file" accept="image/*" hidden onChange={onImage("avatar")} />
          </label>
          <div className="text-xs text-muted-foreground">@{profile?.username}</div>
        </div>
        <label className="text-xs text-muted-foreground">Display name</label>
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-background" />
        <label className="text-xs text-muted-foreground">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Builder · Kons" className="bg-background" />
        <label className="text-xs text-muted-foreground">Bio</label>
        <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="bg-background" />
        <label className="text-xs text-muted-foreground">Location</label>
        <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lagos, Nigeria" className="bg-background" />
        <label className="text-xs text-muted-foreground">Website</label>
        <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" className="bg-background" />
        <label className="text-xs text-muted-foreground">Interests</label>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((i) => (
            <button
              key={i}
              onClick={() => setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]))}
              className={cn("rounded-full border px-3 py-1 text-xs", interests.includes(i) ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-foreground/70")}
            >{i}</button>
          ))}
        </div>
        <Button onClick={save} disabled={saving} className="bg-primary text-primary-foreground">{saving ? "Saving…" : "Save profile"}</Button>
      </Section>

      <Section icon={<Bell className="h-4 w-4" />} title="Notifications">
        <Toggle label="New followers" value={settings.notif_follows} onChange={(v) => setSetting({ notif_follows: v })} />
        <Toggle label="Likes & reactions" value={settings.notif_likes} onChange={(v) => setSetting({ notif_likes: v })} />
        <Toggle label="Comments & replies" value={settings.notif_comments} onChange={(v) => setSetting({ notif_comments: v })} />
        <Toggle label="Mentions" value={settings.notif_mentions} onChange={(v) => setSetting({ notif_mentions: v })} />
        <Toggle label="Messages" value={settings.notif_messages} onChange={(v) => setSetting({ notif_messages: v })} />
        <Toggle label="Recommended content" value={settings.notif_recommendations} onChange={(v) => setSetting({ notif_recommendations: v })} />
      </Section>

      <Section icon={<Palette className="h-4 w-4" />} title="Feed">
        <div className="flex flex-wrap gap-2">
          {(["latest", "trending"] as const).map((s) => (
            <Button key={s} size="sm" variant={prefs.sort === s ? "default" : "outline"} onClick={() => savePrefs({ sort: s })}>
              {s === "latest" ? "Latest first" : "Trending first"}
            </Button>
          ))}
          <Button size="sm" variant={prefs.hide_reposts ? "default" : "outline"} onClick={() => savePrefs({ hide_reposts: !prefs.hide_reposts })}>
            {prefs.hide_reposts ? "Reposts hidden" : "Hide reposts"}
          </Button>
        </div>
        <label className="text-xs text-muted-foreground">Muted words (comma separated)</label>
        <Input value={muted} onChange={(e) => setMuted(e.target.value)} placeholder="spoilers, crypto" className="bg-background" />
        <Button size="sm" onClick={() => savePrefs({ muted_words: muted.split(",").map((w) => w.trim()).filter(Boolean) })}>Save muted words</Button>
        <div className="pt-2 text-xs text-muted-foreground">Followed hashtags</div>
        <div className="flex flex-wrap gap-2">
          {tags.length === 0 && <span className="text-xs text-muted-foreground">None yet — follow tags from any hashtag page.</span>}
          {tags.map((t) => (
            <button
              key={t}
              onClick={async () => { await toggleFollowTag(user.id, t); setTags((prev) => prev.filter((x) => x !== t)); }}
              className="rounded-full border border-border/60 px-3 py-1 text-xs hover:border-destructive"
            >#{t} ✕</button>
          ))}
        </div>
      </Section>

      <Section icon={<Lock className="h-4 w-4" />} title="Privacy">
        <Toggle
          label="Private account"
          value={!!(profile as any)?.is_private}
          onChange={async (v) => { await updateProfile(user.id, { is_private: v }); await refreshProfile(); }}
        />
        <Toggle label="Discoverable in search" value={settings.discoverable} onChange={(v) => setSetting({ discoverable: v })} />
        <Toggle label="Show my activity status" value={settings.show_activity} onChange={(v) => setSetting({ show_activity: v })} />
        <div className="pt-2 text-xs text-muted-foreground">Who can message me</div>
        <div className="flex gap-2">
          {(["everyone", "following", "nobody"] as const).map((v) => (
            <Button key={v} size="sm" variant={settings.dm_privacy === v ? "default" : "outline"} onClick={() => setSetting({ dm_privacy: v })} className="capitalize">{v}</Button>
          ))}
        </div>
        <div className="pt-3 text-xs text-muted-foreground">Muted accounts</div>
        <PeopleList people={mutedUsers} actionLabel="Unmute" onAction={async (id) => { await unmuteUser(user.id, id); setMutedUsers((p) => p.filter((x) => x.id !== id)); }} />
        <div className="pt-2 text-xs text-muted-foreground">Blocked accounts</div>
        <PeopleList people={blockedUsers} actionLabel="Unblock" onAction={async (id) => { await unblockUser(user.id, id); setBlockedUsers((p) => p.filter((x) => x.id !== id)); }} />
      </Section>

      <Section icon={<Shield className="h-4 w-4" />} title="Security">
        <div className="text-xs text-muted-foreground">Signed in as <span className="text-foreground">{user.email}</span></div>
        <label className="text-xs text-muted-foreground">New password</label>
        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-background" />
        <Button size="sm" onClick={changePassword} className="gap-1"><KeyRound className="h-4 w-4" /> Update password</Button>
        <Button
          size="sm"
          variant="outline"
          className="mt-2 gap-2"
          onClick={async () => { await supabase.auth.signOut({ scope: "global" }); nav({ to: "/" }); }}
        >
          <LogOut className="h-4 w-4" /> Sign out of all devices
        </Button>
      </Section>

      <Section icon={<Trash2 className="h-4 w-4" />} title="Account">
        <Button onClick={() => signOut().then(() => nav({ to: "/" }))} variant="outline" className="gap-2"><LogOut className="h-4 w-4" /> Sign out</Button>
        <Button onClick={deleteAccount} variant="destructive" className="mt-2 gap-2"><Trash2 className="h-4 w-4" /> Delete my account</Button>
      </Section>
    </AppShell>
  );
}

function PeopleList({ people, actionLabel, onAction }: { people: any[]; actionLabel: string; onAction: (id: string) => void }) {
  if (!people.length) return <p className="text-xs text-muted-foreground">None.</p>;
  return (
    <div className="space-y-2">
      {people.map((p) => (
        <div key={p.id} className="flex items-center gap-2">
          <Avatar className="h-8 w-8 bg-primary/20">
            {p.avatar_url ? <AvatarImage src={p.avatar_url} alt={p.display_name} /> : null}
            <AvatarFallback className="bg-primary/20 text-primary">{(p.display_name ?? "U").slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="flex-1 truncate text-sm">@{p.username}</span>
          <Button size="sm" variant="outline" onClick={() => onAction(p.id)}>{actionLabel}</Button>
        </div>
      ))}
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-background p-2.5 text-left">
      <span className="text-sm">{label}</span>
      <span className={cn("h-6 w-11 rounded-full p-0.5 transition", value ? "bg-primary" : "bg-border")}>
        <span className={cn("block h-5 w-5 rounded-full bg-card transition", value && "translate-x-5")} />
      </span>
    </button>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 rounded-2xl border border-border/60 bg-card p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">{icon} {title}</div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
