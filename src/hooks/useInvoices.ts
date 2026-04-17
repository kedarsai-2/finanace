import { useCallback, useEffect, useState } from "react";
import type { Invoice } from "@/types/invoice";

const STORAGE_KEY = "bm.invoices";

const seed: Invoice[] = [
  {
    id: "inv1", businessId: "b1", number: "INV-0001",
    date: "2025-03-04T00:00:00.000Z", dueDate: "2025-04-03T00:00:00.000Z",
    partyId: "p1", partyName: "Acme Industries",
    lines: [{ id: "l1", name: "Steel Bracket 4\"", qty: 50, unit: "pcs", rate: 240, taxPercent: 18 }],
    subtotal: 12000, taxTotal: 2160, total: 14160, paidAmount: 14160, status: "final",
  },
  {
    id: "inv2", businessId: "b1", number: "INV-0002",
    date: "2025-03-12T00:00:00.000Z", dueDate: "2025-04-11T00:00:00.000Z",
    partyId: "p4", partyName: "Sundaram Traders",
    lines: [{ id: "l1", name: "Wood Panel 8x4", qty: 30, unit: "pcs", rate: 1850, taxPercent: 12 }],
    subtotal: 55500, taxTotal: 6660, total: 62160, paidAmount: 30000, status: "final",
  },
  {
    id: "inv3", businessId: "b1", number: "INV-0003",
    date: "2025-03-20T00:00:00.000Z",
    partyId: "p6", partyName: "Rao & Sons",
    lines: [{ id: "l1", name: "On-site Installation", qty: 4, unit: "hour", rate: 1500, taxPercent: 18 }],
    subtotal: 6000, taxTotal: 1080, total: 7080, paidAmount: 0, status: "draft",
  },
  {
    id: "inv4", businessId: "b1", number: "INV-0004",
    date: "2025-04-02T00:00:00.000Z", dueDate: "2025-05-02T00:00:00.000Z",
    partyId: "p1", partyName: "Acme Industries",
    lines: [{ id: "l1", name: "Steel Bracket 4\"", qty: 100, unit: "pcs", rate: 240, taxPercent: 18 }],
    subtotal: 24000, taxTotal: 4320, total: 28320, paidAmount: 0, status: "cancelled",
  },
  {
    id: "inv5", businessId: "b2", number: "INV-0001",
    date: "2025-03-18T00:00:00.000Z",
    partyId: "p7", partyName: "Marigold Exports",
    lines: [{ id: "l1", name: "Cotton Fabric Roll", qty: 12, unit: "pcs", rate: 4200, taxPercent: 5 }],
    subtotal: 50400, taxTotal: 2520, total: 52920, paidAmount: 25000, status: "final",
  },
];

function read(): Invoice[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Invoice[]) : seed;
  } catch {
    return seed;
  }
}

export function useInvoices(businessId?: string | null) {
  const [invoices, setInvoices] = useState<Invoice[]>(seed);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setInvoices(read());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  }, [invoices, hydrated]);

  const upsert = useCallback((inv: Invoice) => {
    setInvoices((prev) => {
      const exists = prev.some((x) => x.id === inv.id);
      return exists ? prev.map((x) => (x.id === inv.id ? inv : x)) : [...prev, inv];
    });
  }, []);

  /** Soft delete — hidden everywhere but the row is kept for audit. */
  const remove = useCallback((id: string) => {
    setInvoices((prev) => prev.map((x) => (x.id === id ? { ...x, deleted: true } : x)));
  }, []);

  const cancel = useCallback((id: string) => {
    setInvoices((prev) => prev.map((x) => (x.id === id ? { ...x, status: "cancelled" } : x)));
  }, []);

  const scoped = invoices.filter(
    (x) => !x.deleted && (!businessId || x.businessId === businessId),
  );

  return { invoices: scoped, allInvoices: invoices, hydrated, upsert, remove, cancel };
}
