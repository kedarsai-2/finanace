import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format, differenceInDays } from "date-fns";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReportShell } from "@/components/reports/ReportShell";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useParties, formatCurrency } from "@/hooks/useParties";
import { useInvoices } from "@/hooks/useInvoices";
import { usePurchases } from "@/hooks/usePurchases";
import { downloadCsv } from "@/lib/reportExport";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports/parties")({
  head: () => ({ meta: [{ title: "Party Report — Ledgerly" }] }),
  component: PartyReport,
});

type AgingRow = { bucket: string; receivable: number; payable: number };

function PartyReport() {
  const { activeId, businesses } = useBusinesses();
  const business = businesses.find((b) => b.id === activeId);
  const currency = business?.currency ?? "INR";
  const { parties, ledger } = useParties(activeId);
  const { invoices } = useInvoices(activeId);
  const { purchases } = usePurchases(activeId);

  const [partyId, setPartyId] = useState<string>("all");

  const summary = useMemo(() => {
    let receivable = 0;
    let payable = 0;
    for (const i of invoices) {
      if (i.status === "cancelled") continue;
      if (partyId !== "all" && i.partyId !== partyId) continue;
      receivable += i.total - i.paidAmount;
    }
    for (const p of purchases) {
      if (p.status === "cancelled") continue;
      if (partyId !== "all" && p.partyId !== partyId) continue;
      payable += p.total - p.paidAmount;
    }
    return { receivable, payable };
  }, [invoices, purchases, partyId]);

  const aging: AgingRow[] = useMemo(() => {
    const buckets = [
      { bucket: "0–30 days", min: 0, max: 30 },
      { bucket: "30–60 days", min: 30, max: 60 },
      { bucket: "60–90 days", min: 60, max: 90 },
      { bucket: "90+ days", min: 90, max: Infinity },
    ];
    const rows = buckets.map((b) => ({ bucket: b.bucket, receivable: 0, payable: 0 }));
    const today = new Date();
    for (const i of invoices) {
      if (i.status === "cancelled") continue;
      if (partyId !== "all" && i.partyId !== partyId) continue;
      const bal = i.total - i.paidAmount;
      if (bal <= 0) continue;
      const age = differenceInDays(today, new Date(i.date));
      const idx = buckets.findIndex((b) => age >= b.min && age < b.max);
      if (idx >= 0) rows[idx].receivable += bal;
    }
    for (const p of purchases) {
      if (p.status === "cancelled") continue;
      if (partyId !== "all" && p.partyId !== partyId) continue;
      const bal = p.total - p.paidAmount;
      if (bal <= 0) continue;
      const age = differenceInDays(today, new Date(p.date));
      const idx = buckets.findIndex((b) => age >= b.min && age < b.max);
      if (idx >= 0) rows[idx].payable += bal;
    }
    return rows;
  }, [invoices, purchases, partyId]);

  const ledgerRows = useMemo(() => {
    const filtered = ledger.filter((e) => {
      if (partyId === "all") {
        // Limit to parties of current business
        return parties.some((p) => p.id === e.partyId);
      }
      return e.partyId === partyId;
    });
    const sorted = [...filtered].sort((a, b) => (a.date < b.date ? -1 : 1));
    let running = 0;
    const withRunning = sorted.map((e) => {
      running += e.amount;
      return { ...e, running };
    });
    return withRunning.reverse();
  }, [ledger, parties, partyId]);

  const exportCsv = () => {
    downloadCsv(
      "party-report.csv",
      ["Date", "Party", "Type", "Ref", "Particulars", "Debit", "Credit"],
      ledgerRows.map((e) => {
        const party = parties.find((p) => p.id === e.partyId);
        return [
          format(new Date(e.date), "yyyy-MM-dd"),
          party?.name ?? "—",
          e.type ?? "opening",
          e.refNo ?? "",
          e.note,
          e.amount > 0 ? e.amount.toFixed(2) : "",
          e.amount < 0 ? Math.abs(e.amount).toFixed(2) : "",
        ];
      }),
    );
  };

  return (
    <ReportShell
      title="Party Report"
      description="Receivables, payables, aging and ledger entries."
      onExportCsv={exportCsv}
      filters={
        <div className="min-w-[240px]">
          <Label>Party</Label>
          <Select value={partyId} onValueChange={setPartyId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All parties</SelectItem>
              {parties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      }
    >
      {/* Summary */}
      <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Receivable</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-success">{formatCurrency(summary.receivable, currency)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Payable</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-destructive">{formatCurrency(summary.payable, currency)}</p>
        </div>
      </section>

      {/* Aging */}
      <section className="mb-4 overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">Aging</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Bucket</th>
              <th className="px-4 py-3 text-right">Receivable</th>
              <th className="px-4 py-3 text-right">Payable</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {aging.map((a) => (
              <tr key={a.bucket}>
                <td className="px-4 py-3">{a.bucket}</td>
                <td className="px-4 py-3 text-right tabular-nums text-success">{formatCurrency(a.receivable, currency)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-destructive">{formatCurrency(a.payable, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Ledger */}
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">Ledger</div>
        {ledgerRows.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">No ledger entries</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Party</th>
                <th className="px-4 py-3 text-left">Particulars</th>
                <th className="px-4 py-3 text-right">Debit</th>
                <th className="px-4 py-3 text-right">Credit</th>
                <th className="px-4 py-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ledgerRows.map((e) => {
                const party = parties.find((p) => p.id === e.partyId);
                return (
                  <tr key={e.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{format(new Date(e.date), "dd MMM yyyy")}</td>
                    <td className="px-4 py-3">{party?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-xs">
                      {e.refLink ? (
                        <a href={e.refLink} className="text-primary hover:underline">{e.note}</a>
                      ) : e.note}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{e.amount > 0 ? formatCurrency(e.amount, currency) : "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{e.amount < 0 ? formatCurrency(e.amount, currency) : "—"}</td>
                    <td className={cn(
                      "px-4 py-3 text-right font-medium tabular-nums",
                      e.running > 0 && "text-success",
                      e.running < 0 && "text-destructive",
                    )}>
                      {e.running < 0 ? "-" : ""}{formatCurrency(e.running, currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </ReportShell>
  );
}
