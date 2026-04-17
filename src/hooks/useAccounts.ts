import { useCallback, useEffect, useRef, useState } from "react";
import type { Account } from "@/types/account";
import { DEFAULT_ACCOUNT_SEEDS } from "@/types/account";
import { logAudit, snapshot } from "@/lib/audit";

const STORAGE_KEY = "bm.accounts";
const SEEDED_KEY = "bm.accountsSeeded";

function read(): Account[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Account[]) : [];
  } catch {
    return [];
  }
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
    const initial = read();
    const ids = allBusinessIds.length
      ? allBusinessIds
      : businessId
        ? [businessId]
        : [];
    const migrated = migrateDefaults(initial, ids);
    setAccounts(migrated);
    if (migrated.length !== initial.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, allBusinessIds.join(",")]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  }, [accounts, hydrated]);

  const accountsRef = useRef<Account[]>(accounts);
  useEffect(() => {
    accountsRef.current = accounts;
  }, [accounts]);

  const upsert = useCallback((a: Account) => {
    const before = accountsRef.current.find((x) => x.id === a.id);
    setAccounts((prev) => {
      const exists = prev.some((x) => x.id === a.id);
      return exists ? prev.map((x) => (x.id === a.id ? a : x)) : [...prev, a];
    });
    logAudit({
      module: "account",
      action: before ? "edit" : "create",
      recordId: a.id,
      reference: a.name,
      refLink: `/accounts/${a.id}`,
      businessId: a.businessId,
      before: before ? snapshot(before) : null,
      after: snapshot(a),
    });
  }, []);

  const remove = useCallback((id: string) => {
    const before = accountsRef.current.find((x) => x.id === id);
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

  const scoped = accounts.filter(
    (a) => !a.deleted && (!businessId || a.businessId === businessId),
  );

  return { accounts: scoped, allAccounts: accounts, hydrated, upsert, remove };
}
