import { useCallback, useEffect, useRef, useState } from "react";
import type { Expense } from "@/types/expense";
import { logAudit, snapshot } from "@/lib/audit";

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

  const expensesRef = useRef<Expense[]>(expenses);
  useEffect(() => {
    expensesRef.current = expenses;
  }, [expenses]);

  const upsert = useCallback((e: Expense) => {
    const before = expensesRef.current.find((x) => x.id === e.id);
    setExpenses((prev) => {
      const exists = prev.some((x) => x.id === e.id);
      return exists ? prev.map((x) => (x.id === e.id ? e : x)) : [...prev, e];
    });
    logAudit({
      module: "expense",
      action: before ? "edit" : "create",
      recordId: e.id,
      reference: `${e.category} · ₹${e.amount}`,
      refLink: `/expenses/${e.id}`,
      businessId: e.businessId,
      before: before ? snapshot(before) : null,
      after: snapshot(e),
    });
  }, []);

  const add = useCallback((e: Expense) => {
    setExpenses((prev) => [...prev, e]);
    logAudit({
      module: "expense",
      action: "create",
      recordId: e.id,
      reference: `${e.category} · ₹${e.amount}`,
      refLink: `/expenses/${e.id}`,
      businessId: e.businessId,
      after: snapshot(e),
    });
  }, []);

  const remove = useCallback((id: string) => {
    const before = expensesRef.current.find((x) => x.id === id);
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, deleted: true, updatedAt: new Date().toISOString() } : e,
      ),
    );
    if (before) {
      logAudit({
        module: "expense",
        action: "delete",
        recordId: id,
        reference: `${before.category} · ₹${before.amount}`,
        businessId: before.businessId,
        before: snapshot(before),
      });
    }
  }, []);

  const scoped = (businessId
    ? expenses.filter((e) => e.businessId === businessId)
    : expenses
  ).filter((e) => !e.deleted);

  return { expenses: scoped, allExpenses: expenses, hydrated, add, upsert, remove };
}
