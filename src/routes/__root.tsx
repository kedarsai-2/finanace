import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AIAskDrawer } from "@/components/ai/AIAskDrawer";
import { Toaster } from "@/components/ui/sonner";
import { useDashboardSnapshot } from "@/hooks/useDashboardSnapshot";
import appCss from "../styles.css?url";

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
  const snapshot = useDashboardSnapshot();
  return (
    <div className="flex min-h-screen w-full">
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
