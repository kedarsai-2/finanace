export type PaymentMode = "cash" | "bank" | "upi";

export interface Payment {
  id: string;
  businessId: string;
  partyId: string;
  date: string; // ISO
  amount: number;
  mode: PaymentMode;
  account?: string; // e.g. "HDFC ****1234", "Cash drawer", UPI VPA
  reference?: string; // cheque/UTR/UPI txn ref
  notes?: string;
  /** Allocations against invoices. Sum should equal amount. */
  allocations: PaymentAllocation[];
}

export interface PaymentAllocation {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
}

export const PAYMENT_MODE_LABEL: Record<PaymentMode, string> = {
  cash: "Cash",
  bank: "Bank",
  upi: "UPI",
};
