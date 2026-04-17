export type PartyType = "customer" | "supplier" | "both";

export interface Party {
  id: string;
  name: string;
  type: PartyType;
  mobile: string;
  email?: string;
  /** Positive = receivable (they owe you). Negative = payable (you owe them). */
  balance: number;
  city?: string;
  state?: string;
  /** Owning business id */
  businessId: string;
}
