import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useBusinesses } from "@/hooks/useBusinesses";
import { useExpenses } from "@/hooks/useExpenses";
import { useAccounts } from "@/hooks/useAccounts";
import { useParties, formatCurrency } from "@/hooks/useParties";
import { ACCOUNT_TYPE_LABEL } from "@/types/account";
import { PAYMENT_MODE_LABEL } from "@/types/payment";

export const Route = createFileRoute("/expenses/$id/")({
  head: () => ({
    meta: [{ title: "Expense details" }],
  }),
  component: ExpenseDetailPage,
});

function ExpenseDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { activeId, businesses } = useBusinesses();
  const business = businesses.find((b) => b.id === activeId);
  const currency = business?.currency ?? "INR";

  const { allExpenses, remove } = useExpenses(activeId);
  const { accounts } = useAccounts(activeId, []);
  const { parties } = useParties(activeId);

  const expense = allExpenses.find((e) => e.id === id);

  if (!expense) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-sm font-medium">Expense not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/expenses">Back to expenses</Link>
        </Button>
      </div>
    );
  }

  const account = accounts.find((a) => a.id === expense.accountId);
  const party = expense.partyId
    ? parties.find((p) => p.id === expense.partyId)
    : null;

  const handleDelete = () => {
    remove(expense.id);
    toast.success("Expense deleted");
    navigate({ to: "/expenses" });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link to="/expenses">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/expenses/$id/edit" params={{ id: expense.id }}>
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-2 text-destructive">
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
                <AlertDialogDescription>
                  This soft-deletes the entry and refunds the amount to{" "}
                  {account?.name ?? "the account"}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {expense.category}
            </p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-destructive">
              − {formatCurrency(expense.amount, currency)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {format(new Date(expense.date), "EEEE, dd MMM yyyy")}
            </p>
          </div>
          {expense.mode && (
            <Badge variant="secondary">{PAYMENT_MODE_LABEL[expense.mode]}</Badge>
          )}
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Detail label="Account">
            {account ? (
              <Link
                to="/accounts/$id"
                params={{ id: account.id }}
                className="text-primary hover:underline"
              >
                {account.name} • {ACCOUNT_TYPE_LABEL[account.type]}
              </Link>
            ) : (
              "—"
            )}
          </Detail>
          <Detail label="Party">
            {party ? (
              <Link
                to="/parties/$id"
                params={{ id: party.id }}
                className="text-primary hover:underline"
              >
                {party.name}
              </Link>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </Detail>
          <Detail label="Reference">
            {expense.reference ?? <span className="text-muted-foreground">—</span>}
          </Detail>
          <Detail label="Notes">
            {expense.notes ?? <span className="text-muted-foreground">—</span>}
          </Detail>
        </dl>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold tracking-tight">Timeline</h2>
        <ol className="mt-4 space-y-3 border-l border-border pl-4">
          <li className="relative">
            <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
            <p className="text-sm font-medium">Created</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(expense.createdAt), "dd MMM yyyy, h:mm a")}
            </p>
          </li>
          {expense.updatedAt && (
            <li className="relative">
              <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-muted-foreground" />
              <p className="text-sm font-medium">Last edited</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(expense.updatedAt), "dd MMM yyyy, h:mm a")}
              </p>
            </li>
          )}
        </ol>
      </section>
    </div>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  );
}
