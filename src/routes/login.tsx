import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2, LockKeyhole, Mail, Phone, Users } from "lucide-react";
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
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10"
      style={{ background: "var(--gradient-login-overlay)" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(190,230,255,0.24)_0%,transparent_45%),radial-gradient(circle_at_80%_80%,rgba(91,140,255,0.2)_0%,transparent_48%)]" />

      <div className="relative z-10 grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_460px] lg:items-end">
        <div className="hidden text-white lg:block">
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/35 bg-white/15 backdrop-blur">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <h2 className="text-5xl font-bold leading-tight">QOBOX</h2>
          <p className="mt-2 max-w-md text-lg text-white/85">Smart Mandi Platform</p>
          <p className="mt-5 max-w-md text-sm text-white/80">
            Digitize your mandi operations with modern workflows for billing, settlement, and
            trading.
          </p>
        </div>

        <div className="rounded-[28px] border border-white/30 bg-white/12 p-5 text-white shadow-[0_18px_40px_-20px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/35 bg-white/15">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <h1 className="text-center text-4xl font-bold tracking-tight">Welcome Back</h1>
          <p className="mt-1 text-center text-white/80">Sign in as Trader or Trader Staff</p>

          <div className="mt-5 grid grid-cols-2 rounded-2xl border border-white/25 bg-white/10 p-1 text-sm">
            <button type="button" className="rounded-xl bg-white px-3 py-2 font-semibold text-[#4a77f6]">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                Trader / Staff
              </span>
            </button>
            <button type="button" className="rounded-xl px-3 py-2 text-white/85">
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-4 w-4" />
                Contact / Guest
              </span>
            </button>
          </div>

          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <div className="grid grid-cols-2 rounded-2xl border border-white/25 bg-white/10 p-1 text-sm">
              <button
                type="button"
                className="rounded-xl bg-white px-3 py-2 font-semibold text-[#4a77f6]"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-4 w-4" />
                  Phone + OTP
                </span>
              </button>
              <button type="button" className="rounded-xl px-3 py-2 text-white/85">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  Email
                </span>
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="sr-only">
                Username
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
                placeholder="Enter username or mobile number"
                className="h-12 rounded-xl border-white/45 bg-white text-[#4a77f6] placeholder:text-[#6ea8ff]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="sr-only">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
                placeholder="Enter password"
                className="h-12 rounded-xl border-white/45 bg-white text-[#4a77f6] placeholder:text-[#6ea8ff]"
              />
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-xl bg-white text-xl font-semibold text-[#3e73f4] hover:bg-white/95"
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-center text-xs text-white/80">
              Need a user account?{" "}
              <Link to="/register" className="font-semibold text-white underline decoration-white/60">
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
