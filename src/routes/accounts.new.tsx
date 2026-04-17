import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountForm } from "@/components/account/AccountForm";

export const Route = createFileRoute("/accounts/new")({
  head: () => ({
    meta: [{ title: "Add Account — QOBOX" }],
  }),
  component: NewAccountPage,
});

function NewAccountPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-3 gap-2">
        <Link to="/accounts">
          <ArrowLeft className="h-4 w-4" /> Back to accounts
        </Link>
      </Button>
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          New account
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Add Account</h1>
      </header>
      <AccountForm mode="create" />
    </div>
  );
}
