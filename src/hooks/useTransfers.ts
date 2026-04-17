import { useCallback, useEffect, useState } from "react";
import type { Transfer } from "@/types/account";
import { logAudit, snapshot } from "@/lib/audit";

const STORAGE_KEY = "bm.transfers";

function read(): Transfer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Transfer[]) : [];
  } catch {
    return [];
  }
}

export function useTransfers(businessId?: string | null) {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTransfers(read());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transfers));
  }, [transfers, hydrated]);

  const add = useCallback((t: Transfer) => {
    setTransfers((prev) => [...prev, t]);
    logAudit({
      module: "transfer",
      action: "create",
      recordId: t.id,
      reference: `Transfer · ₹${t.amount}`,
      businessId: t.businessId,
      after: snapshot(t),
    });
  }, []);

  const scoped = businessId
    ? transfers.filter((t) => t.businessId === businessId)
    : transfers;

  return { transfers: scoped, allTransfers: transfers, hydrated, add };
}
