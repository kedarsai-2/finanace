import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { USE_BACKEND } from "@/lib/flags";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Login — QOBOX" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { isAuthed, login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!USE_BACKEND) return;
    if (isAuthed) navigate({ to: "/" });
  }, [isAuthed, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!USE_BACKEND) {
      toast.info("Backend mode is disabled. Set VITE_USE_BACKEND=1 to enable login.");
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
      toast.success("Logged in");
      navigate({ to: "/" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "var(--gradient-login-overlay)" }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground">Use your backend credentials.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
            />
          </div>

          <Button type="submit" className="w-full gap-2 primary-gradient primary-glow" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Sign in
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Need a user account?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
