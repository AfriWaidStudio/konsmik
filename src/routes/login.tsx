import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Konsmia" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    nav({ to: "/" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border border-border/60 bg-card p-6">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/40 text-primary">
            <Brain className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-xl font-bold text-primary">Welcome back</h1>
          <p className="text-xs text-muted-foreground">Sign in to Konsmia</p>
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-input/40" />
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="bg-input/40" />
        </div>
        <Button type="submit" disabled={busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          New here? <Link to="/signup" className="text-primary underline">Create account</Link>
        </p>
      </form>
    </div>
  );
}