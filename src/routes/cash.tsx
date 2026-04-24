import { Outlet, createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMemo } from "react";
import { format } from "date-fns";
import { Banknote, Pencil, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useBusinesses } from "@/hooks/useBusinesses";
import { useAccounts } from "@/hooks/useAccounts";
import { usePayments } from "@/hooks/usePayments";
import { useTransfers } from "@/hooks/useTransfers";
import { useExpenses } from "@/hooks/useExpenses";
import { formatCurrency } from "@/hooks/useParties";
import { buildAccountTxns, accountBalance } from "@/lib/accountLedger";
import type { AccountTxn, AccountTxnKind } from "@/types/account";

export const Route = createFileRoute("/cash")({
  head: () => ({
    meta: [
      { title: "Cash — Live balance & recent transactions" },
      {
        name: "description",
        content: "View cash account balance and recent cash transactions in one place.",
      },
    ],
  }),
  component: CashRouteLayout,
});

const KIND_LABEL: Record<AccountTxnKind, string> = {
  opening: "Opening",
  "payment-in": "Payment in",
  "payment-out": "Payment out",
  "transfer-in": "Transfer in",
  "transfer-out": "Transfer out",
  expense: "Expense",
};

function CashRouteLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/cash") return <Outlet />;
  return <CashPage />;
}

function CashPage() {
  const navigate = useNavigate();
  const {
    businesses,
    activeId,
    scopedBusinessId,
    isAll,
    setActiveId,
    hydrated: bHyd,
  } = useBusinesses();
  const businessIds = useMemo(() => businesses.map((b) => b.id), [businesses]);
  const effectiveBusinessId = scopedBusinessId ?? businesses[0]?.id ?? null;
  const { accounts, hydrated } = useAccounts(effectiveBusinessId, businessIds);
  const { payments } = usePayments(effectiveBusinessId);
  const { transfers } = useTransfers(effectiveBusinessId);
  const { expenses } = useExpenses(effectiveBusinessId);

  const business = businesses.find((b) => b.id === activeId);
  const currency = business?.currency ?? "INR";

  const cashAccounts = useMemo(() => accounts.filter((a) => a.type === "cash"), [accounts]);

  const accountsById = useMemo(
    () => Object.fromEntries(accounts.map((a) => [a.id, a])),
    [accounts],
  );

  const { totalBalance, recentTxns } = useMemo(() => {
    let total = 0;
    const all: (AccountTxn & { accountName: string; accountId: string })[] = [];
    for (const a of cashAccounts) {
      const txns = buildAccountTxns({
        account: a,
        payments,
        transfers,
        expenses,
        accountsById,
      });
      total += accountBalance(txns);
      for (const t of txns) {
        if (t.kind === "opening") continue;
        all.push({ ...t, accountName: a.name, accountId: a.id });
      }
    }
    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return { totalBalance: total, recentTxns: all.slice(0, 25) };
  }, [cashAccounts, payments, transfers, expenses, accountsById]);

  if (!bHyd || !hydrated) {
    return <div className="max-w-screen-2xl px-4 py-10 sm:px-6">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Cash on hand
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Cash</h1>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            if (!effectiveBusinessId) {
              toast.error("No business available for cash balance");
              return;
            }
            if (isAll) setActiveId(effectiveBusinessId);
            navigate({ to: "/cash/balance" });
          }}
        >
          <Pencil className="h-4 w-4" /> Edit cash balance
        </Button>
      </header>

      {cashAccounts.length === 0 ? (
        <EmptyCashState
          onSetBalance={() => {
            if (!effectiveBusinessId) {
              toast.error("No business available for cash balance");
              return;
            }
            if (isAll) setActiveId(effectiveBusinessId);
            navigate({ to: "/cash/balance" });
          }}
        />
      ) : (
        <>
          {/* Balance summary */}
          <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-gradient-to-br from-emerald-500/10 to-emerald-500/0 p-6">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Banknote className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Total cash balance
                  </p>
                  <p
                    className={cn(
                      "text-2xl font-semibold tabular-nums",
                      totalBalance < 0 ? "text-destructive" : "text-foreground",
                    )}
                  >
                    {totalBalance < 0 ? "-" : ""}
                    {formatCurrency(totalBalance, currency)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Across {cashAccounts.length} cash account
                {cashAccounts.length === 1 ? "" : "s"}
              </p>
            </div>

            {cashAccounts.map((a) => {
              const txns = buildAccountTxns({
                account: a,
                payments,
                transfers,
                expenses,
                accountsById,
              });
              const bal = accountBalance(txns);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    if (!effectiveBusinessId) {
                      toast.error("No business available for cash balance");
                      return;
                    }
                    if (isAll) setActiveId(effectiveBusinessId);
                    navigate({ to: "/cash/balance" });
                  }}
                  className="group w-full rounded-xl border border-border bg-card p-6 text-left transition-shadow hover:shadow-md"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-semibold">{a.name}</p>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Balance</p>
                  <p
                    className={cn(
                      "mt-1 text-xl font-semibold tabular-nums",
                      bal < 0 ? "text-destructive" : "text-foreground",
                    )}
                  >
                    {bal < 0 ? "-" : ""}
                    {formatCurrency(bal, currency)}
                  </p>
                </button>
              );
            })}
          </section>

          {/* Recent transactions */}
          <section className="overflow-hidden rounded-xl border border-border">
            <header className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold">Recent cash transactions</h2>
                <p className="text-xs text-muted-foreground">
                  Latest 25 entries across all cash accounts
                </p>
              </div>
            </header>
            {recentTxns.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                No cash transactions yet.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Account</th>
                    <th className="px-4 py-3 text-left">Reference</th>
                    <th className="px-4 py-3 text-right">Debit</th>
                    <th className="px-4 py-3 text-right">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentTxns.map((r) => (
                    <tr key={`${r.accountId}-${r.id}`} className="hover:bg-muted/30">
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {format(new Date(r.date), "dd MMM yyyy")}
                      </td>
                      <td className="px-4 py-3">{KIND_LABEL[r.kind]}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.accountName}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {r.refLink ? (
                          <a href={r.refLink} className="text-primary hover:underline">
                            {r.refNo}
                          </a>
                        ) : (
                          r.refNo
                        )}
                        {r.note && (
                          <span className="ml-2 text-xs text-muted-foreground">{r.note}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-destructive/80">
                        {r.amount < 0 ? formatCurrency(r.amount, currency) : ""}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                        {r.amount > 0 ? formatCurrency(r.amount, currency) : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function EmptyCashState({ onSetBalance }: { onSetBalance: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
        <Banknote className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h2 className="mb-1 text-lg font-semibold">No cash account yet</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Add a cash account to start tracking cash inflows and outflows.
      </p>
      <Button className="gap-2" onClick={onSetBalance}>
        <Pencil className="h-4 w-4" /> Set cash balance
      </Button>
    </div>
  );
}
