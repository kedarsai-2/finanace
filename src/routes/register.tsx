import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { USE_BACKEND } from "@/lib/flags";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [{ title: "Register - QOBOX" }],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    login: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!USE_BACKEND) {
      toast.info("Backend mode is disabled. Set VITE_USE_BACKEND=1 to enable registration.");
      return;
    }
    setLoading(true);
    try {
      await register({
        login: form.login.trim(),
        firstName: form.firstName.trim() || undefined,
        lastName: form.lastName.trim() || undefined,
        email: form.email.trim() || undefined,
        password: form.password,
      });
      toast.success("Registration successful. Please sign in.");
      navigate({ to: "/login" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Create account</h1>
            <p className="text-sm text-muted-foreground">Register a user login for APK access.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="login">Username</Label>
            <Input
              id="login"
              value={form.login}
              onChange={(e) => setForm((p) => ({ ...p, login: e.target.value }))}
              autoComplete="username"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              autoComplete="new-password"
              required
            />
          </div>

          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Register
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
