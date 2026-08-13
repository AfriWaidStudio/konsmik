import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Join — Konsmia" }] }),
  component: SignupPage,
});

function SignupPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: displayName, username },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (!data.session) {
      toast.success("Check your email to confirm your account.");
      return;
    }
    toast.success("Welcome to the Tribe!");
    nav({ to: "/onboarding" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border border-border/60 bg-card p-6">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/40 text-primary">
            <Brain className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-xl font-bold text-primary">Join Konsmia</h1>
          <p className="text-xs text-muted-foreground">Become part of the Tribe of the Future</p>
        </div>
        <div className="space-y-2">
          <Label>Display name</Label>
          <Input required value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-input/40" />
        </div>
        <div className="space-y-2">
          <Label>Username</Label>
          <Input required value={username} onChange={(e) => setUsername(e.target.value)} className="bg-input/40" />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-input/40" />
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="bg-input/40" />
        </div>
        <Button type="submit" disabled={busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Already have an account? <Link to="/login" className="text-primary underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}