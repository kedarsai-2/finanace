import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowLeft, Tags } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useExpenses } from "@/hooks/useExpenses";
import { DEFAULT_EXPENSE_CATEGORIES } from "@/types/expense";

export const Route = createFileRoute("/categories/expense")({
  head: () => ({
    meta: [
      { title: "Expense Categories" },
      {
        name: "description",
        content: "Manage the categories used when recording business expenses.",
      },
    ],
  }),
  component: ExpenseCategoriesPage,
});

function ExpenseCategoriesPage() {
  const { activeId } = useBusinesses();
  const { expenses } = useExpenses(activeId);

  const usageByCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of expenses) m.set(e.category, (m.get(e.category) ?? 0) + 1);
    return m;
  }, [expenses]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link to="/expenses">
            <ArrowLeft className="h-4 w-4" /> Back to expenses
          </Link>
        </Button>
      </header>

      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Tags className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expense Categories</h1>
          <p className="text-xs text-muted-foreground">
            Categories are fixed system values. Choose one while recording each expense.
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        Available categories:
        <span className="ml-1 font-medium text-foreground">Direct</span>
        <span className="mx-1">•</span>
        <span className="font-medium text-foreground">Indirect</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <ul className="divide-y divide-border">
          {DEFAULT_EXPENSE_CATEGORIES.map((category) => {
            const usage = usageByCategory.get(category) ?? 0;
            const label = category === "direct" ? "Direct" : "Indirect";
            return (
              <li key={category} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30">
                <div className="flex-1">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">
                    {usage} {usage === 1 ? "expense" : "expenses"}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
