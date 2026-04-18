import { useCallback, useEffect, useState } from "react";
import type { Payment } from "@/types/payment";
import { logAudit, snapshot } from "@/lib/audit";

const STORAGE_KEY = "bm.payments";

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
    setPayments(read());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
  }, [payments, hydrated]);

  const create = useCallback(async (p: Omit<Payment, "id">) => {
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
  }, []);

  const scoped = businessId
    ? payments.filter((p) => p.businessId === businessId)
    : payments;

  return { payments: scoped, allPayments: payments, hydrated, create };
}
