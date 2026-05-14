import { endOfMonth, isAfter, isBefore, startOfDay, startOfMonth } from "date-fns";

import type { Account, AccountTxn, Transfer } from "@/types/account";
import type { Payment } from "@/types/payment";
import type { Expense } from "@/types/expense";

/** True when this payment must not change bank/cash ledger (bulk import or legacy import marker). */
export function paymentExcludedFromLedger(
  p: Pick<Payment, "excludeFromLedger" | "notes">,
): boolean {
  if (p.excludeFromLedger) return true;
  return String(p.notes ?? "")
    .toLowerCase()
    .includes("excel import");
}

/** True when this expense must not change bank/cash ledger (bulk import flag or legacy marker). */
export function expenseExcludedFromLedger(
  e: Pick<Expense, "excludeFromLedger" | "notes">,
): boolean {
  if (e.excludeFromLedger) return true;
  return String(e.notes ?? "")
    .toLowerCase()
    .includes("excel import");
}

/** Ledger balance delta from this payment. Bulk-import rows do not move bank/cash. */
export function paymentBalanceImpact(p: Payment): number {
  if (paymentExcludedFromLedger(p)) return 0;
  return p.direction === "in" ? p.amount : -p.amount;
}

/** Signed amount for display when the payment is history-only. */
export function paymentDisplaySignedAmount(p: Payment): number {
  return p.direction === "in" ? p.amount : -p.amount;
}

function stablePrimaryAccount<T extends { id: string }>(accounts: T[]): T | undefined {
  if (accounts.length === 0) return undefined;
  return [...accounts].sort((a, b) => String(a.id).localeCompare(String(b.id)))[0];
}

/** Business id on payment DTOs is sometimes omitted; infer from the linked account when needed. */
function effectivePaymentBusinessId(
  p: Payment,
  accountsById: Record<string, Account>,
): string | undefined {
  const raw = p.businessId != null ? String(p.businessId).trim() : "";
  if (raw !== "") return raw;
  const fromAccount = p.accountId ? accountsById[p.accountId]?.businessId : undefined;
  if (fromAccount != null && String(fromAccount).trim() !== "") return String(fromAccount).trim();
  return undefined;
}

