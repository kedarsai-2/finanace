import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, Pencil, Plus, Tags, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useExpenseCategories } from "@/hooks/useExpenseCategories";
import { useExpenses } from "@/hooks/useExpenses";
import type { ExpenseCategoryRecord } from "@/types/expense";

export const Route = createFileRoute("/categories/expense")({
  head: () => ({
    meta: [
      { title: "Expense Categories" },
      {
        name: "description",
        content:
          "Manage the categories used when recording business expenses.",
      },
    ],
  }),
  component: ExpenseCategoriesPage,
});

function ExpenseCategoriesPage() {
  const { activeId } = useBusinesses();
  const { categories, upsert, remove } = useExpenseCategories(activeId);
  const { expenses } = useExpenses(activeId);

  const usageByName = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of expenses) m.set(e.category, (m.get(e.category) ?? 0) + 1);
    return m;
  }, [expenses]);

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleAdd = () => {
    if (!activeId) return toast.error("Select a business first");
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (
      categories.some(
        (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      return toast.error("That category already exists");
    }
    const cat: ExpenseCategoryRecord = {
      id: `cat_${Date.now().toString(36)}`,
      businessId: activeId,
      name: trimmed,
      createdAt: new Date().toISOString(),
    };
    upsert(cat);
    setNewName("");
    toast.success("Category added");
  };

  const startEdit = (c: ExpenseCategoryRecord) => {
    setEditingId(c.id);
    setEditingName(c.name);
  };

  const saveEdit = (c: ExpenseCategoryRecord) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    upsert({ ...c, name: trimmed });
    setEditingId(null);
    toast.success("Category updated");
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
          <h1 className="text-2xl font-semibold tracking-tight">
            Expense Categories
          </h1>
          <p className="text-xs text-muted-foreground">
            Used in the expense form dropdown. Categories in use can't be
            deleted.
          </p>
        </div>
      </div>

      <div className="mb-6 flex gap-2 rounded-xl border border-border bg-card p-3">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        {categories.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            No categories yet
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {categories.map((c) => {
              const usage = usageByName.get(c.name) ?? 0;
              const isEditing = editingId === c.id;
              return (
                <li
                  key={c.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30"
                >
                  {isEditing ? (
                    <Input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(c);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="max-w-xs"
                    />
                  ) : (
                    <div className="flex-1">
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {usage} {usage === 1 ? "expense" : "expenses"}
                      </p>
                    </div>
                  )}
                  <div className="ml-auto flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => saveEdit(c)}
                          aria-label="Save"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setEditingId(null)}
                          aria-label="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => startEdit(c)}
                          aria-label="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive"
                              disabled={usage > 0}
                              aria-label="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete "{c.name}"?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This soft-deletes the category. It will no
                                longer appear in the expense form.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  remove(c.id);
                                  toast.success("Category deleted");
                                }}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
