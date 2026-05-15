import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useListPagination } from "@/hooks/useListPagination";
import { ListPaginationBar } from "@/components/ui/ListPaginationBar";
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
import { formatAccountCurrency } from "@/hooks/useParties";
import { buildAccountTxns } from "@/lib/accountLedger";
import { downloadCsv } from "@/lib/reportExport";
import { cn } from "@/lib/utils";
import { accountTxnDisplayFlow, type AccountTxnKind } from "@/types/account";

export const Route = createFileRoute("/reports/accounts")({
  head: () => ({ meta: [{ title: "Account Report - QOBOX" }] }),
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

function txnTypeLabel(r: {
  kind: AccountTxnKind;
  refNo?: string;
  note?: string;
  refLink?: string;
}) {
  if (r.kind === "payment-in" && r.refLink?.startsWith("/invoices/")) return "Sales";
  if ((r.kind === "transfer-in" || r.kind === "transfer-out") && r.refNo === "Adjustment") {
    return r.note?.toLowerCase().includes("cash")
      ? "Cash edit transaction"
      : "Bank edit transaction";
  }
  return KIND_LABEL[r.kind];
}

function AccountReport() {
  const { activeId, businesses } = useBusinesses();
  const businessIds = useMemo(() => businesses.map((b) => b.id), [businesses]);
  const business = businesses.find((b) => b.id === activeId);
  const currency = business?.currency ?? "INR";
  const { accounts } = useAccounts(null, businessIds);
  const safeAccounts = useMemo(() => accounts.filter((a) => !!a.id), [accounts]);
  const { payments } = usePayments(null);
  const { transfers } = useTransfers(null);
  const { expenses } = useExpenses(null);

  const [accountId, setAccountId] = useState<string>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const selected = safeAccounts.find((a) => a.id === accountId) ?? safeAccounts[0];
  const accountsById = useMemo(
    () => Object.fromEntries(safeAccounts.map((a) => [a.id, a])),
    [safeAccounts],
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

  const rowPgKey = useMemo(() => `${selected?.id ?? ""}|${from}|${to}`, [selected?.id, from, to]);
  const rowPg = useListPagination(rows, rowPgKey);

  const closingBalance = rows.length ? rows[0].balance : (selected?.openingBalance ?? 0);

  const exportCsv = () => {
    if (!selected) return;
    downloadCsv(
      `${selected.name}-account-report.csv`,
      ["Date", "Type", "Reference", "Debit", "Credit", "Balance"],
      [...rows].reverse().map((r) => {
        const flow = accountTxnDisplayFlow(r);
        return [
          format(new Date(r.date), "yyyy-MM-dd"),
          txnTypeLabel(r),
          r.refNo ?? "",
          flow < 0 ? Math.abs(flow).toFixed(2) : "",
          flow > 0 ? flow.toFixed(2) : "",
          r.balance.toFixed(2),
        ];
      }),
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
              <SelectTrigger>
                <SelectValue placeholder="Pick account" />
              </SelectTrigger>
              <SelectContent>
                {safeAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          {(from || to) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFrom("");
                setTo("");
              }}
            >
              Reset
            </Button>
          )}
          {selected && (
            <div className="ml-auto text-right">
              <p className="text-xs text-muted-foreground">Closing balance</p>
              <p
                className={cn(
                  "text-lg font-bold tabular-nums",
                  closingBalance < 0 && "text-destructive",
                )}
              >
                {closingBalance < 0 ? "-" : ""}
                {formatAccountCurrency(closingBalance, currency)}
              </p>
            </div>
          )}
        </>
      }
    >
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        {!selected ? (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">
            No accounts available
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">
            No transactions
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
              {rowPg.pageItems.map((r) => {
                const flow = accountTxnDisplayFlow(r);
                return (
                  <tr key={r.id} className={cn("hover:bg-muted/30", r.ledgerMemo && "bg-muted/15")}>
                    <td className="px-4 py-3 text-muted-foreground">
                      {format(new Date(r.date), "dd MMM yyyy")}
                    </td>
                    <td className="px-4 py-3">{txnTypeLabel(r)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.refNo ?? "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-destructive/80">
                      {flow < 0 ? formatAccountCurrency(flow, currency) : ""}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-success">
                      {flow > 0 ? formatAccountCurrency(flow, currency) : ""}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right font-medium tabular-nums",
                        r.balance < 0 && "text-destructive",
                      )}
                    >
                      {r.balance < 0 ? "-" : ""}
                      {formatAccountCurrency(r.balance, currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {selected && rows.length > 0 && (
          <ListPaginationBar
            page={rowPg.page}
            totalPages={rowPg.totalPages}
            totalCount={rowPg.totalCount}
            rangeFrom={rowPg.rangeFrom}
            rangeTo={rowPg.rangeTo}
            onPageChange={rowPg.setPage}
          />
        )}
      </div>
    </ReportShell>
  );
}