/** Same routing rules as {@link buildAccountTxns} for whether a payment hits an account. */
export function paymentBelongsToAccount(
  p: Payment,
  account: Account,
  accountsById: Record<string, Account>,
): boolean {
  const paymentBiz = effectivePaymentBusinessId(p, accountsById);
  if (paymentBiz && paymentBiz !== account.businessId) return false;
  const allAccounts = Object.values(accountsById);
  const cashAccounts = allAccounts.filter(
    (a) => a.type === "cash" && a.businessId === account.businessId,
  );
  const bankAccounts = allAccounts.filter(
    (a) => a.type === "bank" && a.businessId === account.businessId,
  );
  const primaryCash = stablePrimaryAccount(cashAccounts);
  const primaryBank = stablePrimaryAccount(bankAccounts);
  const paymentAccountName = p.account?.trim().toLowerCase();
  const accountName = account.name.trim().toLowerCase();
  const inferredByText =
    !p.accountId &&
    !!paymentAccountName &&
    (paymentAccountName === accountName ||
      (paymentAccountName === "cash" && account.type === "cash" && cashAccounts.length === 1) ||
      (paymentAccountName === "bank" && account.type === "bank" && bankAccounts.length === 1));
  const inferredByMode =
    !p.accountId &&
    !paymentAccountName &&
    ((p.mode === "cash" && account.type === "cash" && primaryCash?.id === account.id) ||
      ((p.mode === "bank" || p.mode === "cheque") &&
        account.type === "bank" &&
        primaryBank?.id === account.id));
  return p.accountId === account.id || inferredByText || inferredByMode;
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
    if (!paymentBelongsToAccount(p, account, accountsById)) continue;
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
    const ledgerAmt = paymentBalanceImpact(p);
    const memo = paymentExcludedFromLedger(p);
    const displayAmt = memo ? paymentDisplaySignedAmount(p) : undefined;
    const baseNote = isIn ? "Payment received" : "Payment made";
    txns.push({
      id: `pay_${p.id}`,
      accountId: account.id,
      date: p.date,
      kind: isIn ? "payment-in" : "payment-out",
      amount: ledgerAmt,
      displayAmount: displayAmt,
      ledgerMemo: memo,
      refNo: p.allocations.map((a) => a.docNumber).join(", ") || p.reference,
      // If the payment is allocated to a single document, link directly to it.
      // Otherwise route to the payments list filtered by this account.
      refLink: allocLink ?? paymentsListLink,
      note: memo ? `${baseNote} (history only)` : baseNote,
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
    const memo = expenseExcludedFromLedger(e);
    const ledgerAmt = memo ? 0 : -amt;
    const displayAmt = memo ? -amt : undefined;
    const baseNote = e.notes || "Expense";
    txns.push({
      id: `exp_${e.id}`,
      accountId: account.id,
      date: e.date,
      kind: "expense",
      amount: ledgerAmt,
      displayAmount: displayAmt,
      ledgerMemo: memo,
      refNo: e.category,
      note: memo ? `${baseNote} (history only)` : baseNote,
      refLink: `/expenses/${e.id}`,
    });
  }

  return txns.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function parseTxnCalendarDay(raw: string): Date | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const head = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (head) {
    const y = Number(head[1]);
    const m = Number(head[2]) - 1;
    const d = Number(head[3]);
    const x = new Date(y, m, d, 0, 0, 0, 0).getTime();
    if (Number.isNaN(x)) return null;
    return new Date(y, m, d, 0, 0, 0, 0);
  }
  const t = new Date(s).getTime();
  if (Number.isNaN(t)) return null;
  return startOfDay(new Date(s));
}

/**
 * Net ledger movement in `monthStart`'s calendar month (matches dashboard month filter).
 * Only lines dated inside that month count; months with no activity sum to 0.
 */
export function accountNetChangeInMonth(txns: AccountTxn[], monthStart: Date): number {
  const start = startOfMonth(monthStart);
  const end = endOfMonth(monthStart);
  let sum = 0;
  for (const t of txns) {
    const day = parseTxnCalendarDay(String(t.date ?? ""));
    if (!day) continue;
    const d0 = startOfDay(day);
    if (isBefore(d0, start)) continue;
    if (isAfter(d0, end)) continue;
    sum += t.amount;
  }
  return sum;
}

/** True if any non-opening ledger line falls in `monthStart`'s calendar month. */
export function accountHasNonOpeningActivityInMonth(txns: AccountTxn[], monthStart: Date): boolean {
  const start = startOfMonth(monthStart);
  const end = endOfMonth(monthStart);
  for (const t of txns) {
    if (t.kind === "opening") continue;
    const day = parseTxnCalendarDay(String(t.date ?? ""));
    if (!day) continue;
    const d0 = startOfDay(day);
    if (isBefore(d0, start)) continue;
    if (isAfter(d0, end)) continue;
    return true;
  }
  return false;
}

/**
 * Allocations on this account toward docs in `docIds` when the **payment date** is **outside**
 * `monthStart`'s month. Skips bulk-import and legacy import-marker payments.
 */
export function accountAllocatedOutsidePaymentMonth(
  account: Account,
  payments: Payment[],
  monthStart: Date,
  docIds: Set<string>,
  direction: "in" | "out",
  accountsById: Record<string, Account>,
): number {
  const start = startOfMonth(monthStart);
  const end = endOfMonth(monthStart);
  let sum = 0;
  for (const p of payments) {
    if (p.direction !== direction) continue;
    if (paymentExcludedFromLedger(p)) continue;
    if (!paymentBelongsToAccount(p, account, accountsById)) continue;
    const payDay = parseTxnCalendarDay(String(p.date ?? ""));
    if (!payDay) continue;
    const payInMonth = !isBefore(startOfDay(payDay), start) && !isAfter(startOfDay(payDay), end);
    if (payInMonth) continue;

    for (const a of p.allocations) {
      if (!docIds.has(a.docId)) continue;
      const amt = Math.max(0, Number(a.amount ?? 0));
      if (direction === "in") sum += amt;
      else sum -= amt;
    }
  }
  return sum;
}

/**
 * Balance implied by summing every recorded ledger line on or before the last day of
 * `monthStart`'s month (opening + payments + transfers + expenses), by each line's date.
 */
export function accountBalanceThroughMonth(txns: AccountTxn[], monthStart: Date): number {
  const periodEnd = endOfMonth(monthStart);
  let sum = 0;
  for (const t of txns) {
    const day = parseTxnCalendarDay(String(t.date ?? ""));
    if (!day) continue;
    if (isAfter(startOfDay(day), periodEnd)) continue;
    sum += t.amount;
  }
  return sum;
}

export function accountBalance(txns: AccountTxn[]): number {
  return txns.reduce((s, t) => s + t.amount, 0);
}
