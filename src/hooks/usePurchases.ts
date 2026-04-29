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
import { composeNotesWithMeta, extractMetaFromNotes } from "@/lib/documentMeta";
import type { ReturnPaymentMode } from "@/types/purchase";

const STORAGE_KEY = "bm.purchases";

/** Stable ledger row id for a purchase-return's mirror entry. */
export function purchaseReturnLedgerEntryId(purchaseId: string) {
  return `le_pret_${purchaseId}`;
}

type BackendDiscountKind = "PERCENT" | "AMOUNT";
type BackendPurchaseStatus = "DRAFT" | "FINAL" | "CANCELLED";
type BackendPurchaseKind = "PURCHASE" | "RETURN";

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
  purchaseKind?: BackendPurchaseKind | null;
  sourcePurchaseId?: number | null;
  status: BackendPurchaseStatus;
  notes?: string | null;
  terms?: string | null;
  finalizedAt?: string | null;
  proofDataUrl?: string | null;
  proofName?: string | null;
  purchaseCategory?: "SHORT_TERM" | "LONG_TERM" | null;
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
function fromBackendDiscountKind(
  k: BackendDiscountKind | null | undefined,
): PurchaseLine["discountKind"] {
  return k === "AMOUNT" ? "amount" : "percent";
}

function toBackendPurchaseStatus(s: Purchase["status"]): BackendPurchaseStatus {
  if (s === "final") return "FINAL";
  if (s === "cancelled") return "CANCELLED";
  return "DRAFT";
}
function fromBackendPurchaseStatus(
  s: BackendPurchaseStatus | null | undefined,
): Purchase["status"] {
  if (s === "FINAL") return "final";
  if (s === "CANCELLED") return "cancelled";
  return "draft";
}

