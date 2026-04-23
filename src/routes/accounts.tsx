import { Outlet, createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Plus,
  Wallet,
  Building2,
  Banknote,
  Pencil,
  Trash2,
  ArrowLeftRight,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

import { useBusinesses } from "@/hooks/useBusinesses";
import { useAccounts } from "@/hooks/useAccounts";
import { usePayments } from "@/hooks/usePayments";
import { useTransfers } from "@/hooks/useTransfers";
import { useExpenses } from "@/hooks/useExpenses";
import { formatCurrency } from "@/hooks/useParties";
import {
  ACCOUNT_TYPE_LABEL,
  type Account,
  type AccountType,
} from "@/types/account";
import { accountBalance, buildAccountTxns } from "@/lib/accountLedger";

export const Route = createFileRoute("/accounts")({
  head: () => ({
    meta: [
      { title: "Accounts — Cash, Bank & UPI" },
      {
        name: "description",
        content:
          "Manage cash, bank and UPI accounts. Track live balances driven by payments, expenses and transfers.",
      },
    ],
  }),
  component: AccountsRouteLayout,
});

function AccountsRouteLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/accounts") return <Outlet />;
  return <AccountsPage />;
}

const TYPE_ICON: Record<AccountType, typeof Wallet> = {
  cash: Banknote,
  bank: Building2,
};

const TYPE_TONE: Record<AccountType, string> = {
  cash: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  bank: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

function AccountsPage() {
  const { businesses, activeId, hydrated: bHyd } = useBusinesses();
  const businessIds = useMemo(() => businesses.map((b) => b.id), [businesses]);
  const { accounts, hydrated, remove } = useAccounts(activeId, businessIds);
  const { payments } = usePayments(activeId);
  const { transfers } = useTransfers(activeId);
  const { expenses } = useExpenses(activeId);

  const accountsById = useMemo(
    () => Object.fromEntries(accounts.map((a) => [a.id, a])),
    [accounts],
  );

  const cards = useMemo(() => {
    return accounts.map((a) => {
      const txns = buildAccountTxns({
        account: a,
        payments,
        transfers,
        expenses,
        accountsById,
      });
      return { account: a, balance: accountBalance(txns), txns: txns.length - 1 };
    });
  }, [accounts, payments, transfers, expenses, accountsById]);

  const business = businesses.find((b) => b.id === activeId);
  const currency = business?.currency ?? "INR";

  if (!bHyd || !hydrated) {
    return <div className="max-w-screen-2xl px-4 py-10 sm:px-6">Loading…</div>;
  }

  return (
    <div className="max-w-screen-2xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Money in & out
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/accounts/transfer">
              <ArrowLeftRight className="h-4 w-4" /> Transfer
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link to="/accounts/new">
              <Plus className="h-4 w-4" /> Add account
            </Link>
          </Button>
        </div>
      </header>

      {accounts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ account, balance, txns }) => (
            <AccountCard
              key={account.id}
              account={account}
              balance={balance}
              txnCount={txns}
              currency={currency}
              onDelete={() => {
                remove(account.id);
                toast.success(`${account.name} deleted`);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Wallet className="h-6 w-6 text-primary" />
      </div>
      <h2 className="mb-1 text-lg font-semibold">No accounts added</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Add Cash, Bank or UPI accounts to track money flowing in and out.
      </p>
      <Button asChild className="gap-2">
        <Link to="/accounts/new">
          <Plus className="h-4 w-4" /> Add account
        </Link>
      </Button>
    </div>
  );
}

function AccountCard({
  account,
  balance,
  txnCount,
  currency,
  onDelete,
}: {
  account: Account;
  balance: number;
  txnCount: number;
  currency: string;
  onDelete: () => void;
}) {
  const Icon = TYPE_ICON[account.type];
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md">
      <Link
        to="/accounts/$id"
        params={{ id: account.id }}
        className="block p-5"
      >
        <div className="mb-3 flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              TYPE_TONE[account.type],
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold leading-tight">{account.name}</p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {ACCOUNT_TYPE_LABEL[account.type]}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Current balance</p>
        <p
          className={cn(
            "mt-1 text-2xl font-semibold tabular-nums",
            balance < 0 ? "text-destructive" : "text-foreground",
          )}
        >
          {balance < 0 ? "-" : ""}
          {formatCurrency(balance, currency)}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {txnCount} transaction{txnCount === 1 ? "" : "s"}
        </p>
      </Link>
      <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          asChild
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={(e) => e.stopPropagation()}
        >
          <Link to="/accounts/$id/edit" params={{ id: account.id }}>
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {account.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                The account will be hidden. Existing transactions on it remain
                in records but no longer affect any live balance.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
