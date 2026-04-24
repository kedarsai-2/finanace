import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Plus, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useExpenses } from "@/hooks/useExpenses";
import { useExpenseCategories } from "@/hooks/useExpenseCategories";

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
  const { categories, upsert, remove } = useExpenseCategories(activeId);
  const [name, setName] = useState("");

  const usageByCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of expenses) m.set(e.category, (m.get(e.category) ?? 0) + 1);
    return m;
  }, [expenses]);

  const onAdd = async () => {
    const trimmed = name.trim();
    if (!activeId) return toast.error("Select business first");
    if (!trimmed) return toast.error("Enter category name");
    const exists = categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) return toast.error("Category already exists");
    await upsert({
      id: `cat_${Date.now().toString(36)}`,
      businessId: activeId,
      name: trimmed,
      createdAt: new Date().toISOString(),
    });
    setName("");
    toast.success("Category added");
  };

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
            Manage category names. Expense type remains fixed as Direct or Indirect.
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-border bg-card p-4">
        <p className="mb-2 text-sm text-muted-foreground">
          Expense type is fixed: <span className="font-medium text-foreground">Direct</span> or{" "}
          <span className="font-medium text-foreground">Indirect</span>.
        </p>
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Add expense category (e.g. Travel)"
          />
          <Button onClick={onAdd} className="gap-2">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <ul className="divide-y divide-border">
          {categories.map((category) => {
            const usage = usageByCategory.get(category.name) ?? 0;
            return (
              <li key={category.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30">
                <div className="flex-1">
                  <p className="text-sm font-medium">{category.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {usage} {usage === 1 ? "expense" : "expenses"}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive"
                  onClick={() => {
                    remove(category.id);
                    toast.success("Category deleted");
                  }}
                  aria-label="Delete category"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
