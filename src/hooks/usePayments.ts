import { useCallback, useEffect, useMemo, useState } from "react";
import type { Payment } from "@/types/payment";
import { logAudit, snapshot } from "@/lib/audit";
import { USE_BACKEND } from "@/lib/flags";
import { apiFetch } from "@/lib/api";
import { businessRefFromId, toNumId, toStrId } from "@/lib/dto";

const STORAGE_KEY = "bm.payments";

type BackendPaymentMode = "CASH" | "BANK" | "UPI";
type BackendPaymentDirection = "IN" | "OUT";

type PaymentDTO = {
  id?: number;
  direction: BackendPaymentDirection;
  date: string;
  amount: number;
  mode: BackendPaymentMode;
  reference?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  business?: { id: number } | null;
  party?: { id: number } | null;
  account?: { id: number } | null;
};

type PaymentAllocationDTO = {
  id?: number;
  docId: string;
  docNumber: string;
  amount: number;
  payment: { id: number };
};

function toBackendMode(m: Payment["mode"]): BackendPaymentMode {
  if (m === "bank") return "BANK";
  if (m === "upi") return "UPI";
  if (m === "cheque") return "BANK";
  return "CASH";
}
function fromBackendMode(m: BackendPaymentMode | null | undefined): Payment["mode"] {
  if (m === "BANK") return "bank";
  if (m === "UPI") return "upi";
  return "cash";
}

function toBackendDirection(d: Payment["direction"]): BackendPaymentDirection {
  return d === "out" ? "OUT" : "IN";
}
function fromBackendDirection(d: BackendPaymentDirection | null | undefined): Payment["direction"] {
  return d === "OUT" ? "out" : "in";
}

function dtoToPayment(dto: PaymentDTO, allocations: Payment["allocations"] = []): Payment {
  return {
    id: toStrId(dto.id),
    businessId: toStrId(dto.business?.id),
    partyId: toStrId(dto.party?.id),
    direction: fromBackendDirection(dto.direction),
    date: dto.date,
    amount: Number(dto.amount ?? 0),
    mode: fromBackendMode(dto.mode),
    reference: dto.reference ?? undefined,
    notes: dto.notes ?? undefined,
    accountId: dto.account?.id != null ? toStrId(dto.account.id) : undefined,
    allocations,
  };
}

function paymentToDto(p: Omit<Payment, "id">, businessId: string): PaymentDTO {
  return {
    direction: toBackendDirection(p.direction),
    date: p.date,
    amount: p.amount,
    mode: toBackendMode(p.mode),
    reference: p.reference ?? null,
    notes: p.notes ?? null,
    business: businessRefFromId(businessId),
    party: toNumId(p.partyId) == null ? null : { id: toNumId(p.partyId)! },
    account: p.accountId && toNumId(p.accountId) != null ? { id: toNumId(p.accountId)! } : null,
  };
}

function newPaymentId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `pay_${crypto.randomUUID()}`;
  }
  return `pay_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function read(): Payment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Payment[]) : [];
  } catch {
    return [];
  }
}

export function usePayments(businessId?: string | null) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!USE_BACKEND) {
      setPayments(read());
      setHydrated(true);
      return;
    }
    setPayments([]);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!USE_BACKEND) localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
  }, [payments, hydrated]);

  const refresh = useCallback(async () => {
    if (!USE_BACKEND) return;
    if (!businessId) {
      setPayments([]);
      return;
    }

    const list = await apiFetch<PaymentDTO[]>(
      `/api/payments?businessId.equals=${encodeURIComponent(String(businessId))}&size=500&sort=id,desc`,
    );

    const allocs = await apiFetch<
      Array<{ docId: string; docNumber: string; amount: number; payment?: { id?: number } }>
    >(`/api/payment-allocations/by-business/${encodeURIComponent(String(businessId))}`).catch(
      () => [],
    );

    const allocByPayment = new Map<string, Payment["allocations"]>();
    for (const a of allocs) {
      const pid = toStrId(a.payment?.id);
      if (!pid) continue;
      const cur = allocByPayment.get(pid) ?? [];
      cur.push({ docId: a.docId, docNumber: a.docNumber, amount: Number(a.amount ?? 0) });
      allocByPayment.set(pid, cur);
    }

    setPayments(list.map((p) => dtoToPayment(p, allocByPayment.get(toStrId(p.id)) ?? [])));
  }, [businessId]);

  useEffect(() => {
    if (!USE_BACKEND) return;
    void refresh().catch(() => setPayments([]));
  }, [refresh]);

  const create = useCallback(
    async (p: Omit<Payment, "id">) => {
      if (USE_BACKEND) {
        if (!businessId) throw new Error("Missing businessId");
        const paymentDto = paymentToDto(p, businessId);
        const saved = await apiFetch<PaymentDTO>(`/api/payments`, {
          method: "POST",
          body: JSON.stringify(paymentDto),
        });
        const savedId = toStrId(saved.id);

        for (const a of p.allocations ?? []) {
          const allocDto: PaymentAllocationDTO = {
            docId: a.docId,
            docNumber: a.docNumber,
            amount: a.amount,
            payment: { id: toNumId(savedId)! },
          };
          await apiFetch<PaymentAllocationDTO>(`/api/payment-allocations`, {
            method: "POST",
            body: JSON.stringify({ ...allocDto, id: undefined }),
          });
        }

        await refresh();
        return payments.find((x) => x.id === savedId) ?? dtoToPayment(saved, p.allocations);
      }

      const id = newPaymentId();
      const created: Payment = { ...p, id };
      setPayments((prev) => [created, ...prev]);

      const dirLabel = created.direction === "in" ? "Received" : "Paid";
      logAudit({
        module: "payment",
        action: "payment",
        recordId: created.id,
        reference: `${dirLabel} ₹${created.amount}`,
        businessId: created.businessId,
        after: snapshot(created),
      });

      return created;
    },
    [businessId, payments, refresh],
  );

  const scoped = useMemo(
    () => (businessId ? payments.filter((p) => p.businessId === businessId) : payments),
    [payments, businessId],
  );

  return { payments: scoped, allPayments: payments, hydrated, create, refresh };
}
