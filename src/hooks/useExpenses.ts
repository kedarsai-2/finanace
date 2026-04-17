import { useCallback, useEffect, useState } from "react";
import type { Expense } from "@/types/expense";

const STORAGE_KEY = "bm.expenses";

function read(): Expense[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Expense[]) : [];
  } catch {
    return [];
  }
}

export function useExpenses(businessId?: string | null) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setExpenses(read());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses, hydrated]);

  const upsert = useCallback((e: Expense) => {
    setExpenses((prev) => {
      const exists = prev.some((x) => x.id === e.id);
      return exists ? prev.map((x) => (x.id === e.id ? e : x)) : [...prev, e];
    });
  }, []);

  const add = useCallback((e: Expense) => {
    setExpenses((prev) => [...prev, e]);
  }, []);

  const remove = useCallback((id: string) => {
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, deleted: true, updatedAt: new Date().toISOString() } : e,
      ),
    );
  }, []);

  const scoped = (businessId
    ? expenses.filter((e) => e.businessId === businessId)
    : expenses
  ).filter((e) => !e.deleted);

  return { expenses: scoped, allExpenses: expenses, hydrated, add, upsert, remove };
}
