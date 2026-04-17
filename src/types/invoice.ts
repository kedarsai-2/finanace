export type InvoiceStatus = "draft" | "final" | "cancelled";
export type PaymentStatus = "unpaid" | "partial" | "paid";

export interface InvoiceLine {
  id: string;
  itemId?: string;
  name: string;
  qty: number;
  unit: string;
  rate: number;
  taxPercent: number;
}

export interface Invoice {
  id: string;
  businessId: string;
  number: string; // e.g. INV-0001
  date: string; // ISO
  dueDate?: string; // ISO
  partyId: string;
  partyName: string; // denormalised for fast list rendering
  lines: InvoiceLine[];
  subtotal: number;
  taxTotal: number;
  total: number;
  paidAmount: number;
  status: InvoiceStatus;
  /** Soft-delete marker. Hidden everywhere when true. */
  deleted?: boolean;
  notes?: string;
}

export function paymentStatusOf(inv: Pick<Invoice, "total" | "paidAmount" | "status">): PaymentStatus {
  if (inv.status === "cancelled") return "unpaid";
  if (inv.paidAmount <= 0) return "unpaid";
  if (inv.paidAmount >= inv.total) return "paid";
  return "partial";
}
