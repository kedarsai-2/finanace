import { Outlet, createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { TrendingUp, ShoppingCart, Receipt, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports - QOBOX" },
      { name: "description", content: "Sales, purchase, expense, party and account reports." },
    ],
  }),
  component: ReportsRouteLayout,
});

function ReportsRouteLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/reports") return <Outlet />;
  return <ReportsHub />;
}

const REPORTS = [
  {
    to: "/reports/sales",
    label: "Sales Report",
    desc: "Invoices with status, paid and balance",
    icon: TrendingUp,
    tone: "primary",
  },
  {
    to: "/reports/purchases",
    label: "Purchase Report",
    desc: "Purchase bills by supplier and status",
    icon: ShoppingCart,
    tone: "warning",
  },
  {
    to: "/reports/expenses",
    label: "Expense Report",
    desc: "Spending by category and account",
    icon: Receipt,
    tone: "destructive",
  },
  {
    to: "/reports/parties",
    label: "Party Report",
    desc: "Receivables, payables and aging",
    icon: Users,
    tone: "success",
  },
  {
    to: "/reports/accounts",
    label: "Account Report",
    desc: "Account-wise debit / credit / balance",
    icon: Wallet,
    tone: "primary",
  },
] as const;

const TONE: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning-foreground/80",
  destructive: "bg-destructive/10 text-destructive",
};

function ReportsHub() {
  return (
    <div className="max-w-screen-2xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Insights
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Filter, drill in, and export any report to CSV or print.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
        {REPORTS.map((r) => {
          const Icon = r.icon;
          return (
            <Link
              key={r.to}
              to={r.to}
              className="group rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:p-5"
            >
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl",
                  TONE[r.tone],
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{r.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
