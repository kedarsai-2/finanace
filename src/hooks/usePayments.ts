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
  proofDataUrl?: string | null;
  proofName?: string | null;
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
  if (m === "cheque") return "BANK";
  return "CASH";
}
function fromBackendMode(m: BackendPaymentMode | null | undefined): Payment["mode"] {
  if (m === "BANK") return "bank";
  // Legacy UPI payments now surface as "bank" since UPI mode is retired.
  if (m === "UPI") return "bank";
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
    proofDataUrl: dto.proofDataUrl ?? undefined,
    proofName: dto.proofName ?? undefined,
    accountId: dto.account?.id != null ? toStrId(dto.account.id) : undefined,
    allocations,
  };
}

function paymentToDto(p: Omit<Payment, "id">, businessId: string): PaymentDTO {
  const fallbackProofByMode: Record<Payment["mode"], { dataUrl: string; name: string }> = {
    cash: {
      dataUrl: "data:text/plain;base64,Q0FTSF9OT19QUk9PRg==",
      name: "cash-no-proof.txt",
    },
    bank: {
      dataUrl: "data:text/plain;base64,QkFOS19OT19QUk9PRg==",
      name: "bank-no-proof.txt",
    },
    cheque: {
      dataUrl: "data:text/plain;base64,Q0hFUVVFX05PX1BST09G",
      name: "cheque-no-proof.txt",
    },
  };
  const fallback = fallbackProofByMode[p.mode];
  const proofDataUrl = p.proofDataUrl ?? fallback.dataUrl;
  const proofName = p.proofName ?? fallback.name;
  return {
    direction: toBackendDirection(p.direction),
    date: p.date,
    amount: p.amount,
    mode: toBackendMode(p.mode),
    reference: p.reference ?? null,
    notes: p.notes ?? null,
    proofDataUrl,
    proofName,
    createdAt: new Date().toISOString(),
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
    const list = await apiFetch<PaymentDTO[]>(
      businessId
        ? `/api/payments?businessId.equals=${encodeURIComponent(String(businessId))}&size=500&sort=id,desc`
        : `/api/payments?size=1000&sort=id,desc`,
    );

    const allocs = await apiFetch<
      Array<{ docId: string; docNumber: string; amount: number; payment?: { id?: number } }>
    >(
      businessId
        ? `/api/payment-allocations/by-business/${encodeURIComponent(String(businessId))}`
        : `/api/payment-allocations?size=2000&sort=id,desc`,
    ).catch(() => []);

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

  const update = useCallback(
    async (id: string, patch: Partial<Omit<Payment, "id" | "businessId">>) => {
      if (USE_BACKEND) {
        if (!businessId) throw new Error("Missing businessId");
        const idNum = toNumId(id);
        if (idNum == null) throw new Error("Invalid payment id");
        const current = payments.find((x) => x.id === id);
        if (!current) throw new Error("Payment not found");
        const merged: Payment = {
          ...current,
          ...patch,
          allocations: patch.allocations ?? current.allocations,
        };
        const paymentDto = paymentToDto(
          {
            businessId,
            partyId: merged.partyId,
            direction: merged.direction,
            date: merged.date,
            amount: merged.amount,
            mode: merged.mode,
            accountId: merged.accountId,
            account: merged.account,
            reference: merged.reference,
            notes: merged.notes,
            proofDataUrl: merged.proofDataUrl,
            proofName: merged.proofName,
            allocations: merged.allocations,
          },
          businessId,
        );
        await apiFetch<PaymentDTO>(`/api/payments/${idNum}`, {
          method: "PATCH",
          body: JSON.stringify({ ...paymentDto, id: idNum }),
        });

        const existingAllocs = await apiFetch<PaymentAllocationDTO[]>(
          `/api/payment-allocations/by-business/${encodeURIComponent(String(businessId))}`,
        )
          .then((list) => list.filter((a) => toNumId(a.payment?.id) === idNum))
          .catch(() => []);
        for (const alloc of existingAllocs) {
          if (alloc.id != null) {
            await apiFetch<void>(`/api/payment-allocations/${alloc.id}`, { method: "DELETE" });
          }
        }
        for (const a of merged.allocations ?? []) {
          const allocDto: PaymentAllocationDTO = {
            docId: a.docId,
            docNumber: a.docNumber,
            amount: a.amount,
            payment: { id: idNum },
          };
          await apiFetch<PaymentAllocationDTO>(`/api/payment-allocations`, {
            method: "POST",
            body: JSON.stringify({ ...allocDto, id: undefined }),
          });
        }
        await refresh();
        return;
      }

      setPayments((prev) =>
        prev.map((x) =>
          x.id === id ? { ...x, ...patch, allocations: patch.allocations ?? x.allocations } : x,
        ),
      );
    },
    [businessId, payments, refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      if (USE_BACKEND) {
        const idNum = toNumId(id);
        if (idNum == null) throw new Error("Invalid payment id");
        await apiFetch<void>(`/api/payments/${idNum}`, { method: "DELETE" });
        await refresh();
        return;
      }
      setPayments((prev) => prev.filter((x) => x.id !== id));
    },
    [refresh],
  );

  const scoped = useMemo(
    () => (businessId ? payments.filter((p) => p.businessId === businessId) : payments),
    [payments, businessId],
  );

  return { payments: scoped, allPayments: payments, hydrated, create, update, remove, refresh };
}
