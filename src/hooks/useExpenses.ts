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

  const add = useCallback((e: Expense) => {
    setExpenses((prev) => [...prev, e]);
  }, []);

  const remove = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const scoped = businessId
    ? expenses.filter((e) => e.businessId === businessId)
    : expenses;

  return { expenses: scoped, allExpenses: expenses, hydrated, add, remove };
}
