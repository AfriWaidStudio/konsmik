import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — Konsmia" },
      { name: "description", content: "How Konsmia handles your data." },
      { property: "og:title", content: "Privacy — Konsmia" },
      { property: "og:description", content: "How Konsmia handles your data." },
    ],
  }),
  component: () => (
    <AppShell>
      <h1 className="text-2xl font-bold text-primary">Privacy</h1>
      <div className="mt-4 space-y-3 rounded-2xl border border-border/60 bg-card p-4 text-sm text-foreground/85">
        <p>We collect only what's needed to run Konsmia: your profile, posts, and interactions. We never sell your data.</p>
        <p>Content you post is public within Konsmia unless posted inside a private space or circle.</p>
        <p>You can delete your posts and account at any time from settings.</p>
      </div>
    </AppShell>
  ),
});