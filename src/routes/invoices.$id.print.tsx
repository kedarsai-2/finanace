import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InvoicePrintLayout } from "@/components/invoice/InvoicePrintLayout";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useParties } from "@/hooks/useParties";
import { useInvoices } from "@/hooks/useInvoices";

export const Route = createFileRoute("/invoices/$id/print")({
  head: () => ({
    meta: [
      { title: "Invoice — Print preview" },
      {
        name: "description",
        content: "Print-ready invoice layout. Use Print → Save as PDF to download.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InvoicePrintPage,
});

function InvoicePrintPage() {
  const { id } = Route.useParams();
  const { businesses, activeId } = useBusinesses();
  const { allInvoices, hydrated, ensureLines } = useInvoices(activeId);
  const invoice = allInvoices.find((i) => i.id === id);
  const business = businesses.find((b) => b.id === invoice?.businessId);
  const { parties } = useParties(invoice?.businessId);
  const party = parties.find((p) => p.id === invoice?.partyId);

  useEffect(() => {
    if (!invoice) return;
    if (invoice.lines.length === 0) {
      void ensureLines(invoice.id).catch(() => {});
    }
  }, [invoice, ensureLines]);

  // Auto-trigger the browser's print dialog when arriving with ?auto=1
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("auto") === "1" && invoice) {
      const t = setTimeout(() => window.print(), 300);
      return () => clearTimeout(t);
    }
  }, [invoice]);

  if (!hydrated) {
    return <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (!invoice) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-24 text-center">
        <h1 className="text-xl font-semibold">Invoice not found</h1>
        <Button asChild variant="outline">
          <Link to="/invoices" search={{ q: "", status: "all", payment: "all", from: "", to: "" }}>
            Back to Invoices
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="invoice-print-shell min-h-screen bg-slate-200/60 py-6">
      {/* Top bar — hidden on print */}
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-2">
        <Button asChild variant="ghost" className="gap-2">
          <Link to="/invoices/$id" params={{ id: invoice.id }}>
            <ArrowLeft className="h-4 w-4" />
            Back to invoice
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button onClick={() => window.print()} className="gap-2">
            <Download className="h-4 w-4" />
            Save as PDF
          </Button>
        </div>
      </div>

      <div className="mx-auto shadow-2xl">
        <InvoicePrintLayout invoice={invoice} business={business} party={party} />
      </div>

      {/* Print rules — keep colours, hide everything else, lock to A4 */}
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .invoice-print-shell { background: #fff !important; padding: 0 !important; }
          .invoice-print { box-shadow: none !important; width: 210mm !important; min-height: 297mm !important; }
        }
        .invoice-print { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      `}</style>
    </div>
  );
}
