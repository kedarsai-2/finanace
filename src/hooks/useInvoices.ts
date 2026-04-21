import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Invoice, InvoiceLine } from "@/types/invoice";
import { computeTotals } from "@/types/invoice";
import { useParties } from "@/hooks/useParties";
import type { LedgerEntry } from "@/types/party";
import { logAudit, snapshot } from "@/lib/audit";
import { USE_BACKEND } from "@/lib/flags";
import { apiFetch } from "@/lib/api";
import { businessRefFromId, toNumId, toStrId } from "@/lib/dto";

const STORAGE_KEY = "bm.invoices";

/** Stable ledger row id for a credit-note's mirror entry. */
export function creditNoteLedgerEntryId(invoiceId: string) {
  return `le_cn_${invoiceId}`;
}

type BackendDiscountKind = "PERCENT" | "AMOUNT";
type BackendInvoiceStatus = "DRAFT" | "FINAL" | "CANCELLED";

type InvoiceDTO = {
  id?: number;
  number: string;
  date: string;
  dueDate?: string | null;
  paymentTermsDays?: number | null;
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
  status: BackendInvoiceStatus;
  notes?: string | null;
  terms?: string | null;
  finalizedAt?: string | null;
  deleted?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  business?: { id: number } | null;
  party?: { id: number } | null;
};

type InvoiceLineDTO = {
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
  invoice: { id: number };
};

function toBackendDiscountKind(k: InvoiceLine["discountKind"]): BackendDiscountKind {
  return k === "amount" ? "AMOUNT" : "PERCENT";
}
function fromBackendDiscountKind(k: BackendDiscountKind | null | undefined): InvoiceLine["discountKind"] {
  return k === "AMOUNT" ? "amount" : "percent";
}

function toBackendInvoiceStatus(s: Invoice["status"]): BackendInvoiceStatus {
  if (s === "final") return "FINAL";
  if (s === "cancelled") return "CANCELLED";
  return "DRAFT";
}
function fromBackendInvoiceStatus(s: BackendInvoiceStatus | null | undefined): Invoice["status"] {
  if (s === "FINAL") return "final";
  if (s === "CANCELLED") return "cancelled";
  return "draft";
}

function dtoToInvoice(dto: InvoiceDTO): Invoice {
  const businessId = toStrId(dto.business?.id);
  const partyId = toStrId(dto.party?.id);
  return {
    id: toStrId(dto.id),
    businessId,
    number: dto.number ?? "",
    date: dto.date,
    dueDate: dto.dueDate ?? undefined,
    paymentTermsDays: dto.paymentTermsDays ?? undefined,
    partyId,
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
    status: fromBackendInvoiceStatus(dto.status),
    deleted: dto.deleted ?? undefined,
    notes: dto.notes ?? undefined,
    terms: dto.terms ?? undefined,
    finalizedAt: dto.finalizedAt ?? undefined,
  };
}

