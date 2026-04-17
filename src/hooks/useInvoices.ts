import { useCallback, useEffect, useState } from "react";
import type { Invoice, InvoiceLine } from "@/types/invoice";
import { computeTotals } from "@/types/invoice";

const STORAGE_KEY = "bm.invoices";

function seedInvoice(args: {
  id: string;
  businessId: string;
  number: string;
  date: string;
  dueDate?: string;
  partyId: string;
  partyName: string;
  partyState?: string;
  businessState?: string;
  lines: Omit<InvoiceLine, "discountKind" | "discountValue">[];
  paidAmount: number;
  status: Invoice["status"];
  finalizedAt?: string;
}): Invoice {
  const lines: InvoiceLine[] = args.lines.map((l) => ({
    ...l,
    discountKind: "percent",
    discountValue: 0,
  }));
  const intraState =
    !!args.businessState && !!args.partyState && args.businessState === args.partyState;
  const totals = computeTotals({
    lines,
    overallDiscountKind: "percent",
    overallDiscountValue: 0,
    intraState,
  });
  return {
    id: args.id,
    businessId: args.businessId,
    number: args.number,
    date: args.date,
    dueDate: args.dueDate,
    partyId: args.partyId,
    partyName: args.partyName,
    partyState: args.partyState,
    businessState: args.businessState,
    lines,
    overallDiscountKind: "percent",
    overallDiscountValue: 0,
    paidAmount: args.paidAmount,
    status: args.status,
    finalizedAt: args.finalizedAt,
    ...totals,
  };
}

const seed: Invoice[] = [
  seedInvoice({
    id: "inv1", businessId: "b1", number: "INV-0001",
    date: "2025-03-04T00:00:00.000Z", dueDate: "2025-04-03T00:00:00.000Z",
    partyId: "p1", partyName: "Acme Industries", partyState: "Karnataka", businessState: "Karnataka",
    lines: [{ id: "l1", name: "Steel Bracket 4\"", qty: 50, unit: "pcs", rate: 240, taxPercent: 18 }],
    paidAmount: 14160, status: "final", finalizedAt: "2025-03-04T00:00:00.000Z",
  }),
  seedInvoice({
    id: "inv2", businessId: "b1", number: "INV-0002",
    date: "2025-03-12T00:00:00.000Z", dueDate: "2025-04-11T00:00:00.000Z",
    partyId: "p4", partyName: "Sundaram Traders", partyState: "Karnataka", businessState: "Karnataka",
    lines: [{ id: "l1", name: "Wood Panel 8x4", qty: 30, unit: "pcs", rate: 1850, taxPercent: 12 }],
    paidAmount: 30000, status: "final", finalizedAt: "2025-03-12T00:00:00.000Z",
  }),
  seedInvoice({
    id: "inv3", businessId: "b1", number: "INV-0003",
    date: "2025-03-20T00:00:00.000Z",
    partyId: "p6", partyName: "Rao & Sons", partyState: "Karnataka", businessState: "Karnataka",
    lines: [{ id: "l1", name: "On-site Installation", qty: 4, unit: "hour", rate: 1500, taxPercent: 18 }],
    paidAmount: 0, status: "draft",
  }),
  seedInvoice({
    id: "inv4", businessId: "b1", number: "INV-0004",
    date: "2025-04-02T00:00:00.000Z", dueDate: "2025-05-02T00:00:00.000Z",
    partyId: "p1", partyName: "Acme Industries", partyState: "Karnataka", businessState: "Karnataka",
    lines: [{ id: "l1", name: "Steel Bracket 4\"", qty: 100, unit: "pcs", rate: 240, taxPercent: 18 }],
    paidAmount: 0, status: "cancelled",
  }),
  seedInvoice({
    id: "inv5", businessId: "b2", number: "INV-0001",
    date: "2025-03-18T00:00:00.000Z",
    partyId: "p7", partyName: "Marigold Exports", partyState: "Rajasthan", businessState: "Rajasthan",
    lines: [{ id: "l1", name: "Cotton Fabric Roll", qty: 12, unit: "pcs", rate: 4200, taxPercent: 5 }],
    paidAmount: 25000, status: "final", finalizedAt: "2025-03-18T00:00:00.000Z",
  }),
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
