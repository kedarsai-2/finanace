import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountForm } from "@/components/account/AccountForm";
import { useAccounts } from "@/hooks/useAccounts";
import { useBusinesses } from "@/hooks/useBusinesses";

export const Route = createFileRoute("/accounts/$id/edit")({
  head: () => ({
    meta: [{ title: "Edit Account — Ledgerly" }],
  }),
  component: EditAccountPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-lg font-semibold">Account not found</h1>
      <Button asChild className="mt-4">
        <Link to="/accounts">Back to accounts</Link>
      </Button>
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-sm text-destructive">{error.message}</p>
        <Button
          className="mt-4"
          onClick={() => {
            router.invalidate();
            reset();
          }}
        >
          Retry
        </Button>
      </div>
    );
  },
});

function EditAccountPage() {
  const { id } = Route.useParams();
  const { activeId } = useBusinesses();
  const { accounts, hydrated } = useAccounts(activeId, []);
  const account = accounts.find((a) => a.id === id);

  if (!hydrated) {
    return <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">Loading…</div>;
  }
  if (!account) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-lg font-semibold">Account not found</h1>
        <Button asChild className="mt-4">
          <Link to="/accounts">Back to accounts</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-3 gap-2">
        <Link to="/accounts">
          <ArrowLeft className="h-4 w-4" /> Back to accounts
        </Link>
      </Button>
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Edit account
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{account.name}</h1>
      </header>
      <AccountForm mode="edit" account={account} />
    </div>
  );
}