function lineDtoToLine(dto: InvoiceLineDTO): InvoiceLine {
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

function invoiceToDto(inv: Invoice): InvoiceDTO {
  return {
    id: toNumId(inv.id) ?? undefined,
    number: inv.number,
    date: inv.date,
    dueDate: inv.dueDate ?? null,
    paymentTermsDays: inv.paymentTermsDays ?? null,
    partyName: inv.partyName,
    partyState: inv.partyState ?? null,
    businessState: inv.businessState ?? null,
    subtotal: inv.subtotal,
    itemDiscountTotal: inv.itemDiscountTotal,
    overallDiscountKind: toBackendDiscountKind(inv.overallDiscountKind),
    overallDiscountValue: inv.overallDiscountValue,
    overallDiscountAmount: inv.overallDiscountAmount,
    taxableValue: inv.taxableValue,
    cgst: inv.cgst,
    sgst: inv.sgst,
    igst: inv.igst,
    taxTotal: inv.taxTotal,
    total: inv.total,
    paidAmount: inv.paidAmount,
    status: toBackendInvoiceStatus(inv.status),
    notes: inv.notes ?? null,
    terms: inv.terms ?? null,
    finalizedAt: inv.finalizedAt ?? null,
    deleted: inv.deleted ?? false,
    business: businessRefFromId(inv.businessId),
    party: toNumId(inv.partyId) == null ? null : { id: toNumId(inv.partyId)! },
  };
}

function lineToDto(invoiceId: string, line: InvoiceLine, lineOrder: number): InvoiceLineDTO {
  const invId = toNumId(invoiceId);
  if (invId == null) throw new Error("Invalid invoiceId");
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
    invoice: { id: invId },
  };
}

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
  const { upsertLedgerEntry, removeLedgerEntry } = useParties();

  /**
   * Mirror credit-notes into the party ledger as receivable reductions.
   * Standard invoices remain ledger-agnostic (tracked via payments).
   */
  const syncLedger = useCallback(
    (inv: Invoice) => {
      if (USE_BACKEND) return;
      if (inv.kind !== "credit-note") return;
      const id = creditNoteLedgerEntryId(inv.id);
      if (inv.status === "final" && !inv.deleted) {
        const entry: LedgerEntry = {
          id,
          partyId: inv.partyId,
          date: inv.finalizedAt ?? inv.date,
          note: `Credit Note ${inv.number}`,
          amount: -Math.abs(inv.total),
          type: "credit-note",
          refNo: inv.number,
          refLink: `/credit-notes/${inv.id}`,
        };
        upsertLedgerEntry(entry);
      } else {
        removeLedgerEntry(id);
      }
    },
    [upsertLedgerEntry, removeLedgerEntry],
  );

  useEffect(() => {
    if (!USE_BACKEND) {
      setInvoices(read());
      setHydrated(true);
      return;
    }
    // Backend-mode: start empty; fetch is scoped by businessId below.
    setInvoices([]);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!USE_BACKEND) localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  }, [invoices, hydrated]);

  const refresh = useCallback(async () => {
    if (!USE_BACKEND) return;
    if (!businessId) {
      setInvoices([]);
      return;
    }
    const list = await apiFetch<InvoiceDTO[]>(`/api/invoices?businessId.equals=${encodeURIComponent(String(businessId))}&size=500`);
    setInvoices(list.map(dtoToInvoice));
  }, [businessId]);

  useEffect(() => {
    if (!USE_BACKEND) return;
    void refresh().catch(() => {
      // If backend is down/misconfigured, don’t crash the UI.
      setInvoices([]);
    });
  }, [refresh]);

  const invoicesRef = useRef<Invoice[]>(invoices);
  useEffect(() => {
    invoicesRef.current = invoices;
  }, [invoices]);

  const ensureLines = useCallback(async (invoiceId: string) => {
    if (!USE_BACKEND) return;
    const idNum = toNumId(invoiceId);
    if (idNum == null) return;
    const lines = await apiFetch<InvoiceLineDTO[]>(`/api/invoices/${idNum}/lines`);
    setInvoices((prev) =>
      prev.map((x) => (x.id === invoiceId ? { ...x, lines: lines.map(lineDtoToLine) } : x)),
    );
  }, []);

  const upsert = useCallback(async (inv: Invoice) => {
    if (!USE_BACKEND) {
      const before = invoicesRef.current.find((x) => x.id === inv.id);
      setInvoices((prev) => {
        const exists = prev.some((x) => x.id === inv.id);
        return exists ? prev.map((x) => (x.id === inv.id ? inv : x)) : [...prev, inv];
      });
      logAudit({
        module: "invoice",
        action: before ? "edit" : "create",
        recordId: inv.id,
        reference: inv.number,
        refLink: `/invoices/${inv.id}`,
        businessId: inv.businessId,
        before: before ? snapshot(before) : null,
        after: snapshot(inv),
      });
      return;
    }

    const dto = invoiceToDto(inv);
    const isUpdate = toNumId(inv.id) != null;
    const saved = isUpdate
      ? await apiFetch<InvoiceDTO>(`/api/invoices/${toNumId(inv.id)}`, { method: "PUT", body: JSON.stringify(dto) })
      : await apiFetch<InvoiceDTO>(`/api/invoices`, { method: "POST", body: JSON.stringify({ ...dto, id: undefined }) });

    const savedId = toStrId(saved.id);

    // Replace lines (simple + consistent).
    const existingLines = await apiFetch<InvoiceLineDTO[]>(`/api/invoices/${savedId}/lines`).catch(() => []);
    await Promise.all(existingLines.map((l) => apiFetch<void>(`/api/invoice-lines/${l.id}`, { method: "DELETE" })));
    for (let i = 0; i < inv.lines.length; i++) {
      const line = inv.lines[i];
      const lineDto = lineToDto(savedId, line, i);
      await apiFetch<InvoiceLineDTO>(`/api/invoice-lines`, {
        method: "POST",
        body: JSON.stringify({ ...lineDto, id: undefined }),
      });
    }

    const after: Invoice = { ...dtoToInvoice(saved), lines: inv.lines.map((l) => ({ ...l, id: l.id })) };
    setInvoices((prev) => {
      const exists = prev.some((x) => x.id === savedId);
      return exists ? prev.map((x) => (x.id === savedId ? after : x)) : [...prev, after];
    });
  }, []);

  /** Soft delete — hidden everywhere but the row is kept for audit. */
  const remove = useCallback(async (id: string) => {
    if (!USE_BACKEND) {
      const before = invoicesRef.current.find((x) => x.id === id);
      setInvoices((prev) => prev.map((x) => (x.id === id ? { ...x, deleted: true } : x)));
      if (before) {
        logAudit({
          module: "invoice",
          action: "delete",
          recordId: id,
          reference: before.number,
          businessId: before.businessId,
          before: snapshot(before),
        });
      }
      return;
    }
    const idNum = toNumId(id);
    if (idNum == null) return;
    await apiFetch<void>(`/api/invoices/${idNum}`, { method: "DELETE" });
    setInvoices((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const cancel = useCallback(async (id: string) => {
    if (!USE_BACKEND) {
      const before = invoicesRef.current.find((x) => x.id === id);
      setInvoices((prev) => prev.map((x) => (x.id === id ? { ...x, status: "cancelled" } : x)));
      if (before) {
        logAudit({
          module: "invoice",
          action: "cancel",
          recordId: id,
          reference: before.number,
          refLink: `/invoices/${id}`,
          businessId: before.businessId,
          before: snapshot(before),
        });
      }
      return;
    }
    const idNum = toNumId(id);
    if (idNum == null) return;
    const existing = invoicesRef.current.find((x) => x.id === id);
    if (!existing) return;
    const patch: Partial<InvoiceDTO> = { id: idNum, status: "CANCELLED" };
    const saved = await apiFetch<InvoiceDTO>(`/api/invoices/${idNum}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/merge-patch+json" },
      body: JSON.stringify(patch),
    });
    setInvoices((prev) => prev.map((x) => (x.id === id ? { ...x, status: fromBackendInvoiceStatus(saved.status) } : x)));
  }, []);

  const scoped = useMemo(
    () =>
      invoices.filter(
        (x) => !x.deleted && (!businessId || x.businessId === businessId),
      ),
    [invoices, businessId],
  );

  return { invoices: scoped, allInvoices: invoices, hydrated, upsert, remove, cancel, ensureLines, refresh };
}
