import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Pencil,
  Wallet,
  Building2,
  Smartphone,
  Banknote,
} from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { formatCurrency } from "@/hooks/useParties";
import { ACCOUNT_TYPE_LABEL, type AccountType, type AccountTxnKind } from "@/types/account";
import { buildAccountTxns } from "@/lib/accountLedger";

const KIND_FILTERS = ["all", "payment", "transfer", "expense"] as const;
type KindFilter = (typeof KIND_FILTERS)[number];

const searchSchema = z.object({
  from: z.string().catch(""),
  to: z.string().catch(""),
  kind: z.enum(KIND_FILTERS).catch("all"),
});

export const Route = createFileRoute("/accounts/$id/")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({ meta: [{ title: "Account details — QOBOX" }] }),
  component: AccountDetailsPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-lg font-semibold">Account not found</h1>
      <Button asChild className="mt-4">
        <Link to="/accounts">Back to accounts</Link>
      </Button>
    </div>
  ),
  errorComponent: AccountDetailsErrorComponent,
});

function AccountDetailsErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="text-sm text-destructive">{error.message}</p>
      <Button
        className="mt-4"
        onClick={() => {
          router.invalidate();
          reset();
        }}
      >
        Retry
      </Button>
    </div>
  );
}

const TYPE_ICON: Record<AccountType, typeof Wallet> = {
  cash: Banknote,
  bank: Building2,
  upi: Smartphone,
};
const TYPE_TONE: Record<AccountType, string> = {
  cash: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  bank: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  upi: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

function kindMatches(kind: AccountTxnKind, filter: KindFilter): boolean {
  if (filter === "all") return true;
  if (filter === "payment") return kind === "payment-in" || kind === "payment-out";
  if (filter === "transfer") return kind === "transfer-in" || kind === "transfer-out";
  if (filter === "expense") return kind === "expense";
  return true;
}

const KIND_LABEL: Record<AccountTxnKind, string> = {
  opening: "Opening",
  "payment-in": "Payment in",
  "payment-out": "Payment out",
  "transfer-in": "Transfer in",
  "transfer-out": "Transfer out",
  expense: "Expense",
};

function AccountDetailsPage() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { activeId, businesses } = useBusinesses();
  const { accounts, hydrated } = useAccounts(activeId, []);
  const { payments } = usePayments(activeId);
  const { transfers } = useTransfers(activeId);
  const { expenses } = useExpenses(activeId);

  const account = accounts.find((a) => a.id === id);
  const business = businesses.find((b) => b.id === activeId);
  const currency = business?.currency ?? "INR";

  const accountsById = useMemo(
    () => Object.fromEntries(accounts.map((a) => [a.id, a])),
    [accounts],
  );

  const allTxns = useMemo(() => {
    if (!account) return [];
    return buildAccountTxns({
      account,
      payments,
      transfers,
      expenses,
      accountsById,
    });
  }, [account, payments, transfers, expenses, accountsById]);

  const filteredRows = useMemo(() => {
    let running = 0;
    const rows = allTxns.map((t) => {
      running += t.amount;
      return { ...t, balance: running };
    });
    return rows.filter((r) => {
      if (!kindMatches(r.kind, search.kind)) return false;
      if (search.from && new Date(r.date) < new Date(search.from)) return false;
      if (search.to && new Date(r.date) > new Date(`${search.to}T23:59:59`)) return false;
      return true;
    });
  }, [allTxns, search.from, search.to, search.kind]);

  if (!hydrated) {
    return <div className="max-w-screen-2xl px-4 py-10 sm:px-6">Loading…</div>;
  }
  if (!account) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-lg font-semibold">Account not found</h1>
        <Button asChild className="mt-4">
          <Link to="/accounts">Back to accounts</Link>
        </Button>
      </div>
    );
  }

  const balance = allTxns.reduce((s, t) => s + t.amount, 0);
  const Icon = TYPE_ICON[account.type];

  const exportCsv = () => {
    const header = ["Date", "Type", "Reference", "Note", "Debit", "Credit", "Balance"];
    const lines = filteredRows.map((r) => [
      format(new Date(r.date), "yyyy-MM-dd"),
      KIND_LABEL[r.kind],
      r.refNo ?? "",
      (r.note ?? "").replace(/[",\n]/g, " "),
      r.amount < 0 ? Math.abs(r.amount).toFixed(2) : "",
      r.amount > 0 ? r.amount.toFixed(2) : "",
      r.balance.toFixed(2),
    ]);
    const csv = [header, ...lines].map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${account.name}-statement.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-screen-2xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-3 gap-2">
        <Link to="/accounts">
          <ArrowLeft className="h-4 w-4" /> Back to accounts
        </Link>
      </Button>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              TYPE_TONE[account.type],
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{account.name}</h1>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {ACCOUNT_TYPE_LABEL[account.type]}
              {account.accountNumber ? ` • ${account.accountNumber}` : ""}
              {account.ifsc ? ` • ${account.ifsc}` : ""}
              {account.upiId ? ` • ${account.upiId}` : ""}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Current balance</p>
          <p
            className={cn(
              "text-3xl font-semibold tabular-nums",
              balance < 0 ? "text-destructive" : "text-foreground",
            )}
          >
            {balance < 0 ? "-" : ""}
            {formatCurrency(balance, currency)}
          </p>
          <div className="mt-2 flex justify-end gap-1">
            <Button asChild size="sm" variant="outline" className="gap-1">
              <Link to="/accounts/$id/edit" params={{ id: account.id }}>
                <Pencil className="h-3 w-3" /> Edit
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1">
                  <Download className="h-3 w-3" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportCsv}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> CSV / Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.print()}>
                  <Download className="mr-2 h-4 w-4" /> Print / PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div>
          <Label htmlFor="from">From</Label>
          <Input
            id="from"
            type="date"
            value={search.from}
            onChange={(e) =>
              navigate({
                search: (s: z.infer<typeof searchSchema>) => ({ ...s, from: e.target.value }),
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="to">To</Label>
          <Input
            id="to"
            type="date"
            value={search.to}
            onChange={(e) =>
              navigate({
                search: (s: z.infer<typeof searchSchema>) => ({ ...s, to: e.target.value }),
              })
            }
          />
        </div>
        <div>
          <Label>Type</Label>
          <Select
            value={search.kind}
            onValueChange={(v) =>
              navigate({
                search: (s: z.infer<typeof searchSchema>) => ({ ...s, kind: v as KindFilter }),
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KIND_FILTERS.map((k) => (
                <SelectItem key={k} value={k}>
                  {k === "all" ? "All transactions" : k.charAt(0).toUpperCase() + k.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              navigate({
                search: (_: z.infer<typeof searchSchema>) => ({ from: "", to: "", kind: "all" }),
              })
            }
          >
            Reset
          </Button>
        </div>
      </section>

      <div className="overflow-hidden rounded-xl border border-border">
        {filteredRows.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">
            No transactions found
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Reference</th>
                <th className="px-4 py-3 text-right">Debit</th>
                <th className="px-4 py-3 text-right">Credit</th>
                <th className="px-4 py-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {format(new Date(r.date), "dd MMM yyyy")}
                  </td>
                  <td className="px-4 py-3">{KIND_LABEL[r.kind]}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {r.refLink ? (
                      <a href={r.refLink} className="text-primary hover:underline">
                        {r.refNo}
                      </a>
                    ) : (
                      r.refNo
                    )}
                    {r.note && <span className="ml-2 text-xs text-muted-foreground">{r.note}</span>}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-destructive/80">
                    {r.amount < 0 ? formatCurrency(r.amount, currency) : ""}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                    {r.amount > 0 ? formatCurrency(r.amount, currency) : ""}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-medium tabular-nums",
                      r.balance < 0 ? "text-destructive" : "text-foreground",
                    )}
                  >
                    {r.balance < 0 ? "-" : ""}
                    {formatCurrency(r.balance, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
