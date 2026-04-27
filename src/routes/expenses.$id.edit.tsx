import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ExpenseForm } from "@/components/expense/ExpenseForm";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useExpenses } from "@/hooks/useExpenses";
import { verifyActionPassword } from "@/lib/actionPassword";

export const Route = createFileRoute("/expenses/$id/edit")({
  head: () => ({
    meta: [{ title: "Edit expense" }],
  }),
  component: EditExpensePage,
});

function EditExpensePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { activeId } = useBusinesses();
  const { allExpenses } = useExpenses(activeId);

  const expense = allExpenses.find((e) => e.id === id);

  useEffect(() => {
    if (verifyActionPassword()) return;
    navigate({ to: "/expenses/$id", params: { id } });
  }, [navigate, id]);

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link to="/expenses/$id" params={{ id }}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Editing
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Expense</h1>
        </div>
      </header>
      <ExpenseForm
        initial={expense}
        onSaved={() => navigate({ to: "/expenses/$id", params: { id } })}
        onCancel={() => navigate({ to: "/expenses/$id", params: { id } })}
      />
    </div>
  );
}
