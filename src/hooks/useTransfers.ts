import { useCallback, useEffect, useMemo, useState } from "react";
import type { Transfer } from "@/types/account";
import { logAudit, snapshot } from "@/lib/audit";
import { USE_BACKEND } from "@/lib/flags";
import { apiFetch } from "@/lib/api";
import { getJwt } from "@/lib/auth";
import { businessRefFromId, toNumId, toStrId } from "@/lib/dto";

const STORAGE_KEY = "bm.transfers";

type TransferDTO = {
  id?: number;
  date: string;
  transferKind?: "TRANSFER" | "ADJUSTMENT" | null;
  adjustmentDirection?: "INCREMENT" | "DECREMENT" | null;
  amount: number;
  notes?: string | null;
  proofDataUrl?: string | null;
  proofName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  business?: { id: number } | null;
  fromAccount?: { id: number } | null;
  toAccount?: { id: number } | null;
};

function dtoToTransfer(dto: TransferDTO): Transfer {
  const bizId = dto.business?.id;
  const fromId = dto.fromAccount?.id;
  const toId = dto.toAccount?.id;
  return {
    id: toStrId(dto.id),
    businessId: bizId != null ? String(bizId) : "",
    date: dto.date,
    kind: dto.transferKind === "ADJUSTMENT" ? "adjustment" : "transfer",
    adjustmentDirection:
      dto.adjustmentDirection === "DECREMENT"
        ? "decrement"
        : dto.adjustmentDirection === "INCREMENT"
          ? "increment"
          : undefined,
    fromAccountId: fromId != null ? String(fromId) : "",
    toAccountId: toId != null ? String(toId) : undefined,
    amount: Number(dto.amount ?? 0),
    notes: dto.notes ?? undefined,
    proofDataUrl: dto.proofDataUrl ?? undefined,
    proofName: dto.proofName ?? undefined,
    createdAt: dto.createdAt ?? new Date().toISOString(),
  };
}

function transferToDto(t: Transfer): TransferDTO {
  return {
    id: toNumId(t.id) ?? undefined,
    date: t.date,
    transferKind: t.kind === "adjustment" ? "ADJUSTMENT" : "TRANSFER",
    adjustmentDirection:
      t.kind === "adjustment"
        ? t.adjustmentDirection === "decrement"
          ? "DECREMENT"
          : "INCREMENT"
        : null,
    amount: t.amount,
    notes: t.notes ?? null,
    proofDataUrl: t.proofDataUrl ?? null,
    proofName: t.proofName ?? null,
    createdAt: t.createdAt ?? null,
    business: businessRefFromId(t.businessId),
    fromAccount: t.fromAccountId ? { id: parseInt(t.fromAccountId, 10) } : null,
    toAccount: t.kind === "transfer" && t.toAccountId ? { id: parseInt(t.toAccountId, 10) } : null,
  };
}

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
    const token = getJwt();
    if (USE_BACKEND && token) {
      setHydrated(true);
      return;
    }
    setTransfers(read());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const token = getJwt();
    if (USE_BACKEND && token) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transfers));
  }, [transfers, hydrated]);

  useEffect(() => {
    const token = getJwt();
    if (!USE_BACKEND || !token) return;
    const biz = businessId ? parseInt(businessId, 10) : NaN;
    if (!businessId || isNaN(biz)) {
      setTransfers([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await apiFetch<TransferDTO[]>(
          `/api/transfers?businessId.equals=${biz}&size=200&sort=date,desc`,
        );
        if (cancelled) return;
        setTransfers(list.map(dtoToTransfer));
      } catch {
        if (cancelled) return;
        setTransfers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const add = useCallback((t: Transfer) => {
    const token = getJwt();
    if (USE_BACKEND && token) {
      return (async () => {
        const dto = transferToDto(t);
        delete dto.id;
        dto.createdAt = dto.createdAt ?? new Date().toISOString();
        const saved = await apiFetch<TransferDTO>("/api/transfers", {
          method: "POST",
          body: JSON.stringify(dto),
        });
        const mapped = dtoToTransfer(saved);
        setTransfers((prev) => [mapped, ...prev]);
        return mapped;
      })();
    }
    setTransfers((prev) => [...prev, t]);
    logAudit({
      module: "transfer",
      action: "create",
      recordId: t.id,
      reference: `Transfer · ₹${t.amount}`,
      businessId: t.businessId,
      after: snapshot(t),
    });
    return Promise.resolve(t);
  }, []);

  const scoped = useMemo(
    () => (businessId ? transfers.filter((t) => t.businessId === businessId) : transfers),
    [transfers, businessId],
  );

  return { transfers: scoped, allTransfers: transfers, hydrated, add };
}
