export type PartyType = "customer" | "supplier" | "both";
export type BalanceSide = "receivable" | "payable";

export interface Address {
  line1?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export type LedgerTxnType =
  | "opening"
  | "invoice"
  | "payment"
  | "purchase"
  | "expense";

export interface LedgerEntry {
  id: string;
  partyId: string;
  date: string; // ISO
  note: string;
  amount: number; // positive = receivable, negative = payable
  type?: LedgerTxnType;
  refNo?: string;
  refLink?: string; // optional path to open the source document
}

export interface Party {
  id: string;
  businessId: string;
  name: string;
  type: PartyType;
  mobile: string;
  email?: string;
  address?: Address;
  gstNumber?: string;
  panNumber?: string;
  creditLimit?: number;
  paymentTermsDays?: number;
  openingBalance?: number; // positive = receivable, negative = payable
  /** Positive = receivable (they owe you). Negative = payable (you owe them). */
  balance: number;
  // Convenience for table display:
  city?: string;
  state?: string;
}
