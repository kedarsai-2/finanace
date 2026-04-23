import type { Account, AccountTxn, Transfer } from "@/types/account";
import type { Payment } from "@/types/payment";
import type { Expense } from "@/types/expense";

/**
 * Compute live transactions for an account from payments / transfers / expenses.
 * Sorted oldest → newest. Includes a synthetic "opening" entry.
 */
export function buildAccountTxns(args: {
  account: Account;
  payments: Payment[];
  transfers: Transfer[];
  expenses: Expense[];
  accountsById: Record<string, Account>;
}): AccountTxn[] {
  const { account, payments, transfers, expenses, accountsById } = args;
  const txns: AccountTxn[] = [];

  txns.push({
    id: `open_${account.id}`,
    accountId: account.id,
    date: account.createdAt,
    kind: "opening",
    amount: account.openingBalance,
    refNo: "OPEN",
    note: "Opening balance",
  });

  for (const p of payments) {
    if (p.accountId !== account.id) continue;
    const isIn = p.direction === "in";
    const singleAlloc = p.allocations.length === 1 ? p.allocations[0] : undefined;
    const allocLink = singleAlloc
      ? isIn
        ? `/invoices/${singleAlloc.docId}`
        : `/purchases/${singleAlloc.docId}`
      : undefined;
    txns.push({
      id: `pay_${p.id}`,
      accountId: account.id,
      date: p.date,
      kind: isIn ? "payment-in" : "payment-out",
      amount: isIn ? p.amount : -p.amount,
      refNo: p.allocations.map((a) => a.docNumber).join(", ") || p.reference,
      // If the payment is allocated to a single document, link directly to it.
      refLink: allocLink ?? `/payments/${p.id}`,
      note: isIn ? "Payment received" : "Payment made",
    });
  }

  for (const t of transfers) {
    if (t.fromAccountId === account.id) {
      const to = accountsById[t.toAccountId];
      txns.push({
        id: `tr_out_${t.id}`,
        accountId: account.id,
        date: t.date,
        kind: "transfer-out",
        amount: -t.amount,
        refNo: to ? `→ ${to.name}` : "Transfer out",
        note: t.notes || "Transfer",
      });
    }
    if (t.toAccountId === account.id) {
      const from = accountsById[t.fromAccountId];
      txns.push({
        id: `tr_in_${t.id}`,
        accountId: account.id,
        date: t.date,
        kind: "transfer-in",
        amount: t.amount,
        refNo: from ? `← ${from.name}` : "Transfer in",
        note: t.notes || "Transfer",
      });
    }
  }

  for (const e of expenses) {
    if (e.accountId !== account.id) continue;
    txns.push({
      id: `exp_${e.id}`,
      accountId: account.id,
      date: e.date,
      kind: "expense",
      amount: -e.amount,
      refNo: e.category,
      note: e.notes || "Expense",
    });
  }

  return txns.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

export function accountBalance(txns: AccountTxn[]): number {
  return txns.reduce((s, t) => s + t.amount, 0);
}
