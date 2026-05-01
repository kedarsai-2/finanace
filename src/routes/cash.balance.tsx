import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

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

import { useBusinesses } from "@/hooks/useBusinesses";
import { useAccounts } from "@/hooks/useAccounts";
import { usePayments } from "@/hooks/usePayments";
import { useTransfers } from "@/hooks/useTransfers";
import { useExpenses } from "@/hooks/useExpenses";
import { formatCurrency } from "@/hooks/useParties";
import { apiFetch } from "@/lib/api";
import { USE_BACKEND } from "@/lib/flags";
import { buildAccountTxns } from "@/lib/accountLedger";
import type { AccountTxnKind } from "@/types/account";

export const Route = createFileRoute("/cash/balance")({
  head: () => ({
    meta: [{ title: "Cash Balance - QOBOX" }],
  }),
  component: CashBalancePage,
});

type CashBalanceSnapshot = {
  businessId: number;
  cashAccountId: number;
  openingBalance: number;
  currentBalance: number;
};

const TXN_KIND_FILTERS = ["all", "payment", "transfer", "expense"] as const;
type TxnKindFilter = (typeof TXN_KIND_FILTERS)[number];

const KIND_LABEL: Record<AccountTxnKind, string> = {
  opening: "Opening",
  "payment-in": "Payment in",
  "payment-out": "Payment out",
  "transfer-in": "Transfer in",
  "transfer-out": "Transfer out",
  expense: "Expense",
};

function txnTypeLabel(r: { kind: AccountTxnKind; refLink?: string }) {
  if (r.kind === "payment-in" && r.refLink?.startsWith("/invoices/")) return "Sales";
  return KIND_LABEL[r.kind];
}

function kindMatches(kind: AccountTxnKind, filter: TxnKindFilter): boolean {
  if (filter === "all") return true;
  if (filter === "payment") return kind === "payment-in" || kind === "payment-out";
  if (filter === "transfer") return kind === "transfer-in" || kind === "transfer-out";
  if (filter === "expense") return kind === "expense";
  return true;
}

