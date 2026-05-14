import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import {
  endOfDay,
  format,
  isSameMonth,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  FileText,
  CreditCard,
  Building2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
} from "recharts";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useListPagination } from "@/hooks/useListPagination";
import { ListPaginationBar } from "@/components/ui/ListPaginationBar";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useInvoices } from "@/hooks/useInvoices";
import { usePurchases } from "@/hooks/usePurchases";
import { usePayments } from "@/hooks/usePayments";
import { useExpenses } from "@/hooks/useExpenses";
import { useAccounts } from "@/hooks/useAccounts";
import { useTransfers } from "@/hooks/useTransfers";
import { formatCurrency } from "@/hooks/useParties";
import {
  accountAllocatedOutsidePaymentMonth,
  accountDisplayFlowNetInMonth,
  accountHistoryOnlyDisplayFlowNetInMonth,
  accountNetChangeInMonth,
  buildAccountTxns,
  expenseExcludedFromLedger,
  paymentExcludedFromLedger,
} from "@/lib/accountLedger";
import { parseSpreadsheetPaymentMode } from "@/lib/spreadsheetImportLedger";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard - QOBOX" },
      { name: "description", content: "Sales, expenses, receivables and payables at a glance." },
    ],
  }),
  component: DashboardPage,
});

type Range = "30d" | "6m" | "1y";

const RANGE_LABEL: Record<Range, string> = {
  "30d": "30 days",
  "6m": "6 months",
  "1y": "1 year",
};

/** Parse stored ISO / calendar dates without UTC shifting `yyyy-mm-dd` across month boundaries. */
function parseDashDate(raw: string): Date | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const head = s.slice(0, 10);
  const m = head.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    const dt = new Date(y, mo, d);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const t = new Date(s);
  return Number.isNaN(t.getTime()) ? null : t;
}

/** First calendar day of `yyyy-MM` in local time (must not use `new Date("yyyy-MM-dd")` — that is UTC). */
function parseYearMonthFirstDay(ym: string): Date | null {
  const m = String(ym ?? "")
    .trim()
    .match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  if (!Number.isFinite(y) || mo < 0 || mo > 11) return null;
  const dt = new Date(y, mo, 1);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function DashboardPage() {
  const { businesses, activeId, scopedBusinessId, isAll, hydrated } = useBusinesses();
  const businessIds = useMemo(() => businesses.map((b) => b.id), [businesses]);
  const business = businesses.find((b) => b.id === activeId);
  const currency = business?.currency ?? "INR";

  const { invoices, creditNotes } = useInvoices(scopedBusinessId);
  const { purchases, returns } = usePurchases(scopedBusinessId);
  const { payments } = usePayments(scopedBusinessId);
  const { expenses } = useExpenses(scopedBusinessId);
  const { accounts } = useAccounts(scopedBusinessId, businessIds);
  const { transfers } = useTransfers(scopedBusinessId);

  const [range, setRange] = useState<Range>("6m");
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const monthOptions = useMemo(
    () =>
      Array.from({ length: 36 }).map((_, idx) => {
        const d = subMonths(new Date(), idx);
        return { value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy") };
      }),
    [],
  );
  const monthStart = useMemo(
    () => startOfMonth(parseYearMonthFirstDay(selectedMonth) ?? new Date()),
    [selectedMonth],
  );
  const inSelectedMonth = useCallback(
    (value: string) => {
      const d = parseDashDate(value);
      return d != null && isSameMonth(d, monthStart);
    },
    [monthStart],
  );

  const liveInvoices = useMemo(() => invoices.filter((i) => i.status !== "cancelled"), [invoices]);
  const livePurchases = useMemo(
    () => purchases.filter((p) => p.status !== "cancelled"),
    [purchases],
  );
  const liveCreditNotes = useMemo(
    () => creditNotes.filter((cn) => cn.status !== "cancelled"),
    [creditNotes],
  );
  const livePurchaseReturns = useMemo(
    () => returns.filter((r) => r.status !== "cancelled"),
    [returns],
  );
  const monthInvoices = useMemo(
    () => liveInvoices.filter((i) => inSelectedMonth(i.date)),
    [liveInvoices, inSelectedMonth],
  );
  const monthPurchases = useMemo(
    () => livePurchases.filter((p) => inSelectedMonth(p.date)),
    [livePurchases, inSelectedMonth],
  );
  const monthCreditNotes = useMemo(
    () => liveCreditNotes.filter((cn) => inSelectedMonth(cn.date)),
    [liveCreditNotes, inSelectedMonth],
  );
  const monthPurchaseReturns = useMemo(
    () => livePurchaseReturns.filter((r) => inSelectedMonth(r.date)),
    [livePurchaseReturns, inSelectedMonth],
  );
  const monthExpenses = useMemo(
    () => expenses.filter((e) => inSelectedMonth(e.date)),
    [expenses, inSelectedMonth],
  );
  const monthPayments = useMemo(
    () => payments.filter((p) => inSelectedMonth(p.date)),
    [payments, inSelectedMonth],
  );
  const monthPaymentsForLedger = useMemo(
    () => monthPayments.filter((p) => !paymentExcludedFromLedger(p)),
    [monthPayments],
  );

  const totalSales = monthInvoices.reduce((s, i) => s + i.total, 0);
  const totalCreditNotes = monthCreditNotes.reduce((s, cn) => s + cn.total, 0);
  const totalReceivable = monthInvoices.reduce((s, i) => s + (i.total - i.paidAmount), 0);
  const totalPurchases = monthPurchases.reduce((s, p) => s + p.total, 0);
  const totalPurchaseReturns = monthPurchaseReturns.reduce((s, p) => s + p.total, 0);
  const totalPaidSuppliers = monthPurchases.reduce((s, p) => s + p.paidAmount, 0);
  const totalPayable = monthPurchases.reduce((s, p) => s + (p.total - p.paidAmount), 0);
  const totalExpenses = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const totalPaymentsPaid = monthPaymentsForLedger.reduce(
    (s, p) => (p.direction === "out" ? s + p.amount : s),
    0,
  );
  const totalPaymentsReceived = monthPaymentsForLedger.reduce(
    (s, p) => (p.direction === "in" ? s + p.amount : s),
    0,
  );
  /** Collections in the selected month (payment date), including invoice-linked receipts. */
  const totalReceived = totalPaymentsReceived;

  /** Paid portions on invoices in the month, split by stored payment mode (import/UI). Not the same as ledger cash/bank. */
  const salesPaidByChannel = useMemo(() => {
    let bankLike = 0;
    let cashLike = 0;
    for (const i of monthInvoices) {
      const paid = Math.max(0, Number(i.paidAmount ?? 0));
      if (paid <= 0.005) continue;
      const mode = parseSpreadsheetPaymentMode(i.paymentType ?? "");
      if (mode === "cash") cashLike += paid;
      else bankLike += paid;
    }
    return { bankLike, cashLike };
  }, [monthInvoices]);

  /** Supplier payments on purchases dated this month (paid amount × purchase payment mode). */
  const purchasesPaidByChannel = useMemo(() => {
    let bankLike = 0;
    let cashLike = 0;
    for (const p of monthPurchases) {
      const paid = Math.max(0, Number(p.paidAmount ?? 0));
      if (paid <= 0.005) continue;
      const mode = p.purchasePaymentMode ?? "cash";
      if (mode === "bank" || mode === "cheque") bankLike += paid;
      else cashLike += paid;
    }
    return { bankLike, cashLike };
  }, [monthPurchases]);

  /** Expenses dated this month split by payment mode (defaults to cash when unset). */
  const expensesByChannel = useMemo(() => {
    let bankLike = 0;
    let cashLike = 0;
    for (const e of monthExpenses) {
      const amt = Math.max(0, Number(e.amount ?? 0));
      if (amt <= 0.005) continue;
      const m = e.mode ?? "cash";
      if (m === "bank" || m === "cheque") bankLike += amt;
      else cashLike += amt;
    }
    return { bankLike, cashLike };
  }, [monthExpenses]);

  /** Exactly one of sales / purchases / expenses has a non-zero month total — show document-level cash vs bank split. */
  const singleDocKind = useMemo(() => {
    const hasS = totalSales > 0.005;
    const hasP = totalPurchases > 0.005;
    const hasE = totalExpenses > 0.005;
    const n = [hasS, hasP, hasE].filter(Boolean).length;
    if (n !== 1) return null;
    if (hasS) return "sales" as const;
    if (hasP) return "purchases" as const;
    return "expenses" as const;
  }, [totalSales, totalPurchases, totalExpenses]);

  const netCashBankNote = useMemo(() => {
    const m = format(monthStart, "MMMM yyyy");
    return `Net for ${m}: lines dated in ${m} (payments, transfers, expenses), plus money dated in other months but allocated to invoices or purchases dated in ${m}. Bulk-import payments and expenses marked history-only do not change bank or cash. Credit sales with no payment stay ₹0 here until you record one.`;
  }, [monthStart]);

  const netProfit =
    totalSales +
    totalPaymentsReceived -
    totalPurchases -
    totalPaymentsPaid +
    totalPurchaseReturns -
    totalCreditNotes -
    totalExpenses;

  /** Cash/bank: net movement for the month (incl. cross-month allocations to this month's docs). */
  const accountsForBalances = useMemo(() => {
    if (!scopedBusinessId) return accounts;
    return accounts.filter((a) => a.businessId === scopedBusinessId);
  }, [accounts, scopedBusinessId]);

  const monthInvoiceIds = useMemo(() => new Set(monthInvoices.map((i) => i.id)), [monthInvoices]);
  const monthPurchaseIds = useMemo(
    () => new Set(monthPurchases.map((p) => p.id)),
    [monthPurchases],
  );

  const accountBalances = useMemo(() => {
    const accountsById = Object.fromEntries(accountsForBalances.map((a) => [a.id, a]));
    let cash = 0;
    let bank = 0;
    let cashActivity = 0;
    let bankActivity = 0;
    let cashCount = 0;
    let bankCount = 0;
    const cashRows: {
      id: string;
      name: string;
      ledgerNet: number;
      activityNet: number;
      historyOnlyInMonth: number;
    }[] = [];
    const bankRows: {
      id: string;
      name: string;
      ledgerNet: number;
      activityNet: number;
      historyOnlyInMonth: number;
    }[] = [];
    for (const a of accountsForBalances) {
      const txns = buildAccountTxns({
        account: a,
        payments,
        transfers,
        expenses,
        accountsById,
      });
      const inMonth = accountNetChangeInMonth(txns, monthStart);
      const liftSales = accountAllocatedOutsidePaymentMonth(
        a,
        payments,
        monthStart,
        monthInvoiceIds,
        "in",
        accountsById,
      );
      const liftPurchases = accountAllocatedOutsidePaymentMonth(
        a,
        payments,
        monthStart,
        monthPurchaseIds,
        "out",
        accountsById,
      );
      const ledgerNet = inMonth + liftSales + liftPurchases;
      const activityNet = accountDisplayFlowNetInMonth(txns, monthStart);
      const historyOnlyInMonth = accountHistoryOnlyDisplayFlowNetInMonth(txns, monthStart);
      const row = { id: a.id, name: a.name, ledgerNet, activityNet, historyOnlyInMonth };
      if (a.type === "cash") {
        cash += ledgerNet;
        cashActivity += activityNet;
        cashCount += 1;
        cashRows.push(row);
      } else {
        bank += ledgerNet;
        bankActivity += activityNet;
        bankCount += 1;
        bankRows.push(row);
      }
    }
    return {
      cash,
      bank,
      cashActivity,
      bankActivity,
      cashCount,
      bankCount,
      cashRows,
      bankRows,
    };
  }, [
    accountsForBalances,
    payments,
    transfers,
    expenses,
    monthStart,
    monthInvoiceIds,
    monthPurchaseIds,
  ]);

  const cashCardFooter = useMemo(() => {
    const single =
      singleDocKind != null ? (
        <SingleMetricChannelFooter
          kind={singleDocKind}
          channel="cash"
          currency={currency}
          monthLabel={format(monthStart, "MMMM yyyy")}
          salesPaid={salesPaidByChannel}
          purchasesPaid={purchasesPaidByChannel}
          expensesCh={expensesByChannel}
        />
      ) : null;

    const ledgerBlock =
      accountBalances.cashRows.length > 0 ? (
        <AccountMonthBreakdown rows={accountBalances.cashRows} currency={currency} />
      ) : salesPaidByChannel.cashLike > 0.005 ? (
        <InvoicePaidChannelHint
          title="Cash / petty (from invoices paid this month)"
          amount={salesPaidByChannel.cashLike}
          currency={currency}
        />
      ) : totalSales > 0.005 ? (
        <p className="text-xs text-muted-foreground">
          No cash ledger movement for {format(monthStart, "MMMM")} yet — usually credit sales,
          history-only imports, or payments dated in another month.
        </p>
      ) : null;

    if (!single && !ledgerBlock) return null;
    return (
      <div className="space-y-2">
        {single}
        {ledgerBlock}
      </div>
    );
  }, [
    singleDocKind,
    accountBalances.cashRows,
    salesPaidByChannel,
    purchasesPaidByChannel,
    expensesByChannel,
    totalSales,
    currency,
    monthStart,
  ]);

  const bankCardFooter = useMemo(() => {
    const single =
      singleDocKind != null ? (
        <SingleMetricChannelFooter
          kind={singleDocKind}
          channel="bank"
          currency={currency}
          monthLabel={format(monthStart, "MMMM yyyy")}
          salesPaid={salesPaidByChannel}
          purchasesPaid={purchasesPaidByChannel}
          expensesCh={expensesByChannel}
        />
      ) : null;

    const ledgerBlock =
      accountBalances.bankRows.length > 0 ? (
        <AccountMonthBreakdown rows={accountBalances.bankRows} currency={currency} />
      ) : salesPaidByChannel.bankLike > 0.005 ? (
        <InvoicePaidChannelHint
          title="Bank / UPI / cheque (from invoices paid this month)"
          amount={salesPaidByChannel.bankLike}
          currency={currency}
        />
      ) : totalSales > 0.005 ? (
        <p className="text-xs text-muted-foreground">
          No bank ledger movement for {format(monthStart, "MMMM")} yet — often unpaid invoices or
          history-only imports. Saving a bank or UPI payment can create a default Bank account when
          none exists.
        </p>
      ) : null;

    if (!single && !ledgerBlock) return null;
    return (
      <div className="space-y-2">
        {single}
        {ledgerBlock}
      </div>
    );
  }, [
    singleDocKind,
    accountBalances.bankRows,
    salesPaidByChannel,
    purchasesPaidByChannel,
    expensesByChannel,
    totalSales,
    currency,
    monthStart,
  ]);

  // Trend uses all-time rows for the rolling window — not the dashboard month filter.
  const trendData = useMemo(
    () =>
      buildTrend(
        range,
        liveInvoices.map((i) => ({ date: i.date, total: i.total })),
        expenses.map((e) => ({ date: e.date, amount: e.amount })),
      ),
    [range, liveInvoices, expenses],
  );

  const recent = useMemo(() => {
    type Item = {
      id: string;
      kind: "invoice" | "payment" | "expense";
      date: string;
      title: string;
      subtitle: string;
      amount: number;
      sign: "in" | "out";
      href: string;
      historyOnly?: boolean;
    };
    const items: Item[] = [];
    for (const i of monthInvoices) {
      items.push({
        id: `inv_${i.id}`,
        kind: "invoice",
        date: i.date,
        title: i.number,
        subtitle: i.partyName,
        amount: i.total,
        sign: "in",
        href: `/invoices/${i.id}`,
      });
    }
    for (const p of monthPayments) {
      const historyOnly = paymentExcludedFromLedger(p);
      const docLine = p.allocations.map((a) => a.docNumber).join(", ") || p.reference || "—";
      items.push({
        id: `pay_${p.id}`,
        kind: "payment",
        date: p.date,
        title: p.direction === "in" ? "Payment received" : "Payment paid",
        subtitle: historyOnly ? `${docLine} · Import — bank/cash unchanged` : docLine,
        amount: p.amount,
        sign: p.direction === "in" ? "in" : "out",
        href: `/payments`,
        historyOnly,
      });
    }
    for (const e of monthExpenses) {
      const historyOnly = expenseExcludedFromLedger(e);
      const baseSub = e.notes || e.reference || "Expense";
      items.push({
        id: `exp_${e.id}`,
        kind: "expense",
        date: e.date,
        title: e.category,
        subtitle: historyOnly ? `${baseSub} · Import — bank/cash unchanged` : baseSub,
        amount: e.amount,
        sign: "out",
        href: `/expenses/${e.id}`,
        historyOnly,
      });
    }
    return items.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [monthInvoices, monthPayments, monthExpenses]);

  const recentPg = useListPagination(recent, `${range}|${selectedMonth}`);

  if (!hydrated) {
    return <div className="max-w-screen-2xl px-6 py-10">Loading…</div>;
  }

  if (businesses.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary-glow text-primary-foreground">
            <Building2 className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-xl font-semibold">Welcome to QOBOX</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Create your first business to start tracking invoices, expenses, and GST.
          </p>
          <Button asChild size="lg" className="mt-6 gap-2">
            <Link to="/businesses/new">
              <Plus className="h-4 w-4" />
              Add Your First Business
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const isEmpty =
    monthInvoices.length === 0 && monthPayments.length === 0 && monthExpenses.length === 0;

  const hasAnyActivityEver =
    liveInvoices.length > 0 ||
    livePurchases.length > 0 ||
    liveCreditNotes.length > 0 ||
    livePurchaseReturns.length > 0 ||
    payments.length > 0 ||
    expenses.length > 0;

  return (
    <div className="max-w-screen-2xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {isAll ? "All Companies" : (business?.name ?? "Workspace")}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-[180px]">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/invoices/new">
              <Plus className="h-4 w-4" />
              Invoice
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/payments/new">
              <Plus className="h-4 w-4" />
              Payment
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/expenses/new">
              <Plus className="h-4 w-4" />
              Expense
            </Link>
          </Button>
        </div>
      </header>

      {isEmpty && (
        <div className="mb-6 rounded-xl border border-dashed border-border bg-card/40 p-5 text-sm text-muted-foreground">
          {hasAnyActivityEver ? (
            <>
              <p className="font-medium text-foreground">
                No activity in {format(monthStart, "MMMM yyyy")}.
              </p>
              <p className="mt-1">
                Summary cards only include the month selected above. Choose a different month to see
                your data, or add new transactions for this period.
              </p>
            </>
          ) : (
            <>
              <p className="font-medium text-foreground">Your dashboard is empty.</p>
              <p className="mt-1">
                Start by creating an{" "}
                <Link to="/invoices/new" className="text-primary hover:underline">
                  invoice
                </Link>
                , recording a{" "}
                <Link to="/payments/new" className="text-primary hover:underline">
                  payment
                </Link>
                , or logging an{" "}
                <Link to="/expenses/new" className="text-primary hover:underline">
                  expense
                </Link>
                .
              </p>
            </>
          )}
        </div>
      )}

      {/* Section 1: Summary cards */}
      <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          to="/reports/sales"
          label="Total Sales"
          value={formatCurrency(totalSales, currency)}
          icon={<TrendingUp className="h-4 w-4" />}
          tone="primary"
        />
        <SummaryCard
          to="/reports/sales"
          label="Total Received"
          value={formatCurrency(totalReceived, currency)}
          icon={<ArrowDownRight className="h-4 w-4" />}
          tone="success"
        />
        <SummaryCard
          to="/reports/expenses"
          label="Total Expenses"
          value={formatCurrency(totalExpenses, currency)}
          icon={<Receipt className="h-4 w-4" />}
          tone="warning"
        />
        <SummaryCard
          to="/reports"
          label="Net Profit"
          value={formatCurrency(netProfit, currency)}
          note="Sales - Credit Note - Purchase + Purchase Return - Payment Pay + Payment Received - Expenses"
          icon={
            netProfit >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )
          }
          tone={netProfit >= 0 ? "success" : "destructive"}
          signed={netProfit < 0 ? "-" : ""}
        />
      </section>

      {/* Section 2: Receivables / Payables / Accounts */}
      <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <BalanceCard
          to="/reports/parties"
          label="Total Receivable"
          sublabel="Customers owe you"
          amount={totalReceivable}
          currency={currency}
          tone="success"
          icon={<ArrowDownRight className="h-4 w-4" />}
        />
        <BalanceCard
          to="/reports/parties"
          label="Total Payable"
          sublabel="You owe suppliers"
          amount={totalPayable}
          currency={currency}
          tone="destructive"
          icon={<ArrowUpRight className="h-4 w-4" />}
        />
        <BalanceCard
          to="/cash"
          label="Cash Accounts"
          sublabel={`${accountBalances.cashCount} accounts · net ${format(monthStart, "MMM yyyy")}`}
          note={netCashBankNote}
          amount={accountBalances.cash}
          currency={currency}
          tone="primary"
          amountToneFromSign
          icon={<Wallet className="h-4 w-4" />}
          footer={cashCardFooter}
        />
        <BalanceCard
          to="/accounts"
          label="Bank Accounts"
          sublabel={`${accountBalances.bankCount} accounts · net ${format(monthStart, "MMM yyyy")}`}
          note={netCashBankNote}
          amount={accountBalances.bank}
          currency={currency}
          tone="primary"
          amountToneFromSign
          icon={<CreditCard className="h-4 w-4" />}
          footer={bankCardFooter}
        />
      </section>

      <section className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Trends
          </h2>
          <div className="inline-flex rounded-lg border border-border bg-background p-0.5">
            {(["30d", "6m", "1y"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  range === r
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {RANGE_LABEL[r]}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <TrendCard
            title="Sales Trend"
            color="var(--primary)"
            data={trendData}
            dataKey="sales"
            currency={currency}
          />
          <TrendCard
            title="Expense Trend"
            color="var(--destructive)"
            data={trendData}
            dataKey="expense"
            currency={currency}
          />
        </div>
      </section>

      {/* Section 4: Recent activity */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recent Activity
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/reports">View all reports</Link>
          </Button>
        </div>
        {recent.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 px-6 py-12 text-center text-sm text-muted-foreground">
            No activity yet
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {recentPg.pageItems.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    r.kind === "invoice" && "bg-primary/10 text-primary",
                    r.kind === "payment" && "bg-success/15 text-success",
                    r.kind === "expense" && "bg-destructive/10 text-destructive",
                  )}
                >
                  {r.kind === "invoice" && <FileText className="h-4 w-4" />}
                  {r.kind === "payment" && <CreditCard className="h-4 w-4" />}
                  {r.kind === "expense" && <Receipt className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.subtitle}</p>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      r.historyOnly && "text-muted-foreground",
                      !r.historyOnly && r.sign === "in" && "text-success",
                      !r.historyOnly && r.sign === "out" && "text-destructive",
                    )}
                  >
                    {r.sign === "in" ? "+" : "-"}
                    {formatCurrency(r.amount, currency)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(r.date), "dd/MM/yyyy")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        {recent.length > 0 && (
          <ListPaginationBar
            page={recentPg.page}
            totalPages={recentPg.totalPages}
            totalCount={recentPg.totalCount}
            rangeFrom={recentPg.rangeFrom}
            rangeTo={recentPg.rangeTo}
            onPageChange={recentPg.setPage}
            className="mt-3 rounded-xl border border-border bg-card"
          />
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  to,
  label,
  value,
  note,
  icon,
  tone,
  signed = "",
}: {
  to: string;
  label: string;
  value: string;
  note?: string;
  icon: React.ReactNode;
  tone: "primary" | "success" | "warning" | "destructive";
  signed?: string;
}) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning-foreground/80",
    destructive: "bg-destructive/10 text-destructive",
  }[tone];
  return (
    <Link
      to={to}
      className="group rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", toneCls)}>
          {icon}
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">
        {signed}
        {value}
      </p>
      {note ? <p className="mt-1 text-[11px] text-muted-foreground">{note}</p> : null}
    </Link>
  );
}

function InvoicePaidChannelHint({
  title,
  amount,
  currency,
}: {
  title: string;
  amount: number;
  currency: string;
}) {
  return (
    <div className="text-xs text-muted-foreground">
      <p className="mb-1 font-medium text-foreground/90">{title}</p>
      <p className="font-semibold tabular-nums text-success">{formatCurrency(amount, currency)}</p>
      <p className="mt-1 text-[10px] leading-snug">
        Split from each invoice&apos;s paid amount and payment mode. Card totals above follow the
        cash/bank ledger (payments, transfers, expenses), so they can differ until those are
        recorded.
      </p>
    </div>
  );
}

/** `formatCurrency` strips sign; this preserves minus for outflows. */
function formatSignedCurrency(amount: number, currency: string) {
  const core = formatCurrency(Math.abs(amount), currency);
  if (amount < 0) return `-${core}`;
  return core;
}

function SingleMetricChannelFooter({
  kind,
  channel,
  currency,
  monthLabel,
  salesPaid,
  purchasesPaid,
  expensesCh,
}: {
  kind: "sales" | "purchases" | "expenses";
  channel: "cash" | "bank";
  currency: string;
  monthLabel: string;
  salesPaid: { cashLike: number; bankLike: number };
  purchasesPaid: { cashLike: number; bankLike: number };
  expensesCh: { cashLike: number; bankLike: number };
}) {
  const flow: "in" | "out" = kind === "sales" ? "in" : "out";
  const raw =
    kind === "sales"
      ? channel === "cash"
        ? salesPaid.cashLike
        : salesPaid.bankLike
      : kind === "purchases"
        ? channel === "cash"
          ? purchasesPaid.cashLike
          : purchasesPaid.bankLike
        : channel === "cash"
          ? expensesCh.cashLike
          : expensesCh.bankLike;

  const label =
    kind === "sales"
      ? channel === "cash"
        ? "Sales — paid (cash / petty)"
        : "Sales — paid (bank / UPI / cheque)"
      : kind === "purchases"
        ? channel === "cash"
          ? "Purchases — paid (cash)"
          : "Purchases — paid (bank / cheque)"
        : channel === "cash"
          ? "Expenses (cash)"
          : "Expenses (bank / UPI / cheque)";

  const signed = flow === "in" ? raw : -raw;
  const hasAmount = raw > 0.005;
  const toneCls = !hasAmount
    ? "text-muted-foreground"
    : signed > 0.005
      ? "text-success"
      : signed < -0.005
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <div className="rounded-lg border border-border/80 bg-muted/20 px-2.5 py-2 text-xs">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {monthLabel} · By payment mode
      </p>
      <p className="mt-0.5 text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-base font-semibold tabular-nums", toneCls)}>
        {!hasAmount ? "—" : formatSignedCurrency(signed, currency)}
      </p>
      {!hasAmount ? (
        <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
          {kind === "sales"
            ? "Nothing on this channel (e.g. all credit, or paid amounts tagged to the other channel)."
            : kind === "purchases"
              ? "No supplier payments on this channel for bills dated this month."
              : "No expenses on this channel dated this month."}
        </p>
      ) : null}
      <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
        Uses document dates in {monthLabel} and each line&apos;s mode. Headline amounts on this card
        are still ledger net (payments, transfers, exclusions).
      </p>
    </div>
  );
}

