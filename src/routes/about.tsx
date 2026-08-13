import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Brain } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Konsmia — A Living Digital Civilization" },
      { name: "description", content: "Konsmia is a living digital civilization — Kons for consciousness, Waides for business, Smai for identity." },
      { property: "og:title", content: "About Konsmia" },
      { property: "og:description", content: "A living digital civilization — Kons, Waides, Smai." },
    ],
  }),
  component: () => (
    <AppShell>
      <h1 className="flex items-center gap-2 text-2xl font-bold text-primary"><Brain className="h-6 w-6" /> About Konsmia</h1>
      <div className="mt-4 space-y-3 rounded-2xl border border-border/60 bg-card p-4 text-sm text-foreground/85">
        <p>Konsmia is a living digital civilization built in three layers:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Kons</strong> — consciousness, ideas, and community.</li>
          <li><strong>Waides</strong> — business and commerce (coming soon).</li>
          <li><strong>Smai</strong> — identity and reputation (coming soon).</li>
        </ul>
        <p>Every post, space, and reaction adds to the civilization. Welcome home.</p>
      </div>
    </AppShell>
  ),
});