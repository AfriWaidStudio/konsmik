import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Camera, Check, ArrowRight, Sparkles, Users, ShieldCheck } from "lucide-react";
import {
  INTERESTS, updateProfile, uploadProfileImage, fetchSuggestedPeople, followUser,
  saveSettings, type SuggestedPerson,
} from "@/lib/social";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your Konsmia profile" },
      { name: "description", content: "Pick your interests, build your profile and find your first people on Konsmia." },
      { property: "og:title", content: "Set up your Konsmia profile" },
      { property: "og:description", content: "Pick your interests, build your profile and find your first people on Konsmia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Onboarding,
});

const STEPS = ["Profile", "Interests", "People", "Privacy"] as const;

function Onboarding() {
  const { user, profile, refreshProfile } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [people, setPeople] = useState<SuggestedPerson[]>([]);
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [isPrivate, setIsPrivate] = useState(false);
  const [notifs, setNotifs] = useState(true);
  const [discoverable, setDiscoverable] = useState(true);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setTitle(profile.title ?? "");
      setBio(profile.bio ?? "");
      setAvatar(profile.avatar_url ?? null);
      setPicked(((profile as any).interests as string[]) ?? []);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (step === 2 && user) fetchSuggestedPeople(user.id, 12).then(setPeople);
  }, [step, user?.id]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <div className="space-y-3">
          <p className="text-foreground/80">Create an account to get started.</p>
          <Link to="/signup" className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Sign up</Link>
        </div>
      </div>
    );
  }

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProfileImage(file, user.id, "avatar");
      setAvatar(url);
      await refreshProfile();
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const toggleInterest = (i: string) =>
    setPicked((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : prev.length >= 10 ? prev : [...prev, i]));

  const toggleFollow = async (p: SuggestedPerson) => {
    if (followed.has(p.id)) return;
    await followUser(user.id, p.id);
    setFollowed((prev) => new Set(prev).add(p.id));
  };

  const next = async () => {
    setBusy(true);
    try {
      if (step === 0) {
        if (!displayName.trim()) throw new Error("Add a display name");
        await updateProfile(user.id, { display_name: displayName.trim(), title: title.trim() || "Member", bio, location });
      }
      if (step === 1) {
        if (picked.length < 3) throw new Error("Pick at least 3 interests");
        await updateProfile(user.id, { interests: picked });
      }
      if (step === 3) {
        await updateProfile(user.id, { is_private: isPrivate, onboarded: true });
        await saveSettings(user.id, {
          discoverable,
          notif_follows: notifs,
          notif_likes: notifs,
          notif_comments: notifs,
          notif_mentions: notifs,
          notif_messages: notifs,
          notif_recommendations: notifs,
        });
        await refreshProfile();
        toast.success("You're all set — welcome to Konsmia!");
        nav({ to: "/" });
        return;
      }
      await refreshProfile();
      setStep((s) => s + 1);
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const skipAll = async () => {
    await updateProfile(user.id, { onboarded: true });
    await refreshProfile();
    nav({ to: "/" });
  };

  const initials = (displayName || "U").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto min-h-screen w-full max-w-lg px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1">
            <div className={cn("h-1 rounded-full", i <= step ? "bg-primary" : "bg-border")} />
            <div className={cn("mt-1 text-[10px]", i === step ? "text-primary" : "text-muted-foreground")}>{s}</div>
          </div>
        ))}
      </div>

      {step === 0 && (
        <section className="space-y-4">
          <Header icon={<Sparkles className="h-5 w-5" />} title="Build your profile" sub="This is how the Tribe will know you." />
          <div className="flex items-center gap-4">
            <label className="relative cursor-pointer">
              <Avatar className="h-20 w-20 bg-primary/20">
                {avatar ? <AvatarImage src={avatar} alt="Your profile photo" /> : null}
                <AvatarFallback className="bg-primary/20 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-primary-foreground">
                {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
              </span>
              <input type="file" accept="image/*" hidden onChange={onAvatar} disabled={uploading} />
            </label>
            <p className="text-xs text-muted-foreground">Tap the photo to upload an avatar.</p>
          </div>
          <Field label="Display name"><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-card" /></Field>
          <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Builder · Consciousness Explorer" className="bg-card" /></Field>
          <Field label="Bio"><Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Tell the Tribe who you are…" className="bg-card" /></Field>
          <Field label="Location"><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lagos, Nigeria" className="bg-card" /></Field>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-4">
          <Header icon={<Sparkles className="h-5 w-5" />} title="What are you into?" sub="Pick 3–10. We use these to shape your feed and suggestions." />
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((i) => (
              <button
                key={i}
                onClick={() => toggleInterest(i)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs transition",
                  picked.includes(i) ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-foreground/70",
                )}
              >
                {picked.includes(i) && <Check className="mr-1 inline h-3 w-3" />}{i}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{picked.length} selected</p>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          <Header icon={<Users className="h-5 w-5" />} title="Follow a few people" sub="Your feed comes alive once you follow someone." />
          <div className="space-y-2">
            {people.length === 0 && <p className="text-sm text-muted-foreground">No suggestions yet — you may be early. You can find people in Search anytime.</p>}
            {people.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
                <Avatar className="h-10 w-10 bg-primary/20">
                  {p.avatar_url ? <AvatarImage src={p.avatar_url} alt={p.display_name} /> : null}
                  <AvatarFallback className="bg-primary/20 text-primary">{(p.display_name ?? "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{p.display_name}</div>
                  <div className="truncate text-xs text-muted-foreground">@{p.username} · {p.reason}</div>
                </div>
                <Button size="sm" variant={followed.has(p.id) ? "outline" : "default"} onClick={() => toggleFollow(p)}>
                  {followed.has(p.id) ? "Following" : "Follow"}
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4">
          <Header icon={<ShieldCheck className="h-5 w-5" />} title="Privacy & notifications" sub="You can change all of this later in Settings." />
          <Toggle label="Private account" sub="Only approved followers see your posts" value={isPrivate} onChange={setIsPrivate} />
          <Toggle label="Discoverable in search" sub="Let others find you by name or username" value={discoverable} onChange={setDiscoverable} />
          <Toggle label="Notifications" sub="Follows, likes, comments, mentions and messages" value={notifs} onChange={setNotifs} />
        </section>
      )}

      <div className="mt-8 flex items-center gap-3">
        <Button onClick={next} disabled={busy} className="flex-1 bg-primary text-primary-foreground">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{step === 3 ? "Enter Konsmia" : "Continue"} <ArrowRight className="ml-1 h-4 w-4" /></>}
        </Button>
        {step < 3 && <button onClick={skipAll} className="text-xs text-muted-foreground underline">Skip for now</button>}
      </div>
    </div>
  );
}

function Header({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div>
      <h1 className="flex items-center gap-2 text-xl font-bold text-primary">{icon}{title}</h1>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, sub, value, onChange }: { label: string; sub: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-card p-3 text-left">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-muted-foreground">{sub}</span>
      </span>
      <span className={cn("h-6 w-11 rounded-full p-0.5 transition", value ? "bg-primary" : "bg-border")}>
        <span className={cn("block h-5 w-5 rounded-full bg-background transition", value && "translate-x-5")} />
      </span>
    </button>
  );
}
