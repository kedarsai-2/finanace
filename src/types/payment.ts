export type PaymentMode = "cash" | "bank" | "cheque";
export type PaymentDirection = "in" | "out";

export interface Payment {
  id: string;
  businessId: string;
  partyId: string;
  /** "in" = received from a customer; "out" = paid to a supplier. */
  direction: PaymentDirection;
  date: string; // ISO
  amount: number;
  mode: PaymentMode;
  /** Linked account (required for new payments; may be undefined on legacy data). */
  accountId?: string;
  /** Free-text label kept for legacy display when accountId is missing. */
  account?: string;
  reference?: string;
  notes?: string;
  /**
   * Optional proof image as a base64 data URL (e.g. cheque photo or transfer
   * screenshot). Required client-side for non-cash modes.
   */
  proofDataUrl?: string;
  /** Allocations against invoices (direction "in") or purchases (direction "out"). */
  allocations: PaymentAllocation[];
}

export interface PaymentAllocation {
  /** Invoice id (for direction "in") or purchase id (for direction "out"). */
  docId: string;
  docNumber: string;
  amount: number;
}

export const PAYMENT_MODE_LABEL: Record<PaymentMode, string> = {
  cash: "Cash",
  bank: "Bank",
  cheque: "Cheque",
};

export const PAYMENT_DIRECTION_LABEL: Record<PaymentDirection, string> = {
  in: "Receive",
  out: "Pay",
};
