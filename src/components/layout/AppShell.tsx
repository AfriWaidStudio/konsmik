import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { Footer } from "./Footer";

export function AppShell({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (profile && (profile as any).onboarded === false && path !== "/onboarding") {
      nav({ to: "/onboarding" });
    }
  }, [profile?.id, (profile as any)?.onboarded, path]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col">
        <TopBar />
        <div className="mx-auto flex w-full max-w-7xl flex-1 px-3 py-4 lg:px-6">
          <div className="hidden w-64 shrink-0 xl:block" aria-hidden="true" />
          <main className="mx-auto w-full max-w-3xl flex-1 lg:max-w-5xl">{children}</main>
          <div className="hidden w-64 shrink-0 xl:block" aria-hidden="true" />
        </div>
        <Footer />
        <BottomNav />
      </div>
    </div>
  );
}