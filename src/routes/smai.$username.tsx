import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { SMAI_PLATFORMS, fetchSmaiLinks, fetchSmaiProfile, type SmaiLink, type SmaiProfile } from "@/lib/smai";
import { NICHE_MAP, nicheValue, type NicheId } from "@/lib/smai-niches";
import { getHumanProof, reputationTier } from "@/lib/platform";
import { BadgeCheck, Globe, MapPin, ShieldCheck, Sparkles, UserCircle2 } from "lucide-react";

export const Route = createFileRoute("/smai/$username")({
  head: () => ({
    meta: [
      { title: "Smai identity card — Konsmia" },
      { name: "description", content: "Everything about this person: bio, skills and every social account, in one Smai identity card." },
      { property: "og:title", content: "Smai identity card — Konsmia" },
      { property: "og:description", content: "One card with every social account and everything about this person." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

type Basic = { id: string; username: string; display_name: string; avatar_url: string | null; title: string | null; bio: string | null; tokens_earned: number; reputation?: number };

function Page() {
  const { username } = useParams({ from: "/smai/$username" });
  const [base, setBase] = useState<Basic | null>(null);
  const [smai, setSmai] = useState<SmaiProfile | null>(null);
  const [links, setLinks] = useState<SmaiLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [human, setHuman] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any).from("profiles")
        .select("id, username, display_name, avatar_url, title, bio, tokens_earned, reputation")
        .eq("username", username).maybeSingle();
      setBase((data as Basic) ?? null);
      if (data) {
        const [p, l, h] = await Promise.all([fetchSmaiProfile(data.id), fetchSmaiLinks(data.id), getHumanProof(data.id)]);
        setSmai(p);
        setLinks(l.filter((x) => x.visible));
        setHuman(!!h);
      }
      setLoading(false);
    })();
  }, [username]);

  if (loading) return <AppShell><div className="p-6 text-center text-muted-foreground">Loading identity…</div></AppShell>;
  if (!base) return <AppShell><div className="p-6 text-center text-muted-foreground">No such identity.</div></AppShell>;

  const initials = base.display_name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const accent = smai?.theme_color ?? "#22d3ee";
  const activeNiches = ((smai?.niches ?? []) as string[]).filter((n) => NICHE_MAP[n]) as NicheId[];
  const tier = reputationTier(base.reputation ?? 0);

  return (
    <AppShell>
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="h-28 w-full bg-gradient-to-r from-primary/30 to-accent/20">
          {smai?.banner_url && <img src={smai.banner_url} alt={`${base.display_name} Smai banner`} className="h-28 w-full object-cover" />}
        </div>
        <div className="-mt-8 px-4 pb-4">
          <Avatar className="h-16 w-16 border-4 border-card bg-primary/20">
            {base.avatar_url && <AvatarImage src={base.avatar_url} alt={base.display_name} />}
            <AvatarFallback className="bg-primary/20 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <h1 className="mt-2 flex items-center gap-2 text-xl font-bold text-foreground">
            {base.display_name}
            {smai?.verified && <BadgeCheck className="h-5 w-5" style={{ color: accent }} />}
          </h1>
          <div className="text-sm text-muted-foreground">@{base.username}{smai?.pronouns ? ` · ${smai.pronouns}` : ""}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {activeNiches.map((n) => (
              <span key={n} className="rounded-full border px-2 py-0.5 text-[11px]" style={{ borderColor: NICHE_MAP[n].accent, color: NICHE_MAP[n].accent }}>
                {NICHE_MAP[n].emoji} {NICHE_MAP[n].label}
              </span>
            ))}
            {human && (
              <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] text-primary">
                <ShieldCheck className="h-3 w-3" /> Verified human
              </span>
            )}
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] text-accent">
              {tier.label} · {(base.reputation ?? 0).toLocaleString()} rep
            </span>
          </div>
          {(smai?.open_to ?? []).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(smai?.open_to ?? []).map((o) => (
                <span key={o} className="rounded-full border border-dashed border-primary/40 px-2 py-0.5 text-[11px] text-primary">{o}</span>
              ))}
            </div>
          )}
          {smai?.headline && <p className="mt-2 text-sm font-medium" style={{ color: accent }}>{smai.headline}</p>}
          {smai?.tagline && <p className="text-sm text-foreground/80">{smai.tagline}</p>}
          {(smai?.about || base.bio) && <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/80">{smai?.about ?? base.bio}</p>}
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {smai?.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {smai.location}</span>}
            {smai?.website && <a href={smai.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary"><Globe className="h-3 w-3" /> {smai.website.replace(/^https?:\/\//, "")}</a>}
            <span>{base.tokens_earned.toLocaleString()} tokens earned</span>
          </div>
          {smai?.skills?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {smai.skills.map((s) => (
                <span key={s} className="rounded-full border border-border/60 px-2 py-1 text-[11px] text-foreground/80">{s}</span>
              ))}
            </div>
          ) : null}
          <div className="mt-3 flex gap-2">
            <Link to="/profile/$username" params={{ username: base.username }} className="rounded-md border border-border/60 px-3 py-2 text-xs font-semibold">Kons profile</Link>
            {smai?.hire_url && (
              <a href={smai.hire_url} target="_blank" rel="noreferrer" className="rounded-md px-3 py-2 text-xs font-semibold text-primary-foreground" style={{ background: accent }}>
                Work with me
              </a>
            )}
          </div>
        </div>
      </div>

      {activeNiches.map((id) => {
        const n = NICHE_MAP[id];
        const filled = n.fields
          .map((f) => ({ f, values: nicheValue(smai?.niche_data as any, id, f.key) }))
          .filter((x) => x.values.length > 0);
        if (!filled.length) return null;
        return (
          <section key={id} className="mt-4 rounded-2xl border border-border/60 bg-card p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: n.accent }}>
              <Sparkles className="h-4 w-4" /> {n.emoji} {n.label}
            </h2>
            <dl className="space-y-3">
              {filled.map(({ f, values }) => (
                <div key={f.key}>
                  <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{f.label}</dt>
                  {f.type === "list" ? (
                    <dd className="mt-1 flex flex-wrap gap-1.5">
                      {values.map((v) => (
                        <span key={v} className="rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-foreground/80">{v}</span>
                      ))}
                    </dd>
                  ) : (
                    <dd className="whitespace-pre-wrap text-sm text-foreground/85">{values[0]}</dd>
                  )}
                </div>
              ))}
            </dl>
          </section>
        );
      })}

      <section className="mt-4 rounded-2xl border border-border/60 bg-card p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary"><UserCircle2 className="h-4 w-4" /> Connected accounts</h2>
        {links.length === 0 && <p className="text-sm text-muted-foreground">No public accounts connected.</p>}
        <div className="grid grid-cols-2 gap-2">
          {links.map((l) => {
            const meta = SMAI_PLATFORMS.find((p) => p.id === l.platform);
            return (
              <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="rounded-xl border border-border/60 p-3 hover:border-primary/40">
                <div className="text-sm font-medium">{meta?.label ?? l.platform}</div>
                <div className="truncate text-xs text-muted-foreground">{l.handle ?? l.url}</div>
                {l.followers ? <div className="mt-1 text-[11px] text-accent">{l.followers.toLocaleString()} followers</div> : null}
              </a>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}