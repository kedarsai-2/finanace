import type { PaymentMode } from "./payment";

export const DEFAULT_EXPENSE_CATEGORIES = [
  "Rent",
  "Utilities",
  "Salaries",
  "Travel",
  "Office Supplies",
  "Marketing",
  "Bank Charges",
  "Other",
] as const;

/** Categories are now user-managed strings. */
export type ExpenseCategory = string;

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
  accountId: string;
  date: string;
  amount: number;
  category: ExpenseCategory;
  /** Optional party reference (no ledger impact — for filtering/reporting only). */
  partyId?: string;
  mode?: PaymentMode;
  reference?: string;
  notes?: string;
  deleted?: boolean;
  createdAt: string;
  updatedAt?: string;
}
