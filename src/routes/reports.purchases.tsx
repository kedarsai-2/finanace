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
import { usePurchases } from "@/hooks/usePurchases";
import { useParties, formatCurrency } from "@/hooks/useParties";
import { downloadCsv } from "@/lib/reportExport";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports/purchases")({
  head: () => ({ meta: [{ title: "Purchase Report — QOBOX" }] }),
  component: PurchaseReport,
});

function PurchaseReport() {
  const { activeId, businesses } = useBusinesses();
  const business = businesses.find((b) => b.id === activeId);
  const currency = business?.currency ?? "INR";
  const { purchases } = usePurchases(activeId);
  const { parties } = useParties(activeId);

  const suppliers = parties.filter((p) => p.type === "supplier" || p.type === "both");

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [supplierId, setSupplierId] = useState("all");

  const rows = useMemo(() => {
    return purchases
      .filter((p) => p.status !== "cancelled")
      .filter((p) => {
        if (from && new Date(p.date) < new Date(from)) return false;
        if (to && new Date(p.date) > new Date(`${to}T23:59:59`)) return false;
        if (supplierId !== "all" && p.partyId !== supplierId) return false;
        return true;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [purchases, from, to, supplierId]);

  const total = rows.reduce((s, r) => s + r.total, 0);

  const exportCsv = () => {
    downloadCsv(
      "purchase-report.csv",
      ["Purchase No", "Date", "Supplier", "Total", "Status"],
      rows.map((r) => [
        r.number,
        format(new Date(r.date), "yyyy-MM-dd"),
        r.partyName,
        r.total.toFixed(2),
        r.status,
      ]),
    );
  };

  return (
    <ReportShell
      title="Purchase Report"
      description="Purchase bills by supplier and date."
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
          <div className="min-w-[200px]">
            <Label>Supplier</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All suppliers</SelectItem>
                {suppliers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(from || to || supplierId !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFrom("");
                setTo("");
                setSupplierId("all");
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
            No purchases match the filters
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Purchase</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Supplier</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link
                      to="/purchases/$id"
                      params={{ id: r.id }}
                      search={{} as never}
                      className="text-primary hover:underline"
                    >
                      {r.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(r.date), "dd MMM yyyy")}
                  </td>
                  <td className="px-4 py-3">{r.partyName}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(r.total, currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
                        r.status === "final"
                          ? "bg-success/15 text-success"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-muted/20 text-sm font-semibold">
                <td colSpan={3} className="px-4 py-3">
                  Total ({rows.length})
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatCurrency(total, currency)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </ReportShell>
  );
}
