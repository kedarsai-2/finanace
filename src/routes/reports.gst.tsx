import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReportShell } from "@/components/reports/ReportShell";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useInvoices } from "@/hooks/useInvoices";
import { usePurchases } from "@/hooks/usePurchases";
import { formatCurrency } from "@/hooks/useParties";
import { downloadCsv } from "@/lib/reportExport";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reports/gst")({
  head: () => ({ meta: [{ title: "GST Report — QOBOX" }] }),
  component: GstReport,
});

function GstReport() {
  const { activeId, businesses } = useBusinesses();
  const business = businesses.find((b) => b.id === activeId);
  const currency = business?.currency ?? "INR";
  const { invoices } = useInvoices(activeId);
  const { purchases } = usePurchases(activeId);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const inRange = (d: string) => {
    if (from && new Date(d) < new Date(from)) return false;
    if (to && new Date(d) > new Date(`${to}T23:59:59`)) return false;
    return true;
  };

  const output = useMemo(() => {
    const f = invoices.filter((i) => i.status === "final" && inRange(i.date));
    return {
      taxable: f.reduce((s, i) => s + i.taxableValue, 0),
      cgst: f.reduce((s, i) => s + i.cgst, 0),
      sgst: f.reduce((s, i) => s + i.sgst, 0),
      igst: f.reduce((s, i) => s + i.igst, 0),
    };
  }, [invoices, from, to]);

  const input = useMemo(() => {
    const f = purchases.filter((p) => p.status === "final" && inRange(p.date));
    return {
      taxable: f.reduce((s, p) => s + p.taxableValue, 0),
      cgst: f.reduce((s, p) => s + p.cgst, 0),
      sgst: f.reduce((s, p) => s + p.sgst, 0),
      igst: f.reduce((s, p) => s + p.igst, 0),
    };
  }, [purchases, from, to]);

  const net = {
    cgst: output.cgst - input.cgst,
    sgst: output.sgst - input.sgst,
    igst: output.igst - input.igst,
  };
  const netTotal = net.cgst + net.sgst + net.igst;

  const exportCsv = () => {
    downloadCsv(
      "gst-report.csv",
      ["Section", "Taxable Value", "CGST", "SGST", "IGST"],
      [
        ["Output GST (Sales)", output.taxable.toFixed(2), output.cgst.toFixed(2), output.sgst.toFixed(2), output.igst.toFixed(2)],
        ["Input GST (Purchases)", input.taxable.toFixed(2), input.cgst.toFixed(2), input.sgst.toFixed(2), input.igst.toFixed(2)],
        ["Net (Output − Input)", "", net.cgst.toFixed(2), net.sgst.toFixed(2), net.igst.toFixed(2)],
      ],
    );
  };

  return (
    <ReportShell
      title="GST Report"
      description="Output and input GST summary by date range."
      onExportCsv={exportCsv}
      filters={
        <>
          <div><Label htmlFor="from">From</Label><Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><Label htmlFor="to">To</Label><Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          {(from || to) && (
            <Button variant="ghost" size="sm" onClick={() => { setFrom(""); setTo(""); }}>Reset</Button>
          )}
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GstCard title="Output GST (Sales)" data={output} currency={currency} />
        <GstCard title="Input GST (Purchases)" data={input} currency={currency} />
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Net GST Liability</p>
        <div className="mt-3 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">CGST</p>
            <p className="text-lg font-semibold tabular-nums">{formatCurrency(net.cgst, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">SGST</p>
            <p className="text-lg font-semibold tabular-nums">{formatCurrency(net.sgst, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">IGST</p>
            <p className="text-lg font-semibold tabular-nums">{formatCurrency(net.igst, currency)}</p>
          </div>
        </div>
        <p className="mt-4 text-2xl font-bold tabular-nums">
          Total: {netTotal < 0 ? "-" : ""}{formatCurrency(netTotal, currency)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {netTotal >= 0 ? "Payable to government" : "Refundable / input credit available"}
        </p>
      </div>
    </ReportShell>
  );
}

function GstCard({
  title,
  data,
  currency,
}: {
  title: string;
  data: { taxable: number; cgst: number; sgst: number; igst: number };
  currency: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3 space-y-1.5 text-sm">
        <Row label="Taxable Value" value={data.taxable} currency={currency} />
        <Row label="CGST" value={data.cgst} currency={currency} />
        <Row label="SGST" value={data.sgst} currency={currency} />
        <Row label="IGST" value={data.igst} currency={currency} />
        <div className="mt-2 border-t border-border pt-2">
          <Row
            label="Total Tax"
            value={data.cgst + data.sgst + data.igst}
            currency={currency}
            bold
          />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, currency, bold }: { label: string; value: number; currency: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={bold ? "font-semibold" : "text-muted-foreground"}>{label}</span>
      <span className={`tabular-nums ${bold ? "font-semibold" : ""}`}>{formatCurrency(value, currency)}</span>
    </div>
  );
}
