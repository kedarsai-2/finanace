import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Purchase, PurchaseLine } from "@/types/purchase";
import { purchaseLedgerEntryId } from "@/types/purchase";
import { computeTotals } from "@/types/invoice";
import { useParties } from "@/hooks/useParties";
import type { LedgerEntry } from "@/types/party";
import { logAudit, snapshot } from "@/lib/audit";
import { USE_BACKEND } from "@/lib/flags";
import { apiFetch } from "@/lib/api";
import { businessRefFromId, toNumId, toStrId } from "@/lib/dto";

const STORAGE_KEY = "bm.purchases";

/** Stable ledger row id for a purchase-return's mirror entry. */
export function purchaseReturnLedgerEntryId(purchaseId: string) {
  return `le_pret_${purchaseId}`;
}

type BackendDiscountKind = "PERCENT" | "AMOUNT";
type BackendPurchaseStatus = "DRAFT" | "FINAL" | "CANCELLED";

type PurchaseDTO = {
  id?: number;
  number: string;
  date: string;
  dueDate?: string | null;
  partyName: string;
  partyState?: string | null;
  businessState?: string | null;
  subtotal: number;
  itemDiscountTotal: number;
  overallDiscountKind: BackendDiscountKind;
  overallDiscountValue: number;
  overallDiscountAmount: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  taxTotal: number;
  total: number;
  paidAmount: number;
  status: BackendPurchaseStatus;
  notes?: string | null;
  terms?: string | null;
  finalizedAt?: string | null;
  deleted?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  business?: { id: number } | null;
  party?: { id: number } | null;
};

type PurchaseLineDTO = {
  id?: number;
  name: string;
  qty: number;
  unit: string;
  rate: number;
  discountKind: BackendDiscountKind;
  discountValue: number;
  taxPercent: number;
  lineOrder?: number | null;
  item?: { id: number } | null;
  purchase: { id: number };
};

function toBackendDiscountKind(k: PurchaseLine["discountKind"]): BackendDiscountKind {
  return k === "amount" ? "AMOUNT" : "PERCENT";
}
function fromBackendDiscountKind(k: BackendDiscountKind | null | undefined): PurchaseLine["discountKind"] {
  return k === "AMOUNT" ? "amount" : "percent";
}

function toBackendPurchaseStatus(s: Purchase["status"]): BackendPurchaseStatus {
  if (s === "final") return "FINAL";
  if (s === "cancelled") return "CANCELLED";
  return "DRAFT";
}
function fromBackendPurchaseStatus(s: BackendPurchaseStatus | null | undefined): Purchase["status"] {
  if (s === "FINAL") return "final";
  if (s === "CANCELLED") return "cancelled";
  return "draft";
}

function dtoToPurchase(dto: PurchaseDTO): Purchase {
  return {
    id: toStrId(dto.id),
    businessId: toStrId(dto.business?.id),
    number: dto.number ?? "",
    date: dto.date,
    dueDate: dto.dueDate ?? undefined,
    partyId: toStrId(dto.party?.id),
    partyName: dto.partyName ?? "",
    partyState: dto.partyState ?? undefined,
    businessState: dto.businessState ?? undefined,
    lines: [],
    subtotal: Number(dto.subtotal ?? 0),
    itemDiscountTotal: Number(dto.itemDiscountTotal ?? 0),
    overallDiscountKind: fromBackendDiscountKind(dto.overallDiscountKind),
    overallDiscountValue: Number(dto.overallDiscountValue ?? 0),
    overallDiscountAmount: Number(dto.overallDiscountAmount ?? 0),
    taxableValue: Number(dto.taxableValue ?? 0),
    cgst: Number(dto.cgst ?? 0),
    sgst: Number(dto.sgst ?? 0),
    igst: Number(dto.igst ?? 0),
    taxTotal: Number(dto.taxTotal ?? 0),
    total: Number(dto.total ?? 0),
    paidAmount: Number(dto.paidAmount ?? 0),
    status: fromBackendPurchaseStatus(dto.status),
    deleted: dto.deleted ?? undefined,
    notes: dto.notes ?? undefined,
    terms: dto.terms ?? undefined,
    finalizedAt: dto.finalizedAt ?? undefined,
  };
}

function lineDtoToLine(dto: PurchaseLineDTO): PurchaseLine {
  return {
    id: toStrId(dto.id),
    itemId: dto.item?.id != null ? toStrId(dto.item.id) : undefined,
    name: dto.name ?? "",
    qty: Number(dto.qty ?? 0),
    unit: dto.unit ?? "pcs",
    rate: Number(dto.rate ?? 0),
    discountKind: fromBackendDiscountKind(dto.discountKind),
    discountValue: Number(dto.discountValue ?? 0),
    taxPercent: Number(dto.taxPercent ?? 0),
  };
}

