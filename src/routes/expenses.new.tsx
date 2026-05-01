import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ExpenseForm } from "@/components/expense/ExpenseForm";

export const Route = createFileRoute("/expenses/new")({
  head: () => ({
    meta: [
      { title: "Add Expense - QOBOX" },
      { name: "description", content: "Record a new business expense." },
    ],
  }),
  component: NewExpensePage,
});

function NewExpensePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link to="/expenses">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            New entry
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Add Expense</h1>
        </div>
      </header>
      <ExpenseForm />
    </div>
  );
}
