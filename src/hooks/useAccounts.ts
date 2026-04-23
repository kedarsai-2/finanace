import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Account } from "@/types/account";
import { DEFAULT_ACCOUNT_SEEDS } from "@/types/account";
import { logAudit, snapshot } from "@/lib/audit";
import { USE_BACKEND } from "@/lib/flags";
import { apiFetch } from "@/lib/api";
import { getJwt } from "@/lib/auth";
import { businessRefFromId, toNumId, toStrId } from "@/lib/dto";

const STORAGE_KEY = "bm.accounts";
const SEEDED_KEY = "bm.accountsSeeded";

type AccountDTO = {
  id?: number;
  name: string;
  type: "CASH" | "BANK" | "UPI";
  openingBalance: number;
  accountNumber?: string | null;
  ifsc?: string | null;
  upiId?: string | null;
  notes?: string | null;
  deleted?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  business?: { id: number; name?: string | null } | null;
};

function dtoToAccount(dto: AccountDTO): Account {
  // Legacy UPI accounts surface as "bank" — UPI as a separate type is retired.
  const rawType = String(dto.type ?? "").toUpperCase();
  const type: Account["type"] = rawType === "CASH" ? "cash" : "bank";
  const bizId = dto.business?.id;
  return {
    id: toStrId(dto.id),
    businessId: bizId != null ? String(bizId) : "",
    name: dto.name,
    type,
    openingBalance: Number(dto.openingBalance ?? 0),
    accountNumber: dto.accountNumber ?? undefined,
    ifsc: dto.ifsc ?? undefined,
    upiId: dto.upiId ?? undefined,
    notes: dto.notes ?? undefined,
    deleted: dto.deleted ?? undefined,
    createdAt: dto.createdAt ?? new Date().toISOString(),
  };
}

function accountToDto(a: Account): AccountDTO {
  const type = a.type === "cash" ? "CASH" : "BANK";
  return {
    id: toNumId(a.id) ?? undefined,
    name: a.name,
    type,
    openingBalance: a.openingBalance ?? 0,
    accountNumber: a.accountNumber ?? null,
    ifsc: a.ifsc ?? null,
    upiId: a.upiId ?? null,
    notes: a.notes ?? null,
    deleted: a.deleted ?? false,
    business: businessRefFromId(a.businessId),
  };
}

function read(): Account[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Account[]) : [];
  } catch {
    return [];
  }
}

