import type { PaymentMode } from "./payment";

export const DEFAULT_EXPENSE_TYPES = ["direct", "indirect"] as const;

/** Expense type is fixed to direct/indirect. */
export type ExpenseType = (typeof DEFAULT_EXPENSE_TYPES)[number];

export interface ExpenseCategoryRecord {
  id: string;
  businessId: string;
  name: string;
  deleted?: boolean;
  createdAt: string;
}

export interface Expense {
  id: string;
  businessId: string;
  /** Bank account used for bank/cheque expenses. Not applicable for cash expenses. */
  accountId?: string;
  date: string;
  amount: number;
  type: ExpenseType;
  category: string;
  /** Optional party reference (no ledger impact — for filtering/reporting only). */
  partyId?: string;
  mode?: PaymentMode;
  reference?: string;
  notes?: string;
  /** Optional imported amount captured as paid/received in external reports. */
  receivedPaidAmount?: number;
  /** Optional imported outstanding amount from external reports. */
  balanceDue?: number;
  /** Optional external order/document number used by report exports. */
  orderNo?: string;
  /** Optional item-level import metadata for expense item reports. */
  itemName?: string;
  itemDescription?: string;
  hsnSac?: string;
  quantity?: number;
  unitPrice?: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  lineAmount?: number;
  /**
   * Proof image URL (Cloudinary secure URL), e.g. bill/receipt photo.
   * Required client-side for non-cash payment modes.
   */
  proofDataUrl?: string;
  /** Original filename for display purposes. */
  proofName?: string;
  deleted?: boolean;
  createdAt: string;
  updatedAt?: string;
  /**
   * When true, the expense line appears on cash/bank history but does not change balances
   * (used for spreadsheet imports that mirror external books).
   */
  excludeFromLedger?: boolean;
}
