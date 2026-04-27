import type { DiscountKind, InvoiceLine } from "@/types/invoice";
export type { DiscountKind } from "@/types/invoice";

export type PurchaseStatus = "draft" | "final" | "cancelled";

/**
 * Discriminator for purchase-side documents.
 *  - "purchase": standard purchase / supplier bill (default).
 *  - "return"  : purchase return / debit note. Stored with positive amounts;
 *                the ledger mirror reduces the supplier payable automatically.
 */
export type PurchaseKind = "purchase" | "return";
export type PurchaseCategory = "short-term" | "long-term";
export type ReturnPaymentMode = "cash" | "bank" | "cheque";
export type PurchasePaymentMode = "cash" | "bank" | "cheque";

/** Same shape as InvoiceLine — purchases reuse the line/tax math helpers. */
export type PurchaseLine = InvoiceLine;

export interface Purchase {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  businessId: string;
  /** Purchase / bill number. */
  number: string;
  date: string; // ISO
  dueDate?: string; // ISO (optional)
  partyId: string;
  partyName: string;
  partyState?: string;
  businessState?: string;
  lines: PurchaseLine[];
  subtotal: number;
  itemDiscountTotal: number;
  overallDiscountKind: DiscountKind;
  overallDiscountValue: number;
  overallDiscountAmount: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  taxTotal: number;
  total: number;
  /** Reserved for phase-2 supplier payments. */
  paidAmount: number;
  status: PurchaseStatus;
  /**
   * Bill / invoice proof image URL (Cloudinary secure URL). Required
   * client-side when finalising a purchase.
   */
  proofDataUrl?: string;
  /** Original filename for display purposes. */
  proofName?: string;
  /** Soft-delete marker. Hidden everywhere when true. */
  deleted?: boolean;
  notes?: string;
  terms?: string;
  /** Set when status moves to 'final' for the 24h edit window. */
  finalizedAt?: string;
  /** Document kind. Defaults to "purchase". Returns are listed separately. */
  kind?: PurchaseKind;
  /** When kind = "return", the source purchase id (for traceability). */
  sourcePurchaseId?: string;
  /** Mandatory category for standard purchases. */
  purchaseCategory?: PurchaseCategory;
  /** Payment mode captured while creating/editing standard purchases. */
  purchasePaymentMode?: PurchasePaymentMode;
  /** Required for purchase returns to capture settlement mode. */
  returnPaymentMode?: ReturnPaymentMode;
}

const NUMBER_REGEX = /^([A-Z]+-?)(\d+)$/i;

/** Returns next sequential purchase number for a business. Falls back to PREFIX-0001. */
export function nextPurchaseNumber(
  existing: Pick<Purchase, "number" | "businessId">[],
  businessId: string,
  prefix = "PUR-",
): string {
  let max = 0;
  let pad = 4;
  for (const p of existing) {
    if (p.businessId !== businessId) continue;
    const m = p.number.match(NUMBER_REGEX);
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
export function canEditPurchase(
  p: Pick<Purchase, "status" | "finalizedAt">,
  opts: { adminOverride?: boolean; now?: number } = {},
): boolean {
  if (p.status === "cancelled") return false;
  if (p.status === "draft") return true;
  if (opts.adminOverride) return true;
  const finalized = p.finalizedAt ? new Date(p.finalizedAt).getTime() : 0;
  const now = opts.now ?? Date.now();
  return finalized > 0 && now - finalized <= EDIT_WINDOW_MS;
}

export function purchaseLedgerEntryId(purchaseId: string) {
  return `le_pur_${purchaseId}`;
}
