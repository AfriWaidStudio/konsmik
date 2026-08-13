import { Link } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Home, Users, Search, Zap, Bell, User, MessageSquare, Bookmark, Settings, Compass, LogOut, Brain, Building2, UserCircle2, FolderPlus, Heart, Bot } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function NavDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user, profile, signOut } = useAuth();

  const sections = [
    {
      label: "Discover",
      items: [
        { to: "/", label: "Feed", Icon: Home },
        { to: "/viral", label: "Viral / TV", Icon: Zap },
        { to: "/search", label: "Search", Icon: Search },
        { to: "/community", label: "Community", Icon: Users },
        { to: "/dating", label: "Dating", Icon: Heart },
        { to: "/spaces", label: "Spaces (Groups · Pages · Circles)", Icon: Compass },
        { to: "/waides", label: "Waides — SmaiBeings", Icon: Bot },
      ],
    },
    {
      label: "You",
      items: [
        { to: "/notifications", label: "Notifications", Icon: Bell },
        { to: "/messages", label: "Messages", Icon: MessageSquare },
        { to: "/me", label: "Profile", Icon: User },
        { to: "/bookmarks", label: "Bookmarks", Icon: Bookmark },
        { to: "/collections", label: "Collections", Icon: FolderPlus },
        { to: "/settings", label: "Settings", Icon: Settings },
      ],
    },
    {
      label: "Ecosystem",
      items: [
        { to: "/community", label: "Kons — Consciousness", Icon: Brain },
        { to: "/waides", label: "Waides — Beings & Business", Icon: Building2 },
        { to: "/smai", label: "Smai — Identity & Maiki Wallet", Icon: UserCircle2 },
      ],
    },
  ] as const;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[88%] max-w-sm overflow-y-auto bg-background p-0">
        <div className="border-b border-border/60 p-4">
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-2 text-primary">
              <Brain className="h-5 w-5" /> Konsmia
            </SheetTitle>
          </SheetHeader>
          {profile && (
            <Link to="/me" onClick={() => onOpenChange(false)} className="mt-3 block rounded-xl border border-border/60 bg-card p-3">
              <div className="text-sm font-semibold">{profile.display_name}</div>
              <div className="text-xs text-muted-foreground">@{profile.username}</div>
              <div className="mt-2 text-xs text-primary">{profile.tokens_earned} tokens earned</div>
            </Link>
          )}
          {!user && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link to="/login" onClick={() => onOpenChange(false)} className="rounded-md border border-primary/40 px-3 py-2 text-center text-xs font-semibold text-primary">Sign in</Link>
              <Link to="/signup" onClick={() => onOpenChange(false)} className="rounded-md bg-primary px-3 py-2 text-center text-xs font-semibold text-primary-foreground">Sign up</Link>
            </div>
          )}
        </div>

        <div className="p-3">
          {sections.map((sec) => (
            <div key={sec.label} className="mb-4">
              <div className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{sec.label}</div>
              {sec.items.map((it) => (
                <Link
                  key={it.label}
                  to={it.to}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-primary/10 hover:text-primary"
                >
                  <it.Icon className="h-4 w-4" />
                  <span>{it.label}</span>
                </Link>
              ))}
            </div>
          ))}

          {user && (
            <button
              onClick={async () => { await signOut(); onOpenChange(false); }}
              className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          )}

          <div className="mt-6 border-t border-border/60 px-3 pt-4 text-xs text-muted-foreground">
            <div>Konsmia · v1</div>
            <div className="mt-1 flex flex-wrap gap-3">
              <Link to="/about" onClick={() => onOpenChange(false)}>About</Link>
              <Link to="/privacy" onClick={() => onOpenChange(false)}>Privacy</Link>
              <Link to="/terms" onClick={() => onOpenChange(false)}>Terms</Link>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}