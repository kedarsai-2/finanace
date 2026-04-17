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
import { useInvoices } from "@/hooks/useInvoices";
import { useParties, formatCurrency } from "@/hooks/useParties";
import { paymentStatusOf } from "@/types/invoice";
import { downloadCsv } from "@/lib/reportExport";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports/sales")({
  head: () => ({ meta: [{ title: "Sales Report — QOBOX" }] }),
  component: SalesReport,
});

function SalesReport() {
  const { activeId, businesses } = useBusinesses();
  const business = businesses.find((b) => b.id === activeId);
  const currency = business?.currency ?? "INR";
  const { invoices } = useInvoices(activeId);
  const { parties } = useParties(activeId);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [partyId, setPartyId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const rows = useMemo(() => {
    return invoices
      .filter((i) => i.status !== "cancelled")
      .filter((i) => {
        if (from && new Date(i.date) < new Date(from)) return false;
        if (to && new Date(i.date) > new Date(`${to}T23:59:59`)) return false;
        if (partyId !== "all" && i.partyId !== partyId) return false;
        if (status !== "all" && paymentStatusOf(i) !== status) return false;
        return true;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [invoices, from, to, partyId, status]);

  const totals = useMemo(() => {
    const t = rows.reduce(
      (s, r) => {
        s.total += r.total;
        s.paid += r.paidAmount;
        return s;
      },
      { total: 0, paid: 0 },
    );
    return { ...t, balance: t.total - t.paid };
  }, [rows]);

  const exportCsv = () => {
    downloadCsv(
      "sales-report.csv",
      ["Invoice No", "Date", "Party", "Total", "Paid", "Balance", "Status"],
      rows.map((r) => [
        r.number,
        format(new Date(r.date), "yyyy-MM-dd"),
        r.partyName,
        r.total.toFixed(2),
        r.paidAmount.toFixed(2),
        (r.total - r.paidAmount).toFixed(2),
        paymentStatusOf(r),
      ]),
    );
  };

  return (
    <ReportShell
      title="Sales Report"
      description="Invoices with totals, payments and balance due."
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
            <Label>Party</Label>
            <Select value={partyId} onValueChange={setPartyId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All parties</SelectItem>
                {parties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[160px]">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(from || to || partyId !== "all" || status !== "all") && (
            <Button variant="ghost" size="sm" onClick={() => { setFrom(""); setTo(""); setPartyId("all"); setStatus("all"); }}>
              Reset
            </Button>
          )}
        </>
      }
    >
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">No invoices match the filters</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Invoice</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Party</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Balance</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => {
                const st = paymentStatusOf(r);
                const bal = r.total - r.paidAmount;
                return (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link to="/invoices/$id" params={{ id: r.id }} className="text-primary hover:underline">
                        {r.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{format(new Date(r.date), "dd MMM yyyy")}</td>
                    <td className="px-4 py-3">{r.partyName}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(r.total, currency)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-success">{formatCurrency(r.paidAmount, currency)}</td>
                    <td className={cn("px-4 py-3 text-right tabular-nums", bal > 0 && "text-destructive")}>
                      {formatCurrency(bal, currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                        st === "paid" && "bg-success/15 text-success",
                        st === "partial" && "bg-warning/15 text-warning-foreground/80",
                        st === "unpaid" && "bg-destructive/10 text-destructive",
                      )}>
                        {st}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-muted/20 text-sm font-semibold">
                <td colSpan={3} className="px-4 py-3">Total ({rows.length})</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(totals.total, currency)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-success">{formatCurrency(totals.paid, currency)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-destructive">{formatCurrency(totals.balance, currency)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </ReportShell>
  );
}
