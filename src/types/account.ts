export type AccountType = "cash" | "bank" | "upi";

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  cash: "Cash",
  bank: "Bank",
  upi: "UPI",
};

export interface Account {
  id: string;
  businessId: string;
  name: string;
  type: AccountType;
  openingBalance: number;
  /** Optional bank-only details. */
  accountNumber?: string;
  ifsc?: string;
  /** UPI VPA, optional. */
  upiId?: string;
  notes?: string;
  /** Soft delete. */
  deleted?: boolean;
  createdAt: string;
}

/**
 * Account ledger entries are computed live from payments / transfers / expenses
 * + the account's opening balance. We don't persist them separately.
 */
export type AccountTxnKind =
  | "opening"
  | "payment-in"
  | "payment-out"
  | "transfer-in"
  | "transfer-out"
  | "expense";

export interface AccountTxn {
  id: string;
  accountId: string;
  date: string;
  kind: AccountTxnKind;
  /** Positive = credit (money in). Negative = debit (money out). */
  amount: number;
  refNo?: string;
  refLink?: string;
  note?: string;
  partyName?: string;
}

export interface Transfer {
  id: string;
  businessId: string;
  date: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  notes?: string;
  createdAt: string;
}

/** Defaults seeded per business on first run. */
export const DEFAULT_ACCOUNT_SEEDS: Array<Pick<Account, "name" | "type" | "openingBalance">> = [
  { name: "Cash", type: "cash", openingBalance: 0 },
  { name: "Bank", type: "bank", openingBalance: 0 },
  { name: "UPI", type: "upi", openingBalance: 0 },
];
