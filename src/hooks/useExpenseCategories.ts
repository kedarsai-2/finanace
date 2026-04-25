import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type ExpenseCategoryRecord } from "@/types/expense";
import { logAudit, snapshot } from "@/lib/audit";
import { USE_BACKEND } from "@/lib/flags";
import { apiFetch } from "@/lib/api";
import { getJwt } from "@/lib/auth";
import { businessRefFromId, toNumId, toStrId } from "@/lib/dto";

const STORAGE_KEY = "bm.expenseCategories";
const SEEDED_KEY = "bm.expenseCategoriesSeeded";

type ExpenseCategoryDTO = {
  id?: number;
  name: string;
  deleted?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  business?: { id: number; name?: string | null } | null;
};

function dtoToCategory(dto: ExpenseCategoryDTO): ExpenseCategoryRecord {
  const bizId = dto.business?.id;
  return {
    id: toStrId(dto.id),
    businessId: bizId != null ? String(bizId) : "",
    name: dto.name,
    deleted: dto.deleted ?? undefined,
    createdAt: dto.createdAt ?? new Date().toISOString(),
  };
}

function categoryToDto(c: ExpenseCategoryRecord): ExpenseCategoryDTO {
  return {
    id: toNumId(c.id) ?? undefined,
    name: c.name,
    deleted: c.deleted ?? false,
    createdAt: c.createdAt ?? null,
    business: businessRefFromId(c.businessId),
  };
}

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
  seeded[businessId] = true;
  localStorage.setItem(SEEDED_KEY, JSON.stringify(seeded));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function useExpenseCategories(businessId?: string | null) {
  const [categories, setCategories] = useState<ExpenseCategoryRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const token = getJwt();
    if (USE_BACKEND && token) {
      setHydrated(true);
      return;
    }
    let initial = read();
    if (businessId) initial = seedDefaults(initial, businessId);
    setCategories(initial);
    setHydrated(true);
  }, [businessId]);

  useEffect(() => {
    if (!hydrated) return;
    const token = getJwt();
    if (USE_BACKEND && token) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  }, [categories, hydrated]);

  useEffect(() => {
    const token = getJwt();
    if (!USE_BACKEND || !token) return;
    const biz = businessId ? parseInt(businessId, 10) : NaN;
    if (!businessId || isNaN(biz)) {
      setCategories([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await apiFetch<ExpenseCategoryDTO[]>(
          `/api/expense-categories?businessId.equals=${biz}&size=200&sort=id,asc`,
        );
        if (cancelled) return;
        setCategories(list.map(dtoToCategory));
      } catch {
        if (cancelled) return;
        setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const categoriesRef = useRef<ExpenseCategoryRecord[]>(categories);
  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

  const upsert = useCallback((c: ExpenseCategoryRecord) => {
    const token = getJwt();
    if (USE_BACKEND && token) {
      return (async () => {
        const before = categoriesRef.current.find((x) => x.id === c.id);
        const isUpdate = /^\d+$/.test(c.id);
        const dto = categoryToDto(c);
        dto.createdAt = dto.createdAt ?? before?.createdAt ?? new Date().toISOString();
        if (!isUpdate) {
          delete dto.id;
        }
        const saved = await apiFetch<ExpenseCategoryDTO>(
          isUpdate ? `/api/expense-categories/${c.id}` : "/api/expense-categories",
          { method: isUpdate ? "PUT" : "POST", body: JSON.stringify(dto) },
        );
        const mapped = dtoToCategory(saved);
        setCategories((prev) => {
          const exists = prev.some((x) => x.id === mapped.id);
          return exists ? prev.map((x) => (x.id === mapped.id ? mapped : x)) : [...prev, mapped];
        });
        return mapped;
      })();
    }
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
    return Promise.resolve(c);
  }, []);

  const remove = useCallback(async (id: string) => {
    const before = categoriesRef.current.find((x) => x.id === id);
    const token = getJwt();
    if (USE_BACKEND && token) {
      await apiFetch<void>(`/api/expense-categories/${id}`, { method: "DELETE" });
      setCategories((prev) => prev.filter((x) => x.id !== id));
      return;
    }
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, deleted: true } : c)));
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
    return;
  }, []);

  const scoped = useMemo(
    () => categories.filter((c) => !c.deleted && (!businessId || c.businessId === businessId)),
    [categories, businessId],
  );

  return { categories: scoped, allCategories: categories, hydrated, upsert, remove };
}
