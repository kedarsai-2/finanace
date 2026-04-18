import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format, subDays, subMonths, startOfMonth, startOfDay, endOfDay } from "date-fns";
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
import { cn } from "@/lib/utils";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useInvoices } from "@/hooks/useInvoices";
import { usePurchases } from "@/hooks/usePurchases";
import { usePayments } from "@/hooks/usePayments";
import { useExpenses } from "@/hooks/useExpenses";
import { useAccounts } from "@/hooks/useAccounts";
import { useTransfers } from "@/hooks/useTransfers";
import { useParties, formatCurrency } from "@/hooks/useParties";
import { buildAccountTxns } from "@/lib/accountLedger";
import { buildDashboardSnapshot } from "@/lib/aiContext";
import { AIInsightsCard } from "@/components/ai/AIInsightsCard";
import { CashflowProjectionCard } from "@/components/ai/CashflowProjectionCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — QOBOX" },
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

function DashboardPage() {
  const { businesses, activeId, hydrated } = useBusinesses();
  const business = businesses.find((b) => b.id === activeId);
  const currency = business?.currency ?? "INR";

  const { invoices } = useInvoices(activeId);
  const { purchases } = usePurchases(activeId);
  const { payments } = usePayments(activeId);
  const { expenses } = useExpenses(activeId);
  const { accounts } = useAccounts(activeId, businesses.map((b) => b.id));
  const { transfers } = useTransfers(activeId);
  const { allParties } = useParties(activeId);

  const [range, setRange] = useState<Range>("6m");

  const liveInvoices = useMemo(
    () => invoices.filter((i) => i.status !== "cancelled"),
    [invoices],
  );
  const livePurchases = useMemo(
    () => purchases.filter((p) => p.status !== "cancelled"),
    [purchases],
  );

  const totalSales = liveInvoices.reduce((s, i) => s + i.total, 0);
  const totalReceived = liveInvoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalReceivable = liveInvoices.reduce((s, i) => s + (i.total - i.paidAmount), 0);
  const totalPurchases = livePurchases.reduce((s, p) => s + p.total, 0);
  const totalPaidSuppliers = livePurchases.reduce((s, p) => s + p.paidAmount, 0);
  const totalPayable = livePurchases.reduce((s, p) => s + (p.total - p.paidAmount), 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalSales - totalPurchases - totalExpenses;

  const accountsById = useMemo(
    () => Object.fromEntries(accounts.map((a) => [a.id, a])),
    [accounts],
  );
  const totalAccountsBalance = useMemo(
    () =>
      accounts.reduce((sum, a) => {
        const txns = buildAccountTxns({
          account: a,
          payments,
          transfers,
          expenses,
          accountsById,
        });
        return sum + txns.reduce((s, t) => s + t.amount, 0);
      }, 0),
    [accounts, payments, transfers, expenses, accountsById],
  );

  const trendData = useMemo(() => buildTrend(range, liveInvoices, expenses), [range, liveInvoices, expenses]);

  const aiSnapshot = useMemo(
    () =>
      buildDashboardSnapshot({
        currency,
        invoices,
        purchases,
        payments,
        expenses,
        parties: allParties,
      }),
    [currency, invoices, purchases, payments, expenses, allParties],
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
    };
    const items: Item[] = [];
    for (const i of liveInvoices) {
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
    for (const p of payments) {
      items.push({
        id: `pay_${p.id}`,
        kind: "payment",
        date: p.date,
        title: p.direction === "in" ? "Payment received" : "Payment paid",
        subtitle: p.allocations.map((a) => a.docNumber).join(", ") || p.reference || "—",
        amount: p.amount,
        sign: p.direction === "in" ? "in" : "out",
        href: `/payments`,
      });
    }
    for (const e of expenses) {
      items.push({
        id: `exp_${e.id}`,
        kind: "expense",
        date: e.date,
        title: e.category,
        subtitle: e.notes || e.reference || "Expense",
        amount: e.amount,
        sign: "out",
        href: `/expenses/${e.id}`,
      });
    }
    return items.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8);
  }, [liveInvoices, payments, expenses]);

  if (!hydrated) {
    return <div className="max-w-screen-2xl px-6 py-10">Loading…</div>;
  }

  if (businesses.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
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
    liveInvoices.length === 0 && payments.length === 0 && expenses.length === 0;

  return (
    <div className="max-w-screen-2xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {business?.name ?? "Workspace"}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/invoices/new"><Plus className="h-4 w-4" />Invoice</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/payments/new"><Plus className="h-4 w-4" />Payment</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/expenses/new"><Plus className="h-4 w-4" />Expense</Link>
          </Button>
        </div>
      </header>

      {isEmpty && (
        <div className="mb-6 rounded-xl border border-dashed border-border bg-card/40 p-5 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Your dashboard is empty.</p>
          <p className="mt-1">
            Start by creating an <Link to="/invoices/new" className="text-primary hover:underline">invoice</Link>,
            recording a <Link to="/payments/new" className="text-primary hover:underline">payment</Link>,
            or logging an <Link to="/expenses/new" className="text-primary hover:underline">expense</Link>.
          </p>
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
          icon={netProfit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          tone={netProfit >= 0 ? "success" : "destructive"}
          signed={netProfit < 0 ? "-" : ""}
        />
      </section>

      {/* Section 2: Receivables / Payables / Cash */}
      <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
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
          to="/reports/accounts"
          label="Cash & Bank"
          sublabel={`${accounts.length} accounts`}
          amount={totalAccountsBalance}
          currency={currency}
          tone="primary"
          icon={<Wallet className="h-4 w-4" />}
        />
      </section>

      {/* AI Section */}
      {!isEmpty && (
        <section className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <AIInsightsCard snapshot={aiSnapshot} />
          <CashflowProjectionCard snapshot={aiSnapshot} currency={currency} />
        </section>
      )}

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
            {recent.map((r) => (
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
                      r.sign === "in" ? "text-success" : "text-destructive",
                    )}
                  >
                    {r.sign === "in" ? "+" : "-"}
                    {formatCurrency(r.amount, currency)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(r.date), "dd MMM yyyy")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  to,
  label,
  value,
  icon,
  tone,
  signed = "",
}: {
  to: string;
  label: string;
  value: string;
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
    </Link>
  );
}

function BalanceCard({
  to,
  label,
  sublabel,
  amount,
  currency,
  tone,
  icon,
}: {
  to: string;
  label: string;
  sublabel: string;
  amount: number;
  currency: string;
  tone: "primary" | "success" | "destructive";
  icon: React.ReactNode;
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
      <p className="mt-3 text-3xl font-bold tabular-nums">
        {formatCurrency(amount, currency)}
      </p>
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
      const d = new Date(inv.date);
      if (d < start || d > end) continue;
      const k = format(d, "yyyy-MM-dd");
      const b = map.get(k);
      if (b) b.sales += inv.total;
    }
    for (const e of expenses) {
      const d = new Date(e.date);
      if (d < start || d > end) continue;
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
    const d = new Date(inv.date);
    if (d < start) continue;
    const k = format(d, "yyyy-MM");
    const b = map.get(k);
    if (b) b.sales += inv.total;
  }
  for (const e of expenses) {
    const d = new Date(e.date);
    if (d < start) continue;
    const k = format(d, "yyyy-MM");
    const b = map.get(k);
    if (b) b.expense += e.amount;
  }
  return buckets;
}
