export const EXPENSE_CATEGORIES = [
  "Rent",
  "Utilities",
  "Salaries",
  "Travel",
  "Office Supplies",
  "Marketing",
  "Bank Charges",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface Expense {
  id: string;
  businessId: string;
  accountId: string;
  date: string;
  amount: number;
  category: ExpenseCategory;
  notes?: string;
  createdAt: string;
}
