import { Outlet, createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMemo } from "react";
import { useListPagination } from "@/hooks/useListPagination";
import { ListPaginationBar } from "@/components/ui/ListPaginationBar";
import { format } from "date-fns";
import { Banknote, Pencil, ArrowRight, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { useBusinesses } from "@/hooks/useBusinesses";
import { useAccounts } from "@/hooks/useAccounts";
import { usePayments } from "@/hooks/usePayments";
import { useTransfers } from "@/hooks/useTransfers";
import { useExpenses } from "@/hooks/useExpenses";
import { formatAccountCurrency } from "@/hooks/useParties";
import { buildAccountTxns, accountBalance } from "@/lib/accountLedger";
import {
  accountTxnDisplayFlow,
  type Account,
  type AccountTxn,
  type AccountTxnKind,
} from "@/types/account";

export const Route = createFileRoute("/cash")({
  head: () => ({
    meta: [
      { title: "Cash - QOBOX" },
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

function txnTypeLabel(r: {
  kind: AccountTxnKind;
  refLink?: string;
  refNo?: string;
  note?: string;
}) {
  if (r.kind === "payment-in" && r.refLink?.startsWith("/invoices/")) return "Sales";
  if (r.kind === "payment-out" && r.refLink?.startsWith("/purchases/")) return "Purchase";
  if ((r.kind === "transfer-in" || r.kind === "transfer-out") && r.refNo === "Adjustment") {
    return r.note?.toLowerCase().includes("cash")
      ? "Cash edit transaction"
      : "Bank edit transaction";
  }
  return KIND_LABEL[r.kind];
}

type CashAccountGroup = {
  primary: Account;
  members: Account[];
};

function accountSortKey(account: Account): number {
  const n = Number(account.id);
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
}

function groupCashAccounts(accounts: Account[]): CashAccountGroup[] {
  const groups = new Map<string, Account[]>();
  for (const account of accounts) {
    const normalizedName = account.name.trim().replace(/\s+/g, " ").toLowerCase();
    const key =
      normalizedName === "cash" ? `${account.businessId || "_"}|auto-cash` : `custom|${account.id}`;
    groups.set(key, [...(groups.get(key) ?? []), account]);
  }

  return [...groups.values()].map((members) => {
    const sorted = [...members].sort(
      (a, b) => accountSortKey(a) - accountSortKey(b) || a.id.localeCompare(b.id),
    );
    return { primary: sorted[0]!, members: sorted };
  });
}

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
  const { accounts, hydrated } = useAccounts(null, businessIds);
  const { payments, hydrated: paymentsReady } = usePayments();
  const { transfers, hydrated: transfersReady } = useTransfers();
  const { expenses, hydrated: expensesReady } = useExpenses();

  const ledgerReady = paymentsReady && transfersReady && expensesReady;

  const businessById = useMemo(
    () => Object.fromEntries(businesses.map((b) => [b.id, b])),
    [businesses],
  );
  const showBusinessLabel = businesses.length > 1;

  const defaultCurrency =
    (businesses.find((b) => b.id === activeId) ?? businesses[0])?.currency ?? "INR";
  const currency = defaultCurrency;

  const cashAccountGroups = useMemo(
    () => groupCashAccounts(accounts.filter((a) => a.type === "cash")),
    [accounts],
  );
  const cashAccounts = useMemo(() => cashAccountGroups.map((g) => g.primary), [cashAccountGroups]);

  const accountsById = useMemo(
    () => Object.fromEntries(accounts.map((a) => [a.id, a])),
    [accounts],
  );

  const { totalBalance, allCashTxns } = useMemo(() => {
    let total = 0;
    const all: (AccountTxn & { accountName: string; accountId: string })[] = [];
    for (const group of cashAccountGroups) {
      for (const a of group.members) {
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
          all.push({ ...t, accountName: group.primary.name, accountId: a.id });
        }
      }
    }
    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return { totalBalance: total, allCashTxns: all };
  }, [cashAccountGroups, payments, transfers, expenses, accountsById]);

  const cashTxnKey = useMemo(
    () =>
      `${cashAccountGroups
        .flatMap((g) => g.members.map((a) => a.id))
        .sort()
        .join(",")}|${payments.length}|${transfers.length}|${expenses.length}`,
    [cashAccountGroups, payments.length, transfers.length, expenses.length],
  );
  const cashTxnPg = useListPagination(allCashTxns, cashTxnKey);

  if (!bHyd || !hydrated || !ledgerReady) {
    return <div className="max-w-screen-2xl px-4 py-10 sm:px-6">Loading cash…</div>;
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2">
              <Pencil className="h-4 w-4" /> Cash actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/cash/new">
                <Plus className="mr-2 h-4 w-4" />
                Add cash account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (!effectiveBusinessId) {
                  toast.error("No business available for cash balance");
                  return;
                }
                if (isAll) setActiveId(effectiveBusinessId);
                navigate({
                  to: "/accounts/transfer",
                  search: {
                    mode: "adjustment",
                    scope: "cash",
                    preset: "any",
                    accountId: cashAccounts[0]?.id ?? "",
                  },
                });
              }}
            >
              Edit cash balance
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/accounts/transfer" search={{ mode: "adjustment", scope: "cash" }}>
                Cash adjustment
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
            <div className="rounded-xl border border-border bg-linear-to-br from-emerald-500/10 to-emerald-500/0 p-6">
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
                    {formatAccountCurrency(totalBalance, currency)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Across {cashAccounts.length} cash account
                {cashAccounts.length === 1 ? "" : "s"}
              </p>
            </div>

            {cashAccountGroups.map((group) => {
              const a = group.primary;
              const bal = group.members.reduce((sum, member) => {
                const txns = buildAccountTxns({
                  account: member,
                  payments,
                  transfers,
                  expenses,
                  accountsById,
                });
                return sum + accountBalance(txns);
              }, 0);
              const acctCurrency = businessById[a.businessId]?.currency ?? currency;
              const acctBusinessName = showBusinessLabel
                ? (businessById[a.businessId]?.name ?? "")
                : "";
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    const bizId = a.businessId || effectiveBusinessId;
                    if (!bizId) {
                      toast.error("No business available for cash balance");
                      return;
                    }
                    if (isAll && bizId !== "__all__") setActiveId(bizId);
                    navigate({
                      to: "/accounts/$id",
                      params: { id: a.id },
                      search: { source: "cash" },
                    });
                  }}
                  className="group w-full rounded-xl border border-border bg-card p-6 text-left transition-shadow hover:shadow-md"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{a.name}</p>
                      {acctBusinessName && (
                        <p className="text-xs text-muted-foreground">{acctBusinessName}</p>
                      )}
                    </div>
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
                    {formatAccountCurrency(bal, acctCurrency)}
                  </p>
                </button>
              );
            })}
          </section>

          {/* Recent transactions */}
          <section className="overflow-x-auto rounded-xl border border-border">
            <header className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold">Cash transactions</h2>
                <p className="text-xs text-muted-foreground">
                  All entries across cash accounts, newest first
                </p>
              </div>
            </header>
            {allCashTxns.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                No cash transactions yet.
              </div>
            ) : (
              <>
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
                    {cashTxnPg.pageItems.map((r) => {
                      const flow = accountTxnDisplayFlow(r);
                      return (
                        <tr
                          key={`${r.accountId}-${r.id}`}
                          className={cn("hover:bg-muted/30", r.ledgerMemo && "bg-muted/15")}
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                            {format(new Date(r.date), "dd MMM yyyy")}
                          </td>
                          <td className="px-4 py-3">{txnTypeLabel(r)}</td>
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
                            {flow < 0 ? formatAccountCurrency(flow, currency) : ""}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                            {flow > 0 ? formatAccountCurrency(flow, currency) : ""}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <ListPaginationBar
                  page={cashTxnPg.page}
                  totalPages={cashTxnPg.totalPages}
                  totalCount={cashTxnPg.totalCount}
                  rangeFrom={cashTxnPg.rangeFrom}
                  rangeTo={cashTxnPg.rangeTo}
                  onPageChange={cashTxnPg.setPage}
                />
              </>
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
      <div className="flex items-center justify-center gap-2">
        <Button asChild className="gap-2">
          <Link to="/cash/new">
            <Plus className="h-4 w-4" /> Add cash account
          </Link>
        </Button>
        <Button variant="outline" className="gap-2" onClick={onSetBalance}>
          <Pencil className="h-4 w-4" /> Set cash balance
        </Button>
      </div>
    </div>
  );
}
