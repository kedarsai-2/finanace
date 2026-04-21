import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Expense } from "@/types/expense";
import { logAudit, snapshot } from "@/lib/audit";
import { USE_BACKEND } from "@/lib/flags";
import { apiFetch } from "@/lib/api";
import { getJwt } from "@/lib/auth";
import { businessRefFromId, toNumId, toStrId } from "@/lib/dto";

const STORAGE_KEY = "bm.expenses";

type ExpenseDTO = {
  id?: number;
  date: string;
  amount: number;
  category: string;
  mode?: "CASH" | "BANK" | "UPI" | null;
  reference?: string | null;
  notes?: string | null;
  deleted?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  business?: { id: number } | null;
  party?: { id: number; name?: string | null } | null;
  account?: { id: number; name?: string | null } | null;
};

function dtoToExpense(dto: ExpenseDTO): Expense {
  const bizId = dto.business?.id;
  const partyId = dto.party?.id;
  const accountId = dto.account?.id;
  const mode =
    dto.mode === "BANK" ? "bank" : dto.mode === "UPI" ? "upi" : dto.mode === "CASH" ? "cash" : undefined;
  return {
    id: toStrId(dto.id),
    businessId: bizId != null ? String(bizId) : "",
    date: dto.date,
    amount: Number(dto.amount ?? 0),
    category: dto.category,
    mode,
    reference: dto.reference ?? undefined,
    notes: dto.notes ?? undefined,
    deleted: dto.deleted ?? undefined,
    createdAt: dto.createdAt ?? new Date().toISOString(),
    updatedAt: dto.updatedAt ?? undefined,
    partyId: partyId != null ? String(partyId) : undefined,
    accountId: accountId != null ? String(accountId) : "",
  };
}

function expenseToDto(e: Expense): ExpenseDTO {
  const mode = e.mode === "bank" ? "BANK" : e.mode === "upi" ? "UPI" : e.mode === "cash" ? "CASH" : null;
  return {
    id: toNumId(e.id) ?? undefined,
    date: e.date,
    amount: e.amount,
    category: e.category,
    mode,
    reference: e.reference ?? null,
    notes: e.notes ?? null,
    deleted: e.deleted ?? false,
    business: businessRefFromId(e.businessId),
    party: e.partyId ? { id: parseInt(e.partyId, 10) } : null,
    account: e.accountId ? { id: parseInt(e.accountId, 10) } : null,
  };
}

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
    const token = getJwt();
    if (USE_BACKEND && token) {
      setHydrated(true);
      return;
    }
    setExpenses(read());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const token = getJwt();
    if (USE_BACKEND && token) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses, hydrated]);

  useEffect(() => {
    const token = getJwt();
    if (!USE_BACKEND || !token) return;
    const biz = businessId ? parseInt(businessId, 10) : NaN;
    if (!businessId || isNaN(biz)) {
      setExpenses([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await apiFetch<ExpenseDTO[]>(
          `/api/expenses?businessId.equals=${biz}&size=300&sort=date,desc`,
        );
        if (cancelled) return;
        setExpenses(list.map(dtoToExpense));
      } catch {
        if (cancelled) return;
        setExpenses([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const expensesRef = useRef<Expense[]>(expenses);
  useEffect(() => {
    expensesRef.current = expenses;
  }, [expenses]);

  const upsert = useCallback((e: Expense) => {
    const token = getJwt();
    if (USE_BACKEND && token) {
      return (async () => {
        const isUpdate = /^\d+$/.test(e.id);
        const dto = expenseToDto(e);
        if (!isUpdate) delete dto.id;
        const saved = await apiFetch<ExpenseDTO>(
          isUpdate ? `/api/expenses/${e.id}` : "/api/expenses",
          { method: isUpdate ? "PUT" : "POST", body: JSON.stringify(dto) },
        );
        const mapped = dtoToExpense(saved);
        setExpenses((prev) => {
          const exists = prev.some((x) => x.id === mapped.id);
          return exists ? prev.map((x) => (x.id === mapped.id ? mapped : x)) : [mapped, ...prev];
        });
        return mapped;
      })();
    }
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
    return Promise.resolve(e);
  }, []);

  const add = useCallback((e: Expense) => {
    const token = getJwt();
    if (USE_BACKEND && token) {
      // In backend mode, treat add() as create.
      void upsert(e);
      return;
    }
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
    const token = getJwt();
    if (USE_BACKEND && token) {
      (async () => {
        try {
          await apiFetch<void>(`/api/expenses/${id}`, { method: "DELETE" });
          setExpenses((prev) => prev.filter((x) => x.id !== id));
        } catch {
          // ignore
        }
      })();
      return;
    }
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

  const scoped = useMemo(
    () =>
      (businessId
        ? expenses.filter((e) => e.businessId === businessId)
        : expenses
      ).filter((e) => !e.deleted),
    [expenses, businessId],
  );

  return { expenses: scoped, allExpenses: expenses, hydrated, add, upsert, remove };
}
