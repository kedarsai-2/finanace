import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
  useRouter,
  useRouterState,
  redirect,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AIAskDrawer } from "@/components/ai/AIAskDrawer";
import { Toaster } from "@/components/ui/sonner";
import { useDashboardSnapshot } from "@/hooks/useDashboardSnapshot";
import appCss from "../styles.css?url";
import { USE_BACKEND } from "@/lib/flags";
import { useAuth } from "@/hooks/useAuth";
import { getJwt } from "@/lib/auth";

function ClickProbe() {
  const [last, setLast] = useState<{ t: number; tag: string; prevented: boolean } | null>(null);
  const router = useRouter();
  const pathname =
    // TanStack Router v1 exposes location via state; fall back to window.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((router as any).state?.location?.pathname as string | undefined) ??
    (typeof window !== "undefined" ? window.location.pathname : "");

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      setLast({
        t: Date.now(),
        tag: el?.tagName?.toLowerCase() ?? "unknown",
        prevented: e.defaultPrevented,
      });
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, []);

  if (!import.meta.env.DEV) return null;
  return (
    <div className="fixed bottom-2 left-2 z-9999 rounded-md border bg-background/90 px-2 py-1 text-xs text-foreground shadow">
      <div className="font-mono">
        click-probe:{" "}
        {last ? `${new Date(last.t).toLocaleTimeString()} <${last.tag}>` : "no clicks yet"}
      </div>
      <div className="font-mono text-muted-foreground">path: {pathname || "(unknown)"}</div>
      {last?.prevented ? (
        <div className="font-mono text-destructive">defaultPrevented=true</div>
      ) : null}
    </div>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    if (!USE_BACKEND) return;
    const token = getJwt();
    if (!token && location.pathname !== "/login") {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "QOBOX — Invoicing, Billing, Accounting" },
      { name: "description", content: "Manage all your businesses, GST profiles and books in one place." },
      { name: "author", content: "QOBOX" },
      { property: "og:title", content: "QOBOX — Invoicing, Billing, Accounting" },
      { name: "twitter:title", content: "QOBOX — Invoicing, Billing, Accounting" },
      { property: "og:description", content: "Manage all your businesses, GST profiles and books in one place." },
      { name: "twitter:description", content: "Manage all your businesses, GST profiles and books in one place." },
      { name: "twitter:card", content: "summary" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isAuthed } = useAuth();
  const snapshot = useDashboardSnapshot();

  const isAuthScreen = pathname === "/login";
  const shouldGate = USE_BACKEND && !isAuthed && !isAuthScreen;

  if (shouldGate) {
    return (
      <div className="min-h-screen">
        {/* Redirecting to /login */}
        <Toaster richColors position="top-right" />
      </div>
    );
  }

  if (isAuthScreen) {
    return (
      <div className="min-h-screen">
        <Outlet />
        <Toaster richColors position="top-right" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <ClickProbe />
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <Outlet />
      </div>
      <AIAskDrawer snapshot={snapshot} />
      <Toaster richColors position="top-right" />
    </div>
  );
}