function purchaseToDto(p: Purchase): PurchaseDTO {
  return {
    id: toNumId(p.id) ?? undefined,
    number: p.number,
    date: p.date,
    dueDate: p.dueDate ?? null,
    partyName: p.partyName,
    partyState: p.partyState ?? null,
    businessState: p.businessState ?? null,
    subtotal: p.subtotal,
    itemDiscountTotal: p.itemDiscountTotal,
    overallDiscountKind: toBackendDiscountKind(p.overallDiscountKind),
    overallDiscountValue: p.overallDiscountValue,
    overallDiscountAmount: p.overallDiscountAmount,
    taxableValue: p.taxableValue,
    cgst: p.cgst,
    sgst: p.sgst,
    igst: p.igst,
    taxTotal: p.taxTotal,
    total: p.total,
    paidAmount: p.paidAmount,
    status: toBackendPurchaseStatus(p.status),
    notes: p.notes ?? null,
    terms: p.terms ?? null,
    finalizedAt: p.finalizedAt ?? null,
    deleted: p.deleted ?? false,
    business: businessRefFromId(p.businessId),
    party: toNumId(p.partyId) == null ? null : { id: toNumId(p.partyId)! },
  };
}

function lineToDto(purchaseId: string, line: PurchaseLine, lineOrder: number): PurchaseLineDTO {
  const purId = toNumId(purchaseId);
  if (purId == null) throw new Error("Invalid purchaseId");
  const itemId = line.itemId ? toNumId(line.itemId) : null;
  return {
    id: toNumId(line.id) ?? undefined,
    name: line.name,
    qty: line.qty,
    unit: line.unit,
    rate: line.rate,
    discountKind: toBackendDiscountKind(line.discountKind),
    discountValue: line.discountValue,
    taxPercent: line.taxPercent,
    lineOrder,
    item: itemId == null ? null : { id: itemId },
    purchase: { id: purId },
  };
}

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
    if (!USE_BACKEND) {
      setPurchases(read());
      setHydrated(true);
      return;
    }
    setPurchases([]);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!USE_BACKEND) localStorage.setItem(STORAGE_KEY, JSON.stringify(purchases));
  }, [purchases, hydrated]);


  /**
   * Mirror the purchase into the supplier's party ledger.
   * Final + non-cancelled => write a payable (negative) entry.
   * Anything else (draft / cancelled / deleted) => remove any existing entry.
   */
  const syncLedger = useCallback(
    (p: Purchase) => {
      if (USE_BACKEND) return;
      const isReturn = p.kind === "return";
      const id = isReturn ? purchaseReturnLedgerEntryId(p.id) : purchaseLedgerEntryId(p.id);
      if (p.status === "final" && !p.deleted) {
        const entry: LedgerEntry = {
          id,
          partyId: p.partyId,
          date: p.finalizedAt ?? p.date,
          note: isReturn ? `Purchase Return ${p.number}` : `Purchase ${p.number}`,
          // Returns reduce payable → positive (debit); standard purchase → negative.
          amount: isReturn ? Math.abs(p.total) : -Math.abs(p.total),
          type: isReturn ? "purchase-return" : "purchase",
          refNo: p.number,
          refLink: isReturn ? `/purchase-returns/${p.id}` : `/purchases/${p.id}`,
        };
        upsertLedgerEntry(entry);
      } else {
        removeLedgerEntry(id);
      }
    },
    [upsertLedgerEntry, removeLedgerEntry],
  );

  const refresh = useCallback(async () => {
    if (!USE_BACKEND) return;
    if (!businessId) {
      setPurchases([]);
      return;
    }
    const list = await apiFetch<PurchaseDTO[]>(
      `/api/purchases?businessId.equals=${encodeURIComponent(String(businessId))}&size=500`,
    );
    setPurchases(list.map(dtoToPurchase));
  }, [businessId]);

  useEffect(() => {
    if (!USE_BACKEND) return;
    void refresh().catch(() => setPurchases([]));
  }, [refresh]);

  const purchasesRef = useRef<Purchase[]>(purchases);
  useEffect(() => {
    purchasesRef.current = purchases;
  }, [purchases]);

  const ensureLines = useCallback(async (purchaseId: string) => {
    if (!USE_BACKEND) return;
    const idNum = toNumId(purchaseId);
    if (idNum == null) return;
    const lines = await apiFetch<PurchaseLineDTO[]>(`/api/purchases/${idNum}/lines`);
    setPurchases((prev) =>
      prev.map((x) => (x.id === purchaseId ? { ...x, lines: lines.map(lineDtoToLine) } : x)),
    );
  }, []);

  const upsert = useCallback(async (p: Purchase) => {
    if (!USE_BACKEND) {
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
      return;
    }

    const dto = purchaseToDto(p);
    const isUpdate = toNumId(p.id) != null;
    const saved = isUpdate
      ? await apiFetch<PurchaseDTO>(`/api/purchases/${toNumId(p.id)}`, { method: "PUT", body: JSON.stringify(dto) })
      : await apiFetch<PurchaseDTO>(`/api/purchases`, { method: "POST", body: JSON.stringify({ ...dto, id: undefined }) });

    const savedId = toStrId(saved.id);

    const existingLines = await apiFetch<PurchaseLineDTO[]>(`/api/purchases/${savedId}/lines`).catch(() => []);
    await Promise.all(existingLines.map((l) => apiFetch<void>(`/api/purchase-lines/${l.id}`, { method: "DELETE" })));
    for (let i = 0; i < p.lines.length; i++) {
      const line = p.lines[i];
      const lineDto = lineToDto(savedId, line, i);
      await apiFetch<PurchaseLineDTO>(`/api/purchase-lines`, {
        method: "POST",
        body: JSON.stringify({ ...lineDto, id: undefined }),
      });
    }

    const after: Purchase = { ...dtoToPurchase(saved), lines: p.lines };
    setPurchases((prev) => {
      const exists = prev.some((x) => x.id === savedId);
      return exists ? prev.map((x) => (x.id === savedId ? after : x)) : [...prev, after];
    });
  }, [syncLedger]);

  /** Soft delete — hidden everywhere but the row is kept for audit. */
  const remove = useCallback(
    async (id: string) => {
      const before = purchasesRef.current.find((x) => x.id === id);
      if (USE_BACKEND) {
        const idNum = toNumId(id);
        if (idNum == null) return;
        await apiFetch<void>(`/api/purchases/${idNum}`, { method: "DELETE" });
        setPurchases((prev) => prev.filter((x) => x.id !== id));
      } else {
        setPurchases((prev) =>
          prev.map((x) => {
            if (x.id !== id) return x;
            const next = { ...x, deleted: true };
            syncLedger(next);
            return next;
          }),
        );
      }
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
    async (id: string) => {
      const before = purchasesRef.current.find((x) => x.id === id);
      if (USE_BACKEND) {
        const idNum = toNumId(id);
        if (idNum == null) return;
        const patch: Partial<PurchaseDTO> = { id: idNum, status: "CANCELLED" };
        const saved = await apiFetch<PurchaseDTO>(`/api/purchases/${idNum}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/merge-patch+json" },
          body: JSON.stringify(patch),
        });
        setPurchases((prev) =>
          prev.map((x) => (x.id === id ? { ...x, status: fromBackendPurchaseStatus(saved.status) } : x)),
        );
      } else {
        setPurchases((prev) =>
          prev.map((x) => {
            if (x.id !== id) return x;
            const next = { ...x, status: "cancelled" as const };
            syncLedger(next);
            return next;
          }),
        );
      }
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

  const scoped = useMemo(
    () =>
      purchases.filter(
        (x) =>
          !x.deleted &&
          (x.kind ?? "purchase") === "purchase" &&
          (!businessId || x.businessId === businessId),
      ),
    [purchases, businessId],
  );

  const returns = useMemo(
    () =>
      purchases.filter(
        (x) =>
          !x.deleted &&
          x.kind === "return" &&
          (!businessId || x.businessId === businessId),
      ),
    [purchases, businessId],
  );

  /**
   * Convert a finalised purchase into a draft purchase-return mirroring its
   * lines. The user can edit before finalising.
   */
  const convertToReturn = useCallback(
    async (sourceId: string): Promise<Purchase | null> => {
      const src = purchasesRef.current.find((x) => x.id === sourceId);
      if (!src) return null;
      const allRet = purchasesRef.current.filter((x) => x.kind === "return");
      const number = nextDocNumber(allRet, src.businessId, "PRET-");
      const id = `pret_${Date.now()}`;
      const now = new Date().toISOString();
      const ret: Purchase = {
        ...src,
        id,
        number,
        date: now,
        finalizedAt: undefined,
        status: "draft",
        paidAmount: 0,
        deleted: false,
        kind: "return",
        sourcePurchaseId: src.id,
        notes: src.notes ? `Against ${src.number}\n\n${src.notes}` : `Against ${src.number}`,
        lines: src.lines.map((l, i) => ({ ...l, id: `pretl_${id}_${i}` })),
      };
      await upsert(ret);
      return ret;
    },
    [upsert],
  );

  return {
    purchases: scoped,
    returns,
    allPurchases: purchases,
    hydrated,
    upsert,
    remove,
    cancel,
    ensureLines,
    refresh,
    convertToReturn,
  };
}

function nextDocNumber(
  existing: { number: string; businessId: string }[],
  businessId: string,
  prefix: string,
): string {
  const re = /^([A-Z]+-?)(\d+)$/i;
  let max = 0;
  let pad = 4;
  for (const x of existing) {
    if (x.businessId !== businessId) continue;
    const m = x.number.match(re);
    if (!m) continue;
    const n = parseInt(m[2], 10);
    if (!isNaN(n) && n > max) {
      max = n;
      pad = Math.max(pad, m[2].length);
    }
  }
  return `${prefix}${String(max + 1).padStart(pad, "0")}`;
}