function normalizeLocalIds(existing: Account[]): { accounts: Account[]; changed: boolean } {
  let changed = false;
  const accounts = existing.map((a) => {
    if (a && a.id) return a;
    changed = true;
    return {
      ...a,
      id: `acc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    } as Account;
  });
  return { accounts, changed };
}

/**
 * Ensures every business has Cash / Bank / UPI default accounts on first load.
 * Idempotent — driven by the SEEDED_KEY marker per business.
 */
function migrateDefaults(existing: Account[], businessIds: string[]): Account[] {
  if (typeof window === "undefined") return existing;
  let seededRaw: Record<string, true> = {};
  try {
    seededRaw = JSON.parse(localStorage.getItem(SEEDED_KEY) ?? "{}");
  } catch {
    seededRaw = {};
  }
  const next = [...existing];
  let changed = false;
  for (const bid of businessIds) {
    if (seededRaw[bid]) continue;
    for (const seed of DEFAULT_ACCOUNT_SEEDS) {
      next.push({
        id: `acc_${bid}_${seed.type}`,
        businessId: bid,
        name: seed.name,
        type: seed.type,
        openingBalance: seed.openingBalance,
        createdAt: new Date().toISOString(),
      });
    }
    seededRaw[bid] = true;
    changed = true;
  }
  if (changed) {
    localStorage.setItem(SEEDED_KEY, JSON.stringify(seededRaw));
  }
  return next;
}

export function useAccounts(businessId?: string | null, allBusinessIds: string[] = []) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const token = getJwt();
    if (USE_BACKEND && token) {
      setHydrated(true);
      return;
    }
    const initial = read();
    const ids = allBusinessIds.length
      ? allBusinessIds
      : businessId
        ? [businessId]
        : [];
    const migrated = migrateDefaults(initial, ids);
    const normalized = normalizeLocalIds(migrated);
    setAccounts(normalized.accounts);
    if (migrated.length !== initial.length || normalized.changed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized.accounts));
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, allBusinessIds.join(",")]);

  useEffect(() => {
    if (!hydrated) return;
    const token = getJwt();
    if (USE_BACKEND && token) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  }, [accounts, hydrated]);

  useEffect(() => {
    const token = getJwt();
    if (!USE_BACKEND || !token) return;
    const biz = businessId ? parseInt(businessId, 10) : NaN;
    if (!businessId || isNaN(biz)) {
      setAccounts([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await apiFetch<AccountDTO[]>(
          `/api/accounts?businessId.equals=${biz}&size=200&sort=id,desc`,
        );
        if (cancelled) return;
        setAccounts(list.map(dtoToAccount).filter((a) => !!a.id));
      } catch {
        if (cancelled) return;
        setAccounts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);


  const accountsRef = useRef<Account[]>(accounts);
  useEffect(() => {
    accountsRef.current = accounts;
  }, [accounts]);

  const upsert = useCallback((a: Account) => {
    const token = getJwt();
    if (USE_BACKEND && token) {
      return (async () => {
        const isUpdate = /^\d+$/.test(a.id);
        const dto = accountToDto(a);
        if (!isUpdate) delete dto.id;
        const saved = await apiFetch<AccountDTO>(
          isUpdate ? `/api/accounts/${a.id}` : "/api/accounts",
          { method: isUpdate ? "PUT" : "POST", body: JSON.stringify(dto) },
        );
        const mapped = dtoToAccount(saved);
        if (!mapped.id) {
          throw new Error("Account save failed: missing id");
        }
        setAccounts((prev) => {
          const exists = prev.some((x) => x.id === mapped.id);
          return exists ? prev.map((x) => (x.id === mapped.id ? mapped : x)) : [mapped, ...prev];
        });
        return mapped;
      })();
    }
    const local: Account = {
      ...a,
      id:
        a.id ||
        `acc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    };
    const before = accountsRef.current.find((x) => x.id === local.id);
    setAccounts((prev) => {
      const exists = prev.some((x) => x.id === local.id);
      return exists
        ? prev.map((x) => (x.id === local.id ? local : x))
        : [...prev, local];
    });
    logAudit({
      module: "account",
      action: before ? "edit" : "create",
      recordId: local.id,
      reference: local.name,
      refLink: `/accounts/${local.id}`,
      businessId: local.businessId,
      before: before ? snapshot(before) : null,
      after: snapshot(local),
    });
    return Promise.resolve(local);
  }, []);

  const remove = useCallback((id: string) => {
    const before = accountsRef.current.find((x) => x.id === id);
    const token = getJwt();
    if (USE_BACKEND && token) {
      (async () => {
        try {
          await apiFetch<void>(`/api/accounts/${id}`, { method: "DELETE" });
          setAccounts((prev) => prev.filter((x) => x.id !== id));
        } catch {
          // ignore
        }
      })();
      return;
    }
    setAccounts((prev) => prev.map((x) => (x.id === id ? { ...x, deleted: true } : x)));
    if (before) {
      logAudit({
        module: "account",
        action: "delete",
        recordId: id,
        reference: before.name,
        businessId: before.businessId,
        before: snapshot(before),
      });
    }
  }, []);

  const scoped = useMemo(
    () =>
      accounts.filter(
        (a) => !a.deleted && (!businessId || a.businessId === businessId),
      ),
    [accounts, businessId],
  );

  return { accounts: scoped, allAccounts: accounts, hydrated, upsert, remove };
}
