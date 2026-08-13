import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useEffect, useRef, useState } from "react";
import { getSpaceBySlug, listSpaceMembers, updateMemberRole, removeMember, type Space, type SpaceMember } from "@/lib/spaces";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Shield, UserMinus, Trash2, Upload, Loader2 } from "lucide-react";
import { uploadToMedia } from "@/lib/upload";

export const Route = createFileRoute("/spaces/$slug/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [space, setSpace] = useState<Space | null>(null);
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [rules, setRules] = useState("");
  const [website, setWebsite] = useState("");
  const [theme, setTheme] = useState("#a855f7");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<"public" | "private" | "invite_only">("public");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"cover" | "avatar" | null>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const s = await getSpaceBySlug(slug);
    if (!s) return;
    setSpace(s);
    setName(s.name);
    setDescription(s.description ?? "");
    setVisibility(s.visibility);
    setCategory(s.category ?? "");
    setRules(s.rules ?? "");
    setWebsite(s.website ?? "");
    setTheme(s.theme_color ?? "#a855f7");
    setContactEmail((s as any).contact_email ?? "");
    setPhone((s as any).phone ?? "");
    setCtaLabel((s as any).cta_label ?? "");
    setCtaUrl((s as any).cta_url ?? "");
    setCoverUrl(s.cover_url);
    setAvatarUrl(s.avatar_url);
    setMembers(await listSpaceMembers(s.id));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [slug]);

  if (!space) return <AppShell><div className="text-muted-foreground">Loading…</div></AppShell>;
  const isOwner = user?.id === space.owner_id;
  const myRole = members.find((m) => m.user_id === user?.id)?.role;
  if (!isOwner && myRole !== "admin" && myRole !== "moderator") {
    return <AppShell><div className="rounded-xl border border-dashed border-border/60 p-6 text-center">Not allowed.</div></AppShell>;
  }

  const handleUpload = async (kind: "cover" | "avatar", file: File) => {
    if (!user) return;
    setUploading(kind);
    try {
      const url = await uploadToMedia(file, user.id, `spaces/${space.id}/${kind}`);
      const patch = kind === "cover" ? { cover_url: url } : { avatar_url: url };
      const { error } = await supabase.from("spaces").update(patch).eq("id", space.id);
      if (error) throw error;
      kind === "cover" ? setCoverUrl(url) : setAvatarUrl(url);
      toast.success(`${kind} updated`);
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(null); }
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("spaces").update({
      name, description, visibility, category: category || null, rules: rules || null,
      website: website || null, theme_color: theme,
      contact_email: contactEmail || null, phone: phone || null,
      cta_label: ctaLabel || null, cta_url: ctaUrl || null,
    } as any).eq("id", space.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    load();
  };

  const del = async () => {
    if (!confirm("Delete this space? Posts inside will become orphaned.")) return;
    const { error } = await supabase.from("spaces").delete().eq("id", space.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    nav({ to: "/spaces" });
  };

  return (
    <AppShell>
      <Link to="/spaces/$slug" params={{ slug }} className="text-sm text-primary">← Back to {space.name}</Link>
      <h1 className="mt-2 text-2xl font-bold text-primary">Manage {space.name}</h1>

      <Tabs defaultValue="general" className="mt-4">
        <TabsList className="grid w-full grid-cols-3 bg-card">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4 space-y-3 rounded-2xl border border-border/60 bg-card p-4">
          <div className="space-y-1"><label className="text-xs">Name</label><Input value={name} onChange={(e) => setName(e.target.value)} className="bg-background" /></div>
          <div className="space-y-1"><label className="text-xs">Category</label><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Technology, Art" className="bg-background" /></div>
          <div className="space-y-1"><label className="text-xs">Description</label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bg-background" rows={3} /></div>
          <div className="space-y-1"><label className="text-xs">Rules</label><Textarea value={rules} onChange={(e) => setRules(e.target.value)} className="bg-background" rows={4} placeholder="1. Be respectful…" /></div>
          <div className="space-y-1"><label className="text-xs">Website</label><Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" className="bg-background" /></div>
          {space.kind === "page" && (
            <>
              <div className="space-y-1"><label className="text-xs">Contact email</label><Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="hello@yourbrand.com" className="bg-background" /></div>
              <div className="space-y-1"><label className="text-xs">Phone</label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 0100" className="bg-background" /></div>
              <div className="space-y-1"><label className="text-xs">CTA button label</label><Input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder="Shop now / Book a call / Sign up" className="bg-background" /></div>
              <div className="space-y-1"><label className="text-xs">CTA URL</label><Input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://…" className="bg-background" /></div>
            </>
          )}
          <div>
            <label className="text-xs">Visibility</label>
            <div className="mt-1 flex gap-2">
              {(["public", "private", "invite_only"] as const).map((v) => (
                <button key={v} onClick={() => setVisibility(v)}
                  className={`flex-1 rounded-lg border px-2 py-1.5 text-xs capitalize ${visibility === v ? "border-primary bg-primary/10 text-primary" : "border-border/60"}`}>
                  {v.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={save} disabled={saving} className="w-full bg-primary text-primary-foreground">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
          </Button>
        </TabsContent>

        <TabsContent value="branding" className="mt-4 space-y-4 rounded-2xl border border-border/60 bg-card p-4">
          <div>
            <label className="text-xs">Cover image</label>
            <div
              className="mt-1 h-32 w-full rounded-xl border border-border/60"
              style={{
                background: coverUrl ? `url(${coverUrl}) center/cover` : `linear-gradient(135deg, ${theme}, hsl(var(--accent)))`,
              }}
            />
            <input ref={coverRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleUpload("cover", e.target.files[0])} />
            <Button variant="outline" size="sm" className="mt-2 gap-1" onClick={() => coverRef.current?.click()} disabled={uploading === "cover"}>
              {uploading === "cover" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload cover
            </Button>
          </div>

          <div>
            <label className="text-xs">Avatar</label>
            <div className="mt-1 flex items-center gap-3">
              <Avatar className="h-16 w-16" style={{ background: theme }}>
                {avatarUrl && <AvatarImage src={avatarUrl} />}
                <AvatarFallback className="text-xl text-white" style={{ background: theme }}>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <input ref={avatarRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleUpload("avatar", e.target.files[0])} />
              <Button variant="outline" size="sm" className="gap-1" onClick={() => avatarRef.current?.click()} disabled={uploading === "avatar"}>
                {uploading === "avatar" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload avatar
              </Button>
            </div>
          </div>

          <div>
            <label className="text-xs">Theme color</label>
            <div className="mt-1 flex items-center gap-3">
              <input type="color" value={theme} onChange={(e) => setTheme(e.target.value)} className="h-10 w-14 cursor-pointer rounded-md border border-border/60 bg-background" />
              <Input value={theme} onChange={(e) => setTheme(e.target.value)} className="bg-background" />
            </div>
          </div>

          <Button onClick={save} disabled={saving} className="w-full bg-primary text-primary-foreground">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save branding"}
          </Button>
        </TabsContent>

        <TabsContent value="members" className="mt-4 space-y-2">
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
              <Avatar className="h-9 w-9 bg-primary/20">
                {m.profile?.avatar_url && <AvatarImage src={m.profile.avatar_url} />}
                <AvatarFallback className="bg-primary/20 text-primary">
                  {(m.profile?.display_name ?? "U").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-sm font-semibold flex items-center gap-1">
                  {m.profile?.display_name}
                  {m.user_id === space.owner_id && <Crown className="h-3 w-3 text-accent" />}
                </div>
                <div className="text-xs text-muted-foreground">@{m.profile?.username} · {m.role}</div>
              </div>
              {isOwner && m.user_id !== space.owner_id && (
                <>
                  <Button size="sm" variant="outline" onClick={async () => { await updateMemberRole(space.id, m.user_id, m.role === "admin" ? "member" : "admin"); load(); }}>
                    <Shield className="h-3 w-3 mr-1" /> {m.role === "admin" ? "Demote" : "Promote"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={async () => { await removeMember(space.id, m.user_id); load(); }}>
                    <UserMinus className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {isOwner && (
        <Button onClick={del} variant="outline" className="mt-6 w-full text-destructive border-destructive/40 gap-1">
          <Trash2 className="h-4 w-4" /> Delete {space.kind}
        </Button>
      )}
    </AppShell>
  );
}