function CashBalancePage() {
  const navigate = useNavigate();
  const { businesses, scopedBusinessId, isAll, setActiveId } = useBusinesses();
  const effectiveBusinessId = scopedBusinessId ?? businesses[0]?.id ?? null;
  const businessIds = useMemo(() => businesses.map((b) => b.id), [businesses]);
  const { accounts, hydrated: accountsHydrated } = useAccounts(effectiveBusinessId, businessIds);
  const { payments } = usePayments(effectiveBusinessId);
  const { transfers } = useTransfers(effectiveBusinessId);
  const { expenses } = useExpenses(effectiveBusinessId);

  const [opening, setOpening] = useState<number>(0);
  const [current, setCurrent] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [kind, setKind] = useState<TxnKindFilter>("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!USE_BACKEND) {
        setHydrated(true);
        setCurrent(null);
        return;
      }
      if (!effectiveBusinessId) {
        setHydrated(true);
        setCurrent(null);
        return;
      }
      if (isAll) setActiveId(effectiveBusinessId);
      const businessNumericId = Number(effectiveBusinessId);
      if (!Number.isFinite(businessNumericId)) {
        setHydrated(true);
        setCurrent(null);
        return;
      }
      try {
        const snap = await apiFetch<CashBalanceSnapshot>(
          `/api/cash-balance?businessId=${encodeURIComponent(String(businessNumericId))}`,
        );
        if (cancelled) return;
        setOpening(Number(snap.openingBalance) || 0);
        setCurrent(Number(snap.currentBalance) || 0);
      } catch {
        if (cancelled) return;
        setCurrent(null);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    };
    setHydrated(false);
    run();
    return () => {
      cancelled = true;
    };
  }, [effectiveBusinessId, isAll, setActiveId]);

  const currency = businesses.find((b) => b.id === effectiveBusinessId)?.currency ?? "INR";
  const cashAccounts = useMemo(() => accounts.filter((a) => a.type === "cash"), [accounts]);
  const accountsById = useMemo(
    () => Object.fromEntries(accounts.map((a) => [a.id, a])),
    [accounts],
  );
  const previousTransactions = useMemo(() => {
    const all: Array<{
      id: string;
      date: string;
      kind: AccountTxnKind;
      amount: number;
      refNo?: string;
      refLink?: string;
      note?: string;
      accountId: string;
      accountName: string;
    }> = [];
    for (const a of cashAccounts) {
      const txns = buildAccountTxns({
        account: a,
        payments,
        transfers,
        expenses,
        accountsById,
      });
      for (const t of txns) {
        if (t.kind === "opening") continue;
        all.push({ ...t, accountId: a.id, accountName: a.name });
      }
    }
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [cashAccounts, payments, transfers, expenses, accountsById]);

  const filteredTransactions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return previousTransactions.filter((t) => {
      if (from && new Date(t.date) < new Date(from)) return false;
      if (to && new Date(t.date) > new Date(`${to}T23:59:59`)) return false;
      if (!kindMatches(t.kind, kind)) return false;
      if (accountFilter !== "all" && t.accountId !== accountFilter) return false;
      if (!q) return true;
      const hay =
        `${t.accountName} ${txnTypeLabel(t)} ${t.refNo ?? ""} ${t.note ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [previousTransactions, from, to, kind, accountFilter, query]);

  const onSave = async () => {
    if (!effectiveBusinessId) return toast.error("Select a specific business first");
    if (!USE_BACKEND) return toast.success("Cash balance saved");
    if (isAll) setActiveId(effectiveBusinessId);
    const businessNumericId = Number(effectiveBusinessId);
    if (!Number.isFinite(businessNumericId)) {
      return toast.error("Invalid business id for cash balance");
    }
    setSaving(true);
    try {
      const snap = await apiFetch<CashBalanceSnapshot>("/api/cash-balance", {
        method: "PUT",
        body: JSON.stringify({
          businessId: businessNumericId,
          openingBalance: Number(opening) || 0,
        }),
      });
      setCurrent(Number(snap.currentBalance) || 0);
      toast.success("Cash balance updated");
      navigate({ to: "/cash" });
    } catch {
      toast.error("Failed to update cash balance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-3 gap-2">
        <Link to="/cash">
          <ArrowLeft className="h-4 w-4" /> Back to cash
        </Link>
      </Button>

      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Cash on hand
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Cash balance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set your starting cash amount. Future cash payments and cash expenses will adjust this
          balance automatically.
        </p>
      </header>

      {!hydrated || !accountsHydrated ? (
        <div className="rounded-xl border border-border bg-card p-6">Loading…</div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4 rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">Current cash balance</div>
              <div className="text-right tabular-nums">
                {current === null ? "—" : current.toFixed(2)}
              </div>
            </div>
            <div>
              <Label htmlFor="cash-opening">Starting cash balance</Label>
              <Input
                id="cash-opening"
                type="number"
                step="0.01"
                value={opening}
                onChange={(e) => setOpening(Number(e.target.value))}
                className="text-right tabular-nums"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={onSave} disabled={saving} className="gap-2">
                <Save className="h-4 w-4" /> Save
              </Button>
            </div>
          </div>

          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <header className="border-b border-border bg-muted/30 px-4 py-3">
              <h2 className="text-sm font-semibold">Previous cash transactions</h2>
              <p className="text-xs text-muted-foreground">
                Filter and review historical entries across cash accounts.
              </p>
            </header>

            <div className="grid grid-cols-1 gap-3 border-b border-border px-4 py-3 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <Label htmlFor="cash-txn-from">From</Label>
                <Input
                  id="cash-txn-from"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="cash-txn-to">To</Label>
                <Input
                  id="cash-txn-to"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={kind} onValueChange={(v) => setKind(v as TxnKindFilter)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TXN_KIND_FILTERS.map((k) => (
                      <SelectItem key={k} value={k}>
                        {k === "all" ? "All transactions" : k.charAt(0).toUpperCase() + k.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Account</Label>
                <Select value={accountFilter} onValueChange={setAccountFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All cash accounts</SelectItem>
                    {cashAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cash-txn-search">Search</Label>
                <Input
                  id="cash-txn-search"
                  placeholder="Ref, note, account…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                No transactions found for the selected filters.
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
                  {filteredTransactions.map((t) => (
                    <tr key={`${t.accountId}-${t.id}`} className="hover:bg-muted/30">
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {format(new Date(t.date), "dd MMM yyyy")}
                      </td>
                      <td className="px-4 py-3">{txnTypeLabel(t)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{t.accountName}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {t.refLink ? (
                          <a href={t.refLink} className="text-primary hover:underline">
                            {t.refNo}
                          </a>
                        ) : (
                          t.refNo
                        )}
                        {t.note && (
                          <span className="ml-2 text-xs text-muted-foreground">{t.note}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-destructive/80">
                        {t.amount < 0 ? formatCurrency(t.amount, currency) : ""}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                        {t.amount > 0 ? formatCurrency(t.amount, currency) : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
