import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountForm } from "@/components/account/AccountForm";

export const Route = createFileRoute("/cash/new")({
  head: () => ({
    meta: [{ title: "Add Cash Account — QOBOX" }],
  }),
  component: NewCashAccountPage,
});

function NewCashAccountPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-3 gap-2">
        <Link to="/cash">
          <ArrowLeft className="h-4 w-4" /> Back to cash
        </Link>
      </Button>
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          New cash account
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Add Cash Account</h1>
      </header>
      <AccountForm mode="create" defaultType="cash" returnTo="/cash" />
    </div>
  );
}

