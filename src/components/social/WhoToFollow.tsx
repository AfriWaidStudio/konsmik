import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { fetchSuggestedPeople, followUser, type SuggestedPerson } from "@/lib/social";
import { UserPlus, Users } from "lucide-react";

export function WhoToFollow({ limit = 5 }: { limit?: number }) {
  const { user } = useAuth();
  const [people, setPeople] = useState<SuggestedPerson[]>([]);
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    fetchSuggestedPeople(user.id, limit).then(setPeople);
  }, [user?.id, limit]);

  if (!user || people.length === 0) return null;
  const visible = people.filter((p) => !done.has(p.id));
  if (!visible.length) return null;

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground/80">
        <Users className="h-4 w-4 text-primary" /> People you may know
      </div>
      <div className="space-y-3">
        {visible.slice(0, limit).map((p) => (
          <div key={p.id} className="flex items-center gap-3">
            <Link to="/profile/$username" params={{ username: p.username }}>
              <Avatar className="h-9 w-9 bg-primary/20">
                {p.avatar_url ? <AvatarImage src={p.avatar_url} alt={p.display_name} /> : null}
                <AvatarFallback className="bg-primary/20 text-primary">{(p.display_name ?? "U").slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Link>
            <Link to="/profile/$username" params={{ username: p.username }} className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{p.display_name}</div>
              <div className="truncate text-xs text-muted-foreground">{p.reason}</div>
            </Link>
            <Button
              size="sm"
              className="gap-1 bg-primary/20 text-primary hover:bg-primary/30"
              onClick={async () => {
                await followUser(user.id, p.id);
                setDone((prev) => new Set(prev).add(p.id));
              }}
            >
              <UserPlus className="h-3 w-3" /> Follow
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
