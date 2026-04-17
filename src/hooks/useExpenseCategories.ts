import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  type ExpenseCategoryRecord,
} from "@/types/expense";

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

  const upsert = useCallback((c: ExpenseCategoryRecord) => {
    setCategories((prev) => {
      const exists = prev.some((x) => x.id === c.id);
      return exists ? prev.map((x) => (x.id === c.id ? c : x)) : [...prev, c];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, deleted: true } : c)),
    );
  }, []);

  const scoped = categories.filter(
    (c) => !c.deleted && (!businessId || c.businessId === businessId),
  );

  return { categories: scoped, allCategories: categories, hydrated, upsert, remove };
}
