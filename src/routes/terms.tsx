import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms — Konsmia" },
      { name: "description", content: "The rules that keep Konsmia civil." },
      { property: "og:title", content: "Terms — Konsmia" },
      { property: "og:description", content: "The rules that keep Konsmia civil." },
    ],
  }),
  component: () => (
    <AppShell>
      <h1 className="text-2xl font-bold text-primary">Terms</h1>
      <div className="mt-4 space-y-3 rounded-2xl border border-border/60 bg-card p-4 text-sm text-foreground/85">
        <p>Be respectful. No harassment, hate, illegal content, or spam.</p>
        <p>You own what you post. You grant Konsmia a licence to display it.</p>
        <p>We may remove content or accounts that violate these terms.</p>
      </div>
    </AppShell>
  ),
});