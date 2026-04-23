import { createFileRoute, Link } from "@tanstack/react-router";
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
import { useExpenses } from "@/hooks/useExpenses";
import { useExpenseCategories } from "@/hooks/useExpenseCategories";
import { useAccounts } from "@/hooks/useAccounts";
import { formatCurrency } from "@/hooks/useParties";
import { downloadCsv } from "@/lib/reportExport";

export const Route = createFileRoute("/reports/expenses")({
  head: () => ({ meta: [{ title: "Expense Report — QOBOX" }] }),
  component: ExpenseReport,
});

function ExpenseReport() {
  const { activeId, businesses } = useBusinesses();
  const business = businesses.find((b) => b.id === activeId);
  const currency = business?.currency ?? "INR";
  const { expenses } = useExpenses(activeId);
  const { categories } = useExpenseCategories(activeId);
  const { accounts } = useAccounts(
    activeId,
    businesses.map((b) => b.id),
  );
  const safeAccounts = useMemo(() => accounts.filter((a) => !!a.id), [accounts]);

  const accountsById = useMemo(
    () => Object.fromEntries(safeAccounts.map((a) => [a.id, a.name])),
    [safeAccounts],
  );

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [category, setCategory] = useState("all");
  const [accountId, setAccountId] = useState("all");

  const rows = useMemo(() => {
    return expenses
      .filter((e) => {
        if (from && new Date(e.date) < new Date(from)) return false;
        if (to && new Date(e.date) > new Date(`${to}T23:59:59`)) return false;
        if (category !== "all" && e.category !== category) return false;
        if (accountId !== "all" && e.accountId !== accountId) return false;
        return true;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [expenses, from, to, category, accountId]);

  const total = rows.reduce((s, r) => s + r.amount, 0);

  const exportCsv = () => {
    downloadCsv(
      "expense-report.csv",
      ["Date", "Category", "Amount", "Account", "Notes"],
      rows.map((r) => [
        format(new Date(r.date), "yyyy-MM-dd"),
        r.category,
        r.amount.toFixed(2),
        accountsById[r.accountId] ?? "—",
        r.notes ?? "",
      ]),
    );
  };

  return (
    <ReportShell
      title="Expense Report"
      description="Spending broken down by category and account."
      onExportCsv={exportCsv}
      filters={
        <>
          <div>
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="min-w-[180px]">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[180px]">
            <Label>Account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All accounts</SelectItem>
                {safeAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(from || to || category !== "all" || accountId !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFrom("");
                setTo("");
                setCategory("all");
                setAccountId("all");
              }}
            >
              Reset
            </Button>
          )}
        </>
      }
    >
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">
            No expenses match the filters
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-left">Account</th>
                <th className="px-4 py-3 text-left">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(r.date), "dd MMM yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to="/expenses/$id"
                      params={{ id: r.id }}
                      className="text-primary hover:underline"
                    >
                      {r.category}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-destructive">
                    {formatCurrency(r.amount, currency)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {accountsById[r.accountId] ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-muted/20 text-sm font-semibold">
                <td colSpan={2} className="px-4 py-3">
                  Total ({rows.length})
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-destructive">
                  {formatCurrency(total, currency)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </ReportShell>
  );
}
