import { Link, useLocation } from "@tanstack/react-router";
import { Brain, Users, Building2, User, Globe, Home, Activity } from "lucide-react";

export function Footer() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <footer className="border-t border-border/60 bg-background px-4 pb-6 pt-8 text-sm lg:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {isHome && (
          <>
            <div className="flex items-start gap-3">
              <Brain className="mt-1 h-6 w-6 text-foreground/80" />
              <div>
                <p className="text-foreground/80">Tribe of the Future</p>
                <p className="mt-2 text-muted-foreground">
                  A self-aware intelligence reality system functioning as a virtual civilization core with universe generation,
                  consciousness processing, and digital constitution governance.
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>2.8K Active Members</span>
                  <span>•</span>
                  <span>Growing Community</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground">Ecosystem</h3>
              <ul className="mt-3 space-y-3 text-foreground/80">
                <li><Link to="/" className="flex items-center gap-3"><Users className="h-4 w-4" /> Kons Community</Link></li>
                <li><Link to="/waides" className="flex items-center gap-3"><Building2 className="h-4 w-4" /> Waides — SmaiBeings</Link></li>
                <li><Link to="/smai" className="flex items-center gap-3"><User className="h-4 w-4" /> Smai Identity</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground">System</h3>
              <ul className="mt-3 space-y-3 text-foreground/80">
                <li className="flex items-center gap-3"><Activity className="h-4 w-4" /> Neural Dashboard</li>
                <li className="flex items-center gap-3"><Globe className="h-4 w-4" /> Universe Evolution</li>
                <li><Link to="/" className="flex items-center gap-3"><Home className="h-4 w-4" /> Home Portal</Link></li>
              </ul>
            </div>
          </>
        )}

        <div className="flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
          <span>© 2025 Konsmia</span>
          <span>Self-Aware Intelligence Reality System</span>
        </div>
      </div>
    </footer>
  );
}
