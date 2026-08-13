export type NicheId =
  | "creator" | "founder" | "freelancer" | "artist" | "developer" | "student"
  | "investor" | "coach" | "athlete" | "community" | "business" | "explorer";

export type NicheField = { key: string; label: string; placeholder?: string; type?: "text" | "textarea" | "list" };

export type Niche = {
  id: NicheId;
  label: string;
  tagline: string;
  emoji: string;
  accent: string;
  fields: NicheField[];
};

export const NICHES: Niche[] = [
  {
    id: "creator", label: "Creator", tagline: "Audience, content and brand collabs", emoji: "🎬", accent: "#f472b6",
    fields: [
      { key: "content_type", label: "What you make", placeholder: "Short-form video, essays, podcasts" },
      { key: "audience_size", label: "Total audience", placeholder: "120K across platforms" },
      { key: "rate_card", label: "Collab rate card", type: "textarea", placeholder: "Integration $X · Dedicated $Y" },
      { key: "best_work", label: "Signature work", placeholder: "Link or title" },
    ],
  },
  {
    id: "founder", label: "Founder", tagline: "What you're building and where you are", emoji: "🚀", accent: "#22d3ee",
    fields: [
      { key: "company", label: "Company", placeholder: "Konsmia" },
      { key: "stage", label: "Stage", placeholder: "Pre-seed / Seed / Series A" },
      { key: "building", label: "What you're building", type: "textarea" },
      { key: "tags", label: "Status tags", type: "list", placeholder: "raising, hiring, in beta" },
    ],
  },
  {
    id: "freelancer", label: "Freelancer / Pro", tagline: "Services, pricing and availability", emoji: "🛠️", accent: "#a855f7",
    fields: [
      { key: "services", label: "Services", type: "list", placeholder: "Brand design, Webflow builds" },
      { key: "price_range", label: "Price range", placeholder: "$800 – $5,000 per project" },
      { key: "availability", label: "Availability", placeholder: "Open from March" },
      { key: "turnaround", label: "Typical turnaround", placeholder: "2 weeks" },
    ],
  },
  {
    id: "artist", label: "Artist / Musician", tagline: "Work, releases and shows", emoji: "🎨", accent: "#fb923c",
    fields: [
      { key: "discipline", label: "Discipline", placeholder: "Afrobeats producer, oil painter" },
      { key: "latest_release", label: "Latest release", placeholder: "Title + link" },
      { key: "shows", label: "Upcoming shows", type: "list", placeholder: "Lagos · 12 Sep" },
      { key: "gallery_note", label: "About the work", type: "textarea" },
    ],
  },
  {
    id: "developer", label: "Developer", tagline: "Stack, repos and shipped work", emoji: "💻", accent: "#34d399",
    fields: [
      { key: "stack", label: "Stack", type: "list", placeholder: "TypeScript, Rust, Postgres" },
      { key: "focus", label: "Focus", placeholder: "Realtime systems, AI infra" },
      { key: "shipped", label: "Shipped projects", type: "list", placeholder: "Project — link" },
      { key: "open_source", label: "Open source", placeholder: "github.com/you" },
    ],
  },
  {
    id: "student", label: "Student / Academic", tagline: "Field, school and research", emoji: "📚", accent: "#60a5fa",
    fields: [
      { key: "field", label: "Field", placeholder: "Cognitive science" },
      { key: "school", label: "School", placeholder: "University of Lagos" },
      { key: "research", label: "Research interests", type: "textarea" },
      { key: "seeking", label: "Looking for", placeholder: "Internship, collaborators" },
    ],
  },
  {
    id: "investor", label: "Investor", tagline: "Thesis, cheque size and portfolio", emoji: "📈", accent: "#facc15",
    fields: [
      { key: "thesis", label: "Thesis", type: "textarea" },
      { key: "cheque", label: "Cheque size", placeholder: "$25K – $250K" },
      { key: "stages", label: "Stages", type: "list", placeholder: "Pre-seed, Seed" },
      { key: "portfolio", label: "Portfolio", type: "list", placeholder: "Company names" },
    ],
  },
  {
    id: "coach", label: "Coach / Consultant", tagline: "Offer, sessions and booking", emoji: "🧭", accent: "#c084fc",
    fields: [
      { key: "offer", label: "Your offer", type: "textarea" },
      { key: "format", label: "Session format", placeholder: "60-min 1:1, group cohort" },
      { key: "price", label: "Price", placeholder: "$150 / session" },
      { key: "booking_url", label: "Booking link", placeholder: "https://" },
    ],
  },
  {
    id: "athlete", label: "Athlete / Fitness", tagline: "Discipline, stats and achievements", emoji: "🏅", accent: "#f87171",
    fields: [
      { key: "discipline", label: "Discipline", placeholder: "Sprints, powerlifting" },
      { key: "club", label: "Club / team", placeholder: "" },
      { key: "stats", label: "Key stats", type: "list", placeholder: "100m — 10.4s" },
      { key: "achievements", label: "Achievements", type: "list" },
    ],
  },
  {
    id: "community", label: "Community leader", tagline: "Community, cause and gatherings", emoji: "🕊️", accent: "#38bdf8",
    fields: [
      { key: "community", label: "Community", placeholder: "Name of your community" },
      { key: "cause", label: "Cause", type: "textarea" },
      { key: "gatherings", label: "Gatherings", type: "list", placeholder: "Sundays 9am · Online" },
      { key: "join_url", label: "How to join", placeholder: "https://" },
    ],
  },
  {
    id: "business", label: "Business / Vendor", tagline: "Catalogue, hours and contact", emoji: "🏪", accent: "#4ade80",
    fields: [
      { key: "what_you_sell", label: "What you sell", type: "textarea" },
      { key: "catalogue", label: "Catalogue items", type: "list", placeholder: "Item — price" },
      { key: "hours", label: "Opening hours", placeholder: "Mon–Sat, 9am–7pm" },
      { key: "address", label: "Address", placeholder: "" },
    ],
  },
  {
    id: "explorer", label: "Explorer", tagline: "The general Konsmia identity card", emoji: "🌌", accent: "#a855f7",
    fields: [
      { key: "exploring", label: "Currently exploring", type: "textarea" },
      { key: "curiosities", label: "Curiosities", type: "list", placeholder: "Consciousness, AI, physics" },
    ],
  },
];

export const NICHE_MAP: Record<string, Niche> = Object.fromEntries(NICHES.map((n) => [n.id, n]));

export const OPEN_TO_OPTIONS = [
  "Hiring", "Open to work", "Freelance", "Collabs", "Investing", "Raising",
  "Mentoring", "Speaking", "Co-founder", "Partnerships",
] as const;

export function nicheValue(data: Record<string, unknown> | null | undefined, niche: NicheId, key: string): string[] {
  const scoped = (data?.[niche] ?? {}) as Record<string, unknown>;
  const v = scoped[key];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return [];
}

export function setNicheValue(
  data: Record<string, any> | null | undefined,
  niche: NicheId,
  key: string,
  value: string,
): Record<string, any> {
  const next = { ...(data ?? {}) };
  next[niche] = { ...(next[niche] ?? {}), [key]: value };
  return next;
}