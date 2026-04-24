import type { PaymentMode } from "./payment";

export const DEFAULT_EXPENSE_CATEGORIES = [
  "direct",
  "indirect",
] as const;

/** Expense categories are fixed to direct/indirect. */
export type ExpenseCategory = (typeof DEFAULT_EXPENSE_CATEGORIES)[number];

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
  category: ExpenseCategory;
  /** Optional party reference (no ledger impact — for filtering/reporting only). */
  partyId?: string;
  mode?: PaymentMode;
  reference?: string;
  notes?: string;
  /**
   * Proof image as a base64 data URL (e.g. bill/receipt photo).
   * Required client-side for non-cash payment modes.
   */
  proofDataUrl?: string;
  /** Original filename for display purposes. */
  proofName?: string;
  deleted?: boolean;
  createdAt: string;
  updatedAt?: string;
}
