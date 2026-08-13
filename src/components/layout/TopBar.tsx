import { useNavigate } from "@tanstack/react-router";
import { Brain, MessageSquare, Globe, Lock, Users, Building2, User, Download, Check } from "lucide-react";
import { useState } from "react";
import { KonsaiSheet } from "@/components/konsai/KonsaiSheet";
import { NavDrawer } from "@/components/layout/NavDrawer";
import { usePwaInstall } from "@/hooks/use-pwa";
import { cn } from "@/lib/utils";

export function TopBar() {
  const [konsaiOpen, setKonsaiOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [community, setCommunity] = useState<"kons" | "waides" | "smai">("kons");
  const { canInstall, isInstalled, install } = usePwaInstall();

  const nav = useNavigate();

  const pickCommunity = (c: "kons" | "waides" | "smai") => {
    if (c === "kons") {
      setCommunity("kons");
    } else if (c === "smai") {
      setCommunity("smai");
      nav({ to: "/smai" });
    } else {
      setCommunity("waides");
      nav({ to: "/waides" });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-2 lg:px-6">
          <button
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/40 text-primary transition hover:bg-primary/10"
          >
            <Brain className="h-5 w-5" />
          </button>

          <div className="mx-auto flex items-center gap-1 overflow-hidden rounded-full border border-primary/30 px-1.5 py-1">
            <Globe className="h-4 w-4 shrink-0 text-primary" />
            <CommunityPill active={community === "kons"} onClick={() => pickCommunity("kons")} icon={<Users className="h-3.5 w-3.5" />} label="Kons" tone="primary" />
            <CommunityPill active={community === "waides"} onClick={() => pickCommunity("waides")} icon={<Building2 className="h-3.5 w-3.5" />} label="Waides" tone="accent" />
            <CommunityPill active={community === "smai"} onClick={() => pickCommunity("smai")} icon={<User className="h-3.5 w-3.5" />} label="Smai" tone="accent" />
          </div>

          <div className="flex items-center gap-2">
            {canInstall && !isInstalled ? (
              <button
                type="button"
                onClick={() => void install()}
                className="hidden items-center gap-1.5 rounded-full border border-primary/50 bg-primary/10 px-2.5 py-1.5 text-[10px] font-semibold text-primary transition hover:bg-primary/15 sm:inline-flex"
                aria-label="Install Konsmia app"
              >
                <Download className="h-3.5 w-3.5" />
                Install
              </button>
            ) : null}

            {isInstalled ? (
              <span className="hidden items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-300 sm:inline-flex">
                <Check className="h-3.5 w-3.5" />
                Installed
              </span>
            ) : null}

            <button
              onClick={() => setKonsaiOpen(true)}
              aria-label="Open Konsai AI chat"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/40 text-primary transition hover:bg-primary/10"
            >
              <MessageSquare className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>
      <KonsaiSheet open={konsaiOpen} onOpenChange={setKonsaiOpen} />
      <NavDrawer open={navOpen} onOpenChange={setNavOpen} />
    </>
  );
}

function CommunityPill({
  active,
  onClick,
  icon,
  label,
  tone,
  locked,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  tone: "primary" | "accent";
  locked?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold transition",
        active && "bg-primary/15 text-primary",
        !active && tone === "accent" && "text-accent",
        !active && tone === "primary" && "text-foreground/80",
      )}
    >
      {icon}
      <span>{label}</span>
      {locked && <Lock className="h-3 w-3 opacity-70" />}
    </button>
  );
}