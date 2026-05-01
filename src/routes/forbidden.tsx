import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/forbidden")({
  head: () => ({
    meta: [{ title: "Access Denied - QOBOX" }],
  }),
  component: ForbiddenPage,
});

function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold text-foreground">Access denied</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          You do not have permission to view this page. Contact an admin if you need access.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link to="/">Go to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
