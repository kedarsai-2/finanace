import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ReportShell } from "@/components/reports/ReportShell";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useAccounts } from "@/hooks/useAccounts";
import { usePayments } from "@/hooks/usePayments";
import { useTransfers } from "@/hooks/useTransfers";
import { useExpenses } from "@/hooks/useExpenses";
import { formatCurrency } from "@/hooks/useParties";
import { buildAccountTxns } from "@/lib/accountLedger";
import { downloadCsv } from "@/lib/reportExport";
import { cn } from "@/lib/utils";
import type { AccountTxnKind } from "@/types/account";

export const Route = createFileRoute("/reports/accounts")({
  head: () => ({ meta: [{ title: "Account Report — Ledgerly" }] }),
  component: AccountReport,
});

const KIND_LABEL: Record<AccountTxnKind, string> = {
  opening: "Opening",
  "payment-in": "Payment in",
  "payment-out": "Payment out",
  "transfer-in": "Transfer in",
  "transfer-out": "Transfer out",
  expense: "Expense",
};

function AccountReport() {
  const { activeId, businesses } = useBusinesses();
  const business = businesses.find((b) => b.id === activeId);
  const currency = business?.currency ?? "INR";
  const { accounts } = useAccounts(activeId, businesses.map((b) => b.id));
  const { payments } = usePayments(activeId);
  const { transfers } = useTransfers(activeId);
  const { expenses } = useExpenses(activeId);

  const [accountId, setAccountId] = useState<string>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const selected = accounts.find((a) => a.id === accountId) ?? accounts[0];
  const accountsById = useMemo(
    () => Object.fromEntries(accounts.map((a) => [a.id, a])),
    [accounts],
  );

  const rows = useMemo(() => {
    if (!selected) return [];
    const txns = buildAccountTxns({
      account: selected,
      payments,
      transfers,
      expenses,
      accountsById,
    });
    let running = 0;
    return txns
      .map((t) => {
        running += t.amount;
        return { ...t, balance: running };
      })
      .filter((r) => {
        if (from && new Date(r.date) < new Date(from)) return false;
        if (to && new Date(r.date) > new Date(`${to}T23:59:59`)) return false;
        return true;
      })
      .reverse();
  }, [selected, payments, transfers, expenses, accountsById, from, to]);

  const closingBalance = rows.length ? rows[0].balance : selected?.openingBalance ?? 0;

  const exportCsv = () => {
    if (!selected) return;
    downloadCsv(
      `${selected.name}-account-report.csv`,
      ["Date", "Type", "Reference", "Debit", "Credit", "Balance"],
      [...rows].reverse().map((r) => [
        format(new Date(r.date), "yyyy-MM-dd"),
        KIND_LABEL[r.kind],
        r.refNo ?? "",
        r.amount < 0 ? Math.abs(r.amount).toFixed(2) : "",
        r.amount > 0 ? r.amount.toFixed(2) : "",
        r.balance.toFixed(2),
      ]),
    );
  };

  return (
    <ReportShell
      title="Account Report"
      description="Date, type, debit, credit and running balance."
      onExportCsv={exportCsv}
      filters={
        <>
          <div className="min-w-[200px]">
            <Label>Account</Label>
            <Select value={selected?.id ?? ""} onValueChange={setAccountId}>
              <SelectTrigger><SelectValue placeholder="Pick account" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label htmlFor="from">From</Label><Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><Label htmlFor="to">To</Label><Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          {(from || to) && (
            <Button variant="ghost" size="sm" onClick={() => { setFrom(""); setTo(""); }}>Reset</Button>
          )}
          {selected && (
            <div className="ml-auto text-right">
              <p className="text-xs text-muted-foreground">Closing balance</p>
              <p className={cn("text-lg font-bold tabular-nums", closingBalance < 0 && "text-destructive")}>
                {closingBalance < 0 ? "-" : ""}{formatCurrency(closingBalance, currency)}
              </p>
            </div>
          )}
        </>
      }
    >
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {!selected ? (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">No accounts available</div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">No transactions</div>
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
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">{format(new Date(r.date), "dd MMM yyyy")}</td>
                  <td className="px-4 py-3">{KIND_LABEL[r.kind]}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.refNo ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-destructive/80">
                    {r.amount < 0 ? formatCurrency(r.amount, currency) : ""}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-success">
                    {r.amount > 0 ? formatCurrency(r.amount, currency) : ""}
                  </td>
                  <td className={cn("px-4 py-3 text-right font-medium tabular-nums", r.balance < 0 && "text-destructive")}>
                    {r.balance < 0 ? "-" : ""}{formatCurrency(r.balance, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ReportShell>
  );
}
