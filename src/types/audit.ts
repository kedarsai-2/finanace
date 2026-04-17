export type AuditModule =
  | "party"
  | "item"
  | "invoice"
  | "purchase"
  | "payment"
  | "expense"
  | "expenseCategory"
  | "account"
  | "transfer"
  | "business";

export type AuditAction = "create" | "edit" | "delete" | "cancel" | "payment";

export interface AuditChange {
  field: string;
  before: unknown;
  after: unknown;
}

export interface AuditEntry {
  id: string;
  timestamp: string; // ISO
  user: string;
  businessId?: string;
  module: AuditModule;
  action: AuditAction;
  /** Affected record id. */
  recordId: string;
  /** Human label (e.g. "INV-0001", "Acme Industries"). */
  reference: string;
  /** Optional path to open the related record. */
  refLink?: string;
  /** Field-level diff (omit for create/delete). */
  changes?: AuditChange[];
  /** Snapshot for create/delete so the diff dialog can show full payload. */
  snapshot?: Record<string, unknown>;
}

export const AUDIT_MODULE_LABEL: Record<AuditModule, string> = {
  party: "Party",
  item: "Item",
  invoice: "Invoice",
  purchase: "Purchase",
  payment: "Payment",
  expense: "Expense",
  expenseCategory: "Expense Category",
  account: "Account",
  transfer: "Transfer",
  business: "Business",
};

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  create: "Created",
  edit: "Edited",
  delete: "Deleted",
  cancel: "Cancelled",
  payment: "Payment",
};
