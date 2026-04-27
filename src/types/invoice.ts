export type InvoiceStatus = "draft" | "final" | "cancelled";
export type PaymentStatus = "unpaid" | "partial" | "paid";
export type DiscountKind = "percent" | "amount";

/**
 * Discriminator for sale-side documents.
 *  - "invoice"    : standard sales invoice (default).
 *  - "credit-note": sales return / credit note. Stored with positive amounts;
 *                   the ledger mirror is written as a negative (receivable
 *                   reduction) automatically.
 */
export type InvoiceKind = "invoice" | "credit-note";
export type CreditNotePaymentMode = "cash" | "bank";

export interface InvoiceLine {
  id: string;
  itemId?: string;
  name: string;
  qty: number;
  unit: string;
  rate: number;
  discountKind: DiscountKind;
  discountValue: number;
  taxPercent: number;
}

export interface Invoice {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  businessId: string;
  number: string; // e.g. INV-0001
  date: string; // ISO
  dueDate?: string; // ISO
  paymentTermsDays?: number;
  partyId: string;
  partyName: string; // denormalised for fast list rendering
  /** Cached at save time; used for GST type (intra/inter-state). */
  partyState?: string;
  businessState?: string;
  lines: InvoiceLine[];
  subtotal: number; // sum of (qty*rate) before any discount
  itemDiscountTotal: number;
  overallDiscountKind: DiscountKind;
  overallDiscountValue: number;
  overallDiscountAmount: number; // resolved ₹ amount
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  taxTotal: number;
  total: number;
  paidAmount: number;
  status: InvoiceStatus;
  /** Soft-delete marker. Hidden everywhere when true. */
  deleted?: boolean;
  notes?: string;
  terms?: string;
  /** Set when status moves to 'final' for the 24h edit window. */
  finalizedAt?: string;
  /** Document kind. Defaults to "invoice". Credit notes are listed separately. */
  kind?: InvoiceKind;
  /** When kind = "credit-note", the source invoice id (for traceability). */
  sourceInvoiceId?: string;
  /** Required for credit notes to capture settlement mode. */
  cnPaymentMode?: CreditNotePaymentMode;
}

export function paymentStatusOf(
  inv: Pick<Invoice, "total" | "paidAmount" | "status">,
): PaymentStatus {
  if (inv.status === "cancelled") return "unpaid";
  if (inv.paidAmount <= 0) return "unpaid";
  if (inv.paidAmount >= inv.total) return "paid";
  return "partial";
}

/** Per-line resolved math used by both the form and totals. */
export function lineMath(line: InvoiceLine) {
  const gross = (line.qty || 0) * (line.rate || 0);
  const discount =
    line.discountKind === "percent"
      ? (gross * (line.discountValue || 0)) / 100
      : Math.min(line.discountValue || 0, gross);
  const taxable = Math.max(0, gross - discount);
  // GST is removed from calculations globally.
  const tax = 0;
  return { gross, discount, taxable, tax, total: taxable + tax };
}

export interface InvoiceTotals {
  subtotal: number;
  itemDiscountTotal: number;
  overallDiscountAmount: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  taxTotal: number;
  total: number;
}

export function computeTotals(args: {
  lines: InvoiceLine[];
  overallDiscountKind: DiscountKind;
  overallDiscountValue: number;
  /** @deprecated GST removed. Kept for backward compatibility; ignored. */
  intraState?: boolean;
}): InvoiceTotals {
  let subtotal = 0;
  let itemDiscountTotal = 0;
  let lineTaxable = 0;
  for (const l of args.lines) {
    const m = lineMath(l);
    subtotal += m.gross;
    itemDiscountTotal += m.discount;
    lineTaxable += m.taxable;
  }
  const overallDiscountAmount =
    args.overallDiscountKind === "percent"
      ? (lineTaxable * (args.overallDiscountValue || 0)) / 100
      : Math.min(args.overallDiscountValue || 0, lineTaxable);
  // GST removed: tax is always zero. Total = taxable value (post-discount).
  const taxableValue = Math.max(0, lineTaxable - overallDiscountAmount);
  const cgst = 0;
  const sgst = 0;
  const igst = 0;
  const taxTotal = 0;
  const total = taxableValue;
  return {
    subtotal,
    itemDiscountTotal,
    overallDiscountAmount,
    taxableValue,
    cgst,
    sgst,
    igst,
    taxTotal,
    total,
  };
}

const NUMBER_REGEX = /^([A-Z]+-?)(\d+)$/i;

/** Returns next sequential invoice number for a business. Falls back to PREFIX-0001. */
export function nextInvoiceNumber(
  existing: Pick<Invoice, "number" | "businessId">[],
  businessId: string,
  prefix = "INV-",
): string {
  let max = 0;
  let pad = 4;
  for (const inv of existing) {
    if (inv.businessId !== businessId) continue;
    const m = inv.number.match(NUMBER_REGEX);
    if (!m) continue;
    const n = parseInt(m[2], 10);
    if (!isNaN(n) && n > max) {
      max = n;
      pad = Math.max(pad, m[2].length);
    }
  }
  return `${prefix}${String(max + 1).padStart(pad, "0")}`;
}

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Editability rules:
 *  - draft       → always editable
 *  - final       → editable within 24h of finalizedAt (or always with adminOverride)
 *  - cancelled   → never editable
 */
export function canEditInvoice(
  inv: Pick<Invoice, "status" | "finalizedAt">,
  opts: { adminOverride?: boolean; now?: number } = {},
): boolean {
  if (inv.status === "cancelled") return false;
  if (inv.status === "draft") return true;
  if (opts.adminOverride) return true;
  const finalized = inv.finalizedAt ? new Date(inv.finalizedAt).getTime() : 0;
  const now = opts.now ?? Date.now();
  return finalized > 0 && now - finalized <= EDIT_WINDOW_MS;
}
