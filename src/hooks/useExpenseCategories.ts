import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  type ExpenseCategoryRecord,
} from "@/types/expense";
import { logAudit, snapshot } from "@/lib/audit";

const STORAGE_KEY = "bm.expenseCategories";
const SEEDED_KEY = "bm.expenseCategoriesSeeded";

function read(): ExpenseCategoryRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ExpenseCategoryRecord[]) : [];
  } catch {
    return [];
  }
}

function seedDefaults(existing: ExpenseCategoryRecord[], businessId: string) {
  if (typeof window === "undefined") return existing;
  let seeded: Record<string, true> = {};
  try {
    seeded = JSON.parse(localStorage.getItem(SEEDED_KEY) ?? "{}");
  } catch {
    seeded = {};
  }
  if (seeded[businessId]) return existing;
  const next = [...existing];
  for (const name of DEFAULT_EXPENSE_CATEGORIES) {
    next.push({
      id: `cat_${businessId}_${name.replace(/\s+/g, "_").toLowerCase()}`,
      businessId,
      name,
      createdAt: new Date().toISOString(),
    });
  }
  seeded[businessId] = true;
  localStorage.setItem(SEEDED_KEY, JSON.stringify(seeded));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function useExpenseCategories(businessId?: string | null) {
  const [categories, setCategories] = useState<ExpenseCategoryRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let initial = read();
    if (businessId) initial = seedDefaults(initial, businessId);
    setCategories(initial);
    setHydrated(true);
  }, [businessId]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  }, [categories, hydrated]);

  const categoriesRef = useRef<ExpenseCategoryRecord[]>(categories);
  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

  const upsert = useCallback((c: ExpenseCategoryRecord) => {
    const before = categoriesRef.current.find((x) => x.id === c.id);
    setCategories((prev) => {
      const exists = prev.some((x) => x.id === c.id);
      return exists ? prev.map((x) => (x.id === c.id ? c : x)) : [...prev, c];
    });
    logAudit({
      module: "expenseCategory",
      action: before ? "edit" : "create",
      recordId: c.id,
      reference: c.name,
      businessId: c.businessId,
      before: before ? snapshot(before) : null,
      after: snapshot(c),
    });
  }, []);

  const remove = useCallback((id: string) => {
    const before = categoriesRef.current.find((x) => x.id === id);
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, deleted: true } : c)),
    );
    if (before) {
      logAudit({
        module: "expenseCategory",
        action: "delete",
        recordId: id,
        reference: before.name,
        businessId: before.businessId,
        before: snapshot(before),
      });
    }
  }, []);

  const scoped = categories.filter(
    (c) => !c.deleted && (!businessId || c.businessId === businessId),
  );

  return { categories: scoped, allCategories: categories, hydrated, upsert, remove };
}
