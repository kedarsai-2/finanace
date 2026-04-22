import { useCallback, useEffect, useMemo, useState } from "react";
import type { LedgerEntry } from "@/types/party";
import { USE_BACKEND } from "@/lib/flags";
import { apiFetch } from "@/lib/api";
import { getJwt } from "@/lib/auth";
import { useParties } from "@/hooks/useParties";

export function usePartyLedger(businessId?: string | null, partyId?: string | null) {
  const { ledger: localLedger, hydrated: localHydrated } = useParties();
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(async () => {
    const token = getJwt();
    if (!USE_BACKEND || !token) return;
    if (!businessId || !partyId) {
      setLedger([]);
      return;
    }
    const biz = parseInt(String(businessId), 10);
    const pid = parseInt(String(partyId), 10);
    if (Number.isNaN(biz) || Number.isNaN(pid)) {
      setLedger([]);
      return;
    }
    const list = await apiFetch<
      Array<{
        id: string;
        partyId: string;
        date: string;
        note: string;
        amount: number;
        type?: string;
        refNo?: string;
        refLink?: string;
      }>
    >(`/api/party-ledger?businessId=${biz}&partyId=${pid}`);
    setLedger(
      list.map((e) => ({
        id: e.id,
        partyId: e.partyId,
        date: e.date,
        note: e.note,
        amount: Number(e.amount ?? 0),
        type: e.type as LedgerEntry["type"],
        refNo: e.refNo,
        refLink: e.refLink,
      })),
    );
  }, [businessId, partyId]);

  useEffect(() => {
    const token = getJwt();
    if (!USE_BACKEND || !token) {
      setHydrated(localHydrated);
      return;
    }
    setHydrated(true);
  }, [localHydrated]);

  useEffect(() => {
    if (!USE_BACKEND || !getJwt()) return;
    void refresh().catch(() => setLedger([]));
  }, [refresh]);

  const entries = useMemo(() => {
    const token = getJwt();
    if (!USE_BACKEND || !token) {
      if (!partyId) return [];
      return localLedger.filter((e) => e.partyId === partyId);
    }
    return ledger;
  }, [ledger, localLedger, partyId]);

  return { ledger: entries, hydrated, refresh };
}
