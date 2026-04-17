import { useCallback, useEffect, useRef, useState } from "react";
import type { Purchase, PurchaseLine } from "@/types/purchase";
import { purchaseLedgerEntryId } from "@/types/purchase";
import { computeTotals } from "@/types/invoice";
import { useParties } from "@/hooks/useParties";
import type { LedgerEntry } from "@/types/party";
import { logAudit, snapshot } from "@/lib/audit";

const STORAGE_KEY = "bm.purchases";

function seedPurchase(args: {
  id: string;
  businessId: string;
  number: string;
  date: string;
  dueDate?: string;
  partyId: string;
  partyName: string;
  partyState?: string;
  businessState?: string;
  lines: Omit<PurchaseLine, "discountKind" | "discountValue">[];
  status: Purchase["status"];
  finalizedAt?: string;
}): Purchase {
  const lines: PurchaseLine[] = args.lines.map((l) => ({
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
    paidAmount: 0,
    status: args.status,
    finalizedAt: args.finalizedAt,
    ...totals,
  };
}

const seed: Purchase[] = [
  seedPurchase({
    id: "pur1", businessId: "b1", number: "PUR-0001",
    date: "2025-03-08T00:00:00.000Z", dueDate: "2025-04-07T00:00:00.000Z",
    partyId: "p2", partyName: "Lotus Stationery", partyState: "Karnataka", businessState: "Karnataka",
    lines: [{ id: "l1", name: "A4 Sheets (500)", qty: 20, unit: "pack", rate: 320, taxPercent: 12 }],
    status: "final", finalizedAt: "2025-03-08T00:00:00.000Z",
  }),
  seedPurchase({
    id: "pur2", businessId: "b1", number: "PUR-0002",
    date: "2025-03-22T00:00:00.000Z",
    partyId: "p5", partyName: "Kavya Logistics", partyState: "Tamil Nadu", businessState: "Karnataka",
    lines: [{ id: "l1", name: "Freight charges", qty: 1, unit: "lot", rate: 18000, taxPercent: 18 }],
    status: "final", finalizedAt: "2025-03-22T00:00:00.000Z",
  }),
  seedPurchase({
    id: "pur3", businessId: "b1", number: "PUR-0003",
    date: "2025-04-05T00:00:00.000Z",
    partyId: "p2", partyName: "Lotus Stationery", partyState: "Karnataka", businessState: "Karnataka",
    lines: [{ id: "l1", name: "Box files", qty: 50, unit: "pcs", rate: 95, taxPercent: 18 }],
    status: "draft",
  }),
];

function read(): Purchase[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Purchase[]) : seed;
  } catch {
    return seed;
  }
}

export function usePurchases(businessId?: string | null) {
  const [purchases, setPurchases] = useState<Purchase[]>(seed);
  const [hydrated, setHydrated] = useState(false);
  const { upsertLedgerEntry, removeLedgerEntry } = useParties();

  useEffect(() => {
    setPurchases(read());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(purchases));
  }, [purchases, hydrated]);

  /**
   * Mirror the purchase into the supplier's party ledger.
   * Final + non-cancelled => write a payable (negative) entry.
   * Anything else (draft / cancelled / deleted) => remove any existing entry.
   */
  const syncLedger = useCallback(
    (p: Purchase) => {
      const id = purchaseLedgerEntryId(p.id);
      if (p.status === "final" && !p.deleted) {
        const entry: LedgerEntry = {
          id,
          partyId: p.partyId,
          date: p.finalizedAt ?? p.date,
          note: `Purchase ${p.number}`,
          amount: -Math.abs(p.total), // payable
          type: "purchase",
          refNo: p.number,
          refLink: `/purchases/${p.id}`,
        };
        upsertLedgerEntry(entry);
      } else {
        removeLedgerEntry(id);
      }
    },
    [upsertLedgerEntry, removeLedgerEntry],
  );

  const purchasesRef = useRef<Purchase[]>(purchases);
  useEffect(() => {
    purchasesRef.current = purchases;
  }, [purchases]);

  const upsert = useCallback(
    (p: Purchase) => {
      const before = purchasesRef.current.find((x) => x.id === p.id);
      setPurchases((prev) => {
        const exists = prev.some((x) => x.id === p.id);
        return exists ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p];
      });
      syncLedger(p);
      logAudit({
        module: "purchase",
        action: before ? "edit" : "create",
        recordId: p.id,
        reference: p.number,
        refLink: `/purchases/${p.id}`,
        businessId: p.businessId,
        before: before ? snapshot(before) : null,
        after: snapshot(p),
      });
    },
    [syncLedger],
  );

  /** Soft delete — hidden everywhere but the row is kept for audit. */
  const remove = useCallback(
    (id: string) => {
      const before = purchasesRef.current.find((x) => x.id === id);
      setPurchases((prev) =>
        prev.map((x) => {
          if (x.id !== id) return x;
          const next = { ...x, deleted: true };
          syncLedger(next);
          return next;
        }),
      );
      if (before) {
        logAudit({
          module: "purchase",
          action: "delete",
          recordId: id,
          reference: before.number,
          businessId: before.businessId,
          before: snapshot(before),
        });
      }
    },
    [syncLedger],
  );

  const cancel = useCallback(
    (id: string) => {
      const before = purchasesRef.current.find((x) => x.id === id);
      setPurchases((prev) =>
        prev.map((x) => {
          if (x.id !== id) return x;
          const next = { ...x, status: "cancelled" as const };
          syncLedger(next);
          return next;
        }),
      );
      if (before) {
        logAudit({
          module: "purchase",
          action: "cancel",
          recordId: id,
          reference: before.number,
          refLink: `/purchases/${id}`,
          businessId: before.businessId,
          before: snapshot(before),
        });
      }
    },
    [syncLedger],
  );

  const scoped = purchases.filter(
    (x) => !x.deleted && (!businessId || x.businessId === businessId),
  );

  return { purchases: scoped, allPurchases: purchases, hydrated, upsert, remove, cancel };
}