function AccountMonthBreakdown({
  rows,
  currency,
}: {
  rows: {
    id: string;
    name: string;
    ledgerNet: number;
    activityNet: number;
    historyOnlyInMonth: number;
  }[];
  currency: string;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="text-xs text-muted-foreground">
      <p className="mb-1.5 font-medium text-foreground/90">Per account</p>
      <ul className="space-y-1">
        {rows.map((r) => {
          const diff = Math.abs(r.activityNet - r.ledgerNet) > 0.005;
          const historyOnlyExplains =
            diff &&
            Math.abs(r.ledgerNet) < 0.005 &&
            Math.abs(r.activityNet - r.historyOnlyInMonth) < 0.05;
          return (
            <li key={r.id} className="flex justify-between gap-2 tabular-nums">
              <span className="min-w-0 truncate">{r.name}</span>
              <span className="shrink-0 text-right">
                <span title="Ledger net for this month (balance impact, incl. money dated elsewhere but tied to this month's invoices/purchases)">
                  {formatCurrency(r.ledgerNet, currency)}
                </span>
                {diff ? (
                  <>
                    <span className="text-muted-foreground"> · </span>
                    <span
                      title={
                        historyOnlyExplains
                          ? "All of this is from lines dated in this month shown for reference; bulk-import history-only rows do not change balance"
                          : "Signed flow for every line dated in this month (register view). Includes history-only imports that do not change the first amount."
                      }
                    >
                      {formatCurrency(r.activityNet, currency)}
                      {historyOnlyExplains ? (
                        <span className="text-[10px] font-normal text-muted-foreground">
                          {" "}
                          (history-only imports dated this month)
                        </span>
                      ) : null}
                    </span>
                  </>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-1.5 text-[10px] leading-snug">
        First amount: ledger impact for the dashboard month. Second amount (when shown): same
        calendar month using every dated line, including imported &quot;history only&quot; payments
        and expenses — those appear here for traceability but do not move cash/bank balances.
        Sales and receivables use invoice dates, so May can show ₹0 sales while May-dated import
        rows still appear here.
      </p>
    </div>
  );
}

function BalanceCard({
  to,
  label,
  sublabel,
  note,
  amount,
  currency,
  tone,
  icon,
  amountToneFromSign,
  footer,
}: {
  to: string;
  label: string;
  sublabel: string;
  /** Optional explainer under the amount (e.g. invoice vs payment dates). */
  note?: string;
  amount: number;
  currency: string;
  tone: "primary" | "success" | "destructive";
  icon: React.ReactNode;
  /** When set, balance text is green when non-negative, red when negative. */
  amountToneFromSign?: boolean;
  footer?: ReactNode;
}) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    destructive: "bg-destructive/10 text-destructive",
  }[tone];
  return (
    <Link
      to={to}
      className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-xs text-muted-foreground">{sublabel}</p>
        </div>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", toneCls)}>
          {icon}
        </span>
      </div>
      <p
        className={cn(
          "mt-3 text-3xl font-bold tabular-nums",
          amountToneFromSign && (amount >= 0 ? "text-success" : "text-destructive"),
        )}
      >
        {formatCurrency(amount, currency)}
      </p>
      {footer ? <div className="mt-2">{footer}</div> : null}
      {note ? <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{note}</p> : null}
    </Link>
  );
}

function TrendCard({
  title,
  color,
  data,
  dataKey,
  currency,
}: {
  title: string;
  color: string;
  data: Array<{ label: string; sales: number; expense: number }>;
  dataKey: "sales" | "expense";
  currency: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatCompact(v)}
            />
            <RTooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v: number) => formatCurrency(v, currency)}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3, fill: color }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function formatCompact(v: number): string {
  if (Math.abs(v) >= 1e7) return `${(v / 1e7).toFixed(1)}Cr`;
  if (Math.abs(v) >= 1e5) return `${(v / 1e5).toFixed(1)}L`;
  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}k`;
  return String(v);
}

function buildTrend(
  range: Range,
  invoices: Array<{ date: string; total: number }>,
  expenses: Array<{ date: string; amount: number }>,
) {
  const now = new Date();
  if (range === "30d") {
    const buckets: Array<{ label: string; key: string; sales: number; expense: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = subDays(now, i);
      buckets.push({
        label: format(d, "dd MMM"),
        key: format(d, "yyyy-MM-dd"),
        sales: 0,
        expense: 0,
      });
    }
    const map = new Map(buckets.map((b) => [b.key, b]));
    const start = startOfDay(subDays(now, 29));
    const end = endOfDay(now);
    for (const inv of invoices) {
      const d = parseDashDate(inv.date);
      if (!d || d < start || d > end) continue;
      const k = format(d, "yyyy-MM-dd");
      const b = map.get(k);
      if (b) b.sales += inv.total;
    }
    for (const e of expenses) {
      const d = parseDashDate(e.date);
      if (!d || d < start || d > end) continue;
      const k = format(d, "yyyy-MM-dd");
      const b = map.get(k);
      if (b) b.expense += e.amount;
    }
    return buckets;
  }

  const months = range === "6m" ? 6 : 12;
  const buckets: Array<{ label: string; key: string; sales: number; expense: number }> = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = startOfMonth(subMonths(now, i));
    buckets.push({
      label: format(d, "MMM yy"),
      key: format(d, "yyyy-MM"),
      sales: 0,
      expense: 0,
    });
  }
  const map = new Map(buckets.map((b) => [b.key, b]));
  const start = startOfMonth(subMonths(now, months - 1));
  for (const inv of invoices) {
    const d = parseDashDate(inv.date);
    if (!d || d < start) continue;
    const k = format(d, "yyyy-MM");
    const b = map.get(k);
    if (b) b.sales += inv.total;
  }
  for (const e of expenses) {
    const d = parseDashDate(e.date);
    if (!d || d < start) continue;
    const k = format(d, "yyyy-MM");
    const b = map.get(k);
    if (b) b.expense += e.amount;
  }
  return buckets;
}
