import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Users, Search, Plus, Zap, Heart, User } from "lucide-react";
import { useState } from "react";
import { CreateSheet } from "@/components/post/CreateSheet";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [createOpen, setCreateOpen] = useState(false);

  const items = [
    { to: "/", label: "Feed", icon: Home, badge: "Hot" },
    { to: "/community", label: "Community", icon: Users },
    { to: "/search", label: "Search", icon: Search },
    { to: null, label: "Create", icon: Plus, action: () => setCreateOpen(true) },
    { to: "/viral", label: "Viral", icon: Zap, badge: "New" },
    { to: "/dating", label: "Dating", icon: Heart },
    { to: "/me", label: "Profile", icon: User },
  ] as const;

  return (
    <>
      <nav className="sticky bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-1 py-1.5 lg:px-6">
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.to && (item.to === "/" ? path === "/" : path.startsWith(item.to));
            const isCreate = item.label === "Create";
            const content = (
              <div className={cn("relative flex flex-col items-center gap-0.5 px-1.5 py-1", isCreate && "translate-y-[-2px]")}>
                <div
                  className={cn(
                    "relative flex items-center justify-center",
                    isCreate
                      ? "h-9 w-9 rounded-full bg-primary text-primary-foreground shadow-[0_0_14px_oklch(0.78_0.16_220/0.5)]"
                      : "h-6 w-6",
                    !isCreate && active && "text-primary",
                    !isCreate && !active && "text-foreground/60",
                  )}
                >
                  <Icon className={cn(isCreate ? "h-5 w-5" : "h-5 w-5")} />
                  {(item as { badgeCount?: number }).badgeCount ? (
                    <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
                      {(item as { badgeCount?: number }).badgeCount}
                    </span>
                  ) : null}
                </div>
                {"badge" in item && item.badge ? (
                  <span className="absolute -top-1 text-[9px] font-bold text-accent">{item.badge}</span>
                ) : null}
                <span className={cn("text-[10px] font-medium", active ? "text-primary" : "text-foreground/70")}>{item.label}</span>
              </div>
            );
            return item.to ? (
              <Link key={item.label} to={item.to} className="flex-1">
                {content}
              </Link>
            ) : (
              <button key={item.label} onClick={item.action} className="flex-1">
                {content}
              </button>
            );
          })}
        </div>
      </nav>
      <CreateSheet open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}