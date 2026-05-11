import type { Account, AccountTxn, Transfer } from "@/types/account";
import type { Payment } from "@/types/payment";
import type { Expense } from "@/types/expense";

/** Ledger balance delta from this payment (all settled payments move cash/bank). */
export function paymentBalanceImpact(p: Payment): number {
  return p.direction === "in" ? p.amount : -p.amount;
}

function stablePrimaryAccount<T extends { id: string }>(accounts: T[]): T | undefined {
  if (accounts.length === 0) return undefined;
  return [...accounts].sort((a, b) => String(a.id).localeCompare(String(b.id)))[0];
}

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
  const allAccounts = Object.values(accountsById);
  const cashAccounts = allAccounts.filter(
    (a) => a.type === "cash" && a.businessId === account.businessId,
  );
  const bankAccounts = allAccounts.filter(
    (a) => a.type === "bank" && a.businessId === account.businessId,
  );
  const primaryCash = stablePrimaryAccount(cashAccounts);
  const primaryBank = stablePrimaryAccount(bankAccounts);

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
    if (p.businessId !== account.businessId) continue;
    const paymentAccountName = p.account?.trim().toLowerCase();
    const accountName = account.name.trim().toLowerCase();
    const inferredByText =
      !p.accountId &&
      !!paymentAccountName &&
      (paymentAccountName === accountName ||
        // Legacy generic labels ("cash"/"bank") map only when unambiguous.
        (paymentAccountName === "cash" && account.type === "cash" && cashAccounts.length === 1) ||
        (paymentAccountName === "bank" && account.type === "bank" && bankAccounts.length === 1));
    const inferredByMode =
      !p.accountId &&
      !paymentAccountName &&
      ((p.mode === "cash" && account.type === "cash" && primaryCash?.id === account.id) ||
        ((p.mode === "bank" || p.mode === "cheque") &&
          account.type === "bank" &&
          primaryBank?.id === account.id));
    const belongsToAccount =
      p.accountId === account.id ||
      // Backward-compat: older records may only have free-text account label.
      inferredByText ||
      // Final fallback for legacy rows with only payment mode and no account linkage.
      inferredByMode;
    if (!belongsToAccount) continue;
    const isIn = p.direction === "in";
    const singleAlloc = p.allocations.length === 1 ? p.allocations[0] : undefined;
    const docRefLink = (() => {
      const docNo = (singleAlloc?.docNumber ?? "").toUpperCase();
      if (docNo.startsWith("INV-")) return `/invoices/${singleAlloc?.docId}`;
      if (docNo.startsWith("CN-")) return `/credit-notes/${singleAlloc?.docId}`;
      if (docNo.startsWith("PRET-")) return `/purchase-returns/${singleAlloc?.docId}`;
      if (docNo.startsWith("PUR-")) return `/purchases/${singleAlloc?.docId}`;
      return isIn ? `/invoices/${singleAlloc?.docId}` : `/purchases/${singleAlloc?.docId}`;
    })();
    const allocLink = singleAlloc ? docRefLink : undefined;
    const paymentsListLink = `/payments?account=${encodeURIComponent(account.id)}`;
    txns.push({
      id: `pay_${p.id}`,
      accountId: account.id,
      date: p.date,
      kind: isIn ? "payment-in" : "payment-out",
      amount: paymentBalanceImpact(p),
      refNo: p.allocations.map((a) => a.docNumber).join(", ") || p.reference,
      // If the payment is allocated to a single document, link directly to it.
      // Otherwise route to the payments list filtered by this account.
      refLink: allocLink ?? paymentsListLink,
      note: isIn ? "Payment received" : "Payment made",
    });
  }

  for (const t of transfers) {
    if (t.businessId !== account.businessId) continue;
    const isAdjustment = t.kind === "adjustment";
    if (isAdjustment && t.fromAccountId === account.id) {
      const delta = t.adjustmentDirection === "decrement" ? -t.amount : t.amount;
      txns.push({
        id: `adj_${t.id}`,
        accountId: account.id,
        date: t.date,
        kind: delta >= 0 ? "transfer-in" : "transfer-out",
        amount: delta,
        refNo: "Adjustment",
        note: t.notes || "Balance adjustment",
      });
      continue;
    }
    if (t.fromAccountId === account.id) {
      const to = t.toAccountId ? accountsById[t.toAccountId] : undefined;
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
    if (e.businessId !== account.businessId) continue;
    if (e.deleted) continue;
    const amt = Math.max(0, Number(e.amount ?? 0));
    if (!(amt > 0)) continue;
    const inferredByExpenseMode =
      (!e.accountId &&
        e.mode === "cash" &&
        account.type === "cash" &&
        primaryCash?.id === account.id) ||
      (!e.accountId &&
        (e.mode === "bank" || e.mode === "cheque") &&
        account.type === "bank" &&
        primaryBank?.id === account.id);
    const belongsToExpenseAccount = e.accountId === account.id || inferredByExpenseMode;
    if (!belongsToExpenseAccount) continue;
    txns.push({
      id: `exp_${e.id}`,
      accountId: account.id,
      date: e.date,
      kind: "expense",
      amount: -amt,
      refNo: e.category,
      note: e.notes || "Expense",
      refLink: `/expenses/${e.id}`,
    });
  }

  return txns.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function accountBalance(txns: AccountTxn[]): number {
  return txns.reduce((s, t) => s + t.amount, 0);
}