function dtoToPurchase(dto: PurchaseDTO): Purchase {
  const parsed = extractMetaFromNotes(dto.notes ?? undefined);
  const dbCategory =
    dto.purchaseCategory === "LONG_TERM"
      ? "long-term"
      : dto.purchaseCategory === "SHORT_TERM"
        ? "short-term"
        : undefined;
  return {
    id: toStrId(dto.id),
    createdAt: dto.createdAt ?? undefined,
    updatedAt: dto.updatedAt ?? undefined,
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
    kind: dto.purchaseKind === "RETURN" ? "return" : "purchase",
    sourcePurchaseId: toStrId(dto.sourcePurchaseId),
    status: fromBackendPurchaseStatus(dto.status),
    deleted: dto.deleted ?? undefined,
    notes: parsed.cleanNotes,
    terms: dto.terms ?? undefined,
    finalizedAt: dto.finalizedAt ?? undefined,
    proofDataUrl: dto.proofDataUrl ?? undefined,
    proofName: dto.proofName ?? undefined,
    purchaseCategory: dbCategory ?? parsed.meta.purchaseCategory,
    purchasePaymentMode: parsed.meta.purchasePaymentMode,
    returnPaymentMode: parsed.meta.returnPaymentMode,
    returnAccountId: parsed.meta.returnAccountId,
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

function normalizePurchases(list: Purchase[]): Purchase[] {
  const byNumber = new Map<string, string>();
  for (const p of list) {
    byNumber.set((p.number ?? "").trim(), p.id);
  }
  return list.map((p) => {
    const isReturn = p.kind === "return" || (p.number ?? "").toUpperCase().startsWith("PRET-");
    if (!isReturn) return { ...p, kind: "purchase" };
    let sourcePurchaseId = p.sourcePurchaseId;
    if (!sourcePurchaseId) {
      const m = (p.notes ?? "").match(/Against\s+([A-Za-z]+-?\d+)/i);
      if (m?.[1]) sourcePurchaseId = byNumber.get(m[1].trim());
    }
    return { ...p, kind: "return", sourcePurchaseId };
  });
}

function purchaseToDto(p: Purchase): PurchaseDTO {
  const categoryMeta = p.kind === "return" ? undefined : p.purchaseCategory;
  const notes = composeNotesWithMeta(p.notes, {
    purchaseCategory: categoryMeta,
    purchasePaymentMode: p.kind !== "return" ? p.purchasePaymentMode : undefined,
    returnPaymentMode: p.kind === "return" ? p.returnPaymentMode : undefined,
    returnAccountId: p.kind === "return" ? p.returnAccountId : undefined,
  });
  return {
    id: toNumId(p.id) ?? undefined,
    createdAt: p.createdAt ?? null,
    updatedAt: p.updatedAt ?? null,
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
    purchaseKind: p.kind === "return" ? "RETURN" : "PURCHASE",
    // For normal purchases, omit sourcePurchaseId entirely; sending null can
    // be interpreted as an unsaved transient relation by backend mappers.
    sourcePurchaseId: p.kind === "return" ? (toNumId(p.sourcePurchaseId) ?? null) : undefined,
    status: toBackendPurchaseStatus(p.status),
    notes: notes ?? null,
    terms: p.terms ?? null,
    finalizedAt: p.finalizedAt ?? null,
    proofDataUrl: p.proofDataUrl ?? null,
    proofName: p.proofName ?? null,
    purchaseCategory:
      p.kind === "return"
        ? null
        : p.purchaseCategory === "long-term"
          ? "LONG_TERM"
          : p.purchaseCategory === "short-term"
            ? "SHORT_TERM"
            : null,
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
    id: "pur1",
    businessId: "b1",
    number: "PUR-0001",
    date: "2025-03-08T00:00:00.000Z",
    dueDate: "2025-04-07T00:00:00.000Z",
    partyId: "p2",
    partyName: "Lotus Stationery",
    partyState: "Karnataka",
    businessState: "Karnataka",
    lines: [
      { id: "l1", name: "A4 Sheets (500)", qty: 20, unit: "pack", rate: 320, taxPercent: 12 },
    ],
    status: "final",
    finalizedAt: "2025-03-08T00:00:00.000Z",
  }),
  seedPurchase({
    id: "pur2",
    businessId: "b1",
    number: "PUR-0002",
    date: "2025-03-22T00:00:00.000Z",
    partyId: "p5",
    partyName: "Kavya Logistics",
    partyState: "Tamil Nadu",
    businessState: "Karnataka",
    lines: [
      { id: "l1", name: "Freight charges", qty: 1, unit: "lot", rate: 18000, taxPercent: 18 },
    ],
    status: "final",
    finalizedAt: "2025-03-22T00:00:00.000Z",
  }),
  seedPurchase({
    id: "pur3",
    businessId: "b1",
    number: "PUR-0003",
    date: "2025-04-05T00:00:00.000Z",
    partyId: "p2",
    partyName: "Lotus Stationery",
    partyState: "Karnataka",
    businessState: "Karnataka",
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
    const query = businessId
      ? `/api/purchases?businessId.equals=${encodeURIComponent(String(businessId))}&size=500`
      : "/api/purchases?size=500";
    const list = await apiFetch<PurchaseDTO[]>(query);
    setPurchases(normalizePurchases(list.filter((dto) => !dto.deleted).map(dtoToPurchase)));
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

  const upsert = useCallback(
    async (p: Purchase) => {
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

      const before = purchasesRef.current.find((x) => x.id === p.id);
      const dto = purchaseToDto(p);
      const isUpdate = toNumId(p.id) != null;
      dto.createdAt = dto.createdAt ?? before?.createdAt ?? new Date().toISOString();
      const saved = isUpdate
        ? await apiFetch<PurchaseDTO>(`/api/purchases/${toNumId(p.id)}`, {
            method: "PUT",
            body: JSON.stringify(dto),
          })
        : await apiFetch<PurchaseDTO>(`/api/purchases`, {
            method: "POST",
            body: JSON.stringify({ ...dto, id: undefined }),
          });

      const savedId = toStrId(saved.id);

      const existingLines = await apiFetch<PurchaseLineDTO[]>(
        `/api/purchases/${savedId}/lines`,
      ).catch(() => []);
      await Promise.all(
        existingLines.map((l) =>
          apiFetch<void>(`/api/purchase-lines/${l.id}`, { method: "DELETE" }),
        ),
      );
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
        const next = exists ? prev.map((x) => (x.id === savedId ? after : x)) : [...prev, after];
        return normalizePurchases(next);
      });
    },
    [syncLedger],
  );

  /** Soft delete — hidden everywhere but the row is kept for audit. */
  const remove = useCallback(
    async (id: string) => {
      const before = purchasesRef.current.find((x) => x.id === id);
      if (USE_BACKEND) {
        const idNum = toNumId(id);
        if (idNum == null) return;
        try {
          // Keep backend behavior consistent with UI copy: prefer soft delete.
          const patch: Partial<PurchaseDTO> = { id: idNum, deleted: true };
          await apiFetch<PurchaseDTO>(`/api/purchases/${idNum}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/merge-patch+json" },
            body: JSON.stringify(patch),
          });
        } catch {
          // Backward compatibility fallback where PATCH may be unavailable.
          await apiFetch<void>(`/api/purchases/${idNum}`, { method: "DELETE" });
        }
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
          prev.map((x) =>
            x.id === id ? { ...x, status: fromBackendPurchaseStatus(saved.status) } : x,
          ),
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
        (x) => !x.deleted && x.kind === "return" && (!businessId || x.businessId === businessId),
      ),
    [purchases, businessId],
  );

  /**
   * Convert a finalised purchase into a final purchase-return.
   */
  const convertToReturn = useCallback(
    async (
      sourceId: string,
      returnAmount?: number,
      paymentMode?: ReturnPaymentMode,
      returnDate?: string,
      accountId?: string,
    ): Promise<Purchase | null> => {
      const src = purchasesRef.current.find((x) => x.id === sourceId);
      if (!src) return null;
      const alreadyReturned = purchasesRef.current.reduce((sum, x) => {
        if (x.deleted || x.kind !== "return" || x.status === "cancelled") return sum;
        if (x.sourcePurchaseId !== src.id) return sum;
        return sum + Math.max(0, Number(x.total ?? 0));
      }, 0);
      const remaining = Math.max(0, src.total - alreadyReturned);
      if (remaining <= 0) {
        throw new Error(`Return limit reached for ${src.number}.`);
      }
      const hasAmount = typeof returnAmount === "number" && Number.isFinite(returnAmount);
      const safeAmount = hasAmount ? Math.max(0, Math.min(returnAmount!, remaining)) : remaining;
      if (safeAmount <= 0) {
        throw new Error("Return amount must be greater than zero.");
      }
      if (!paymentMode) {
        throw new Error("Purchase return payment mode is required.");
      }
      const allRet = purchasesRef.current.filter((x) => x.kind === "return");
      const number = nextDocNumber(allRet, src.businessId, "PRET-");
      const id = `pret_${Date.now()}`;
      const now = new Date().toISOString();
      const effectiveReturnDate =
        returnDate && !Number.isNaN(Date.parse(returnDate)) ? returnDate : now;
      const lines: PurchaseLine[] = [
        {
          id: `pretl_${id}_0`,
          name: `Purchase return against ${src.number}`,
          qty: 1,
          unit: "pcs",
          rate: safeAmount,
          discountKind: "percent",
          discountValue: 0,
          taxPercent: 0,
        },
      ];
      const totals = computeTotals({
        lines,
        overallDiscountKind: "percent",
        overallDiscountValue: 0,
      });
      const ret: Purchase = {
        ...src,
        id,
        number,
        date: effectiveReturnDate,
        finalizedAt: effectiveReturnDate,
        status: "final",
        paidAmount: 0,
        deleted: false,
        kind: "return",
        sourcePurchaseId: src.id,
        returnPaymentMode: paymentMode,
        returnAccountId: accountId,
        notes: src.notes ? `Against ${src.number}\n\n${src.notes}` : `Against ${src.number}`,
        lines,
        ...totals,
        overallDiscountKind: "percent",
        overallDiscountValue: 0,
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
