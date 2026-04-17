import { useCallback, useEffect, useState } from "react";
import type { Payment } from "@/types/payment";
import { logAudit, snapshot } from "@/lib/audit";

const STORAGE_KEY = "bm.payments";

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

  const add = useCallback((p: Payment) => {
    setPayments((prev) => [...prev, p]);
    const dirLabel = p.direction === "in" ? "Received" : "Paid";
    logAudit({
      module: "payment",
      action: "payment",
      recordId: p.id,
      reference: `${dirLabel} ₹${p.amount}`,
      businessId: p.businessId,
      after: snapshot(p),
    });
  }, []);

  const scoped = businessId
    ? payments.filter((p) => p.businessId === businessId)
    : payments;

  return { payments: scoped, allPayments: payments, hydrated, add };
}
