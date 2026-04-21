import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PurchasePrintLayout } from "@/components/purchase/PurchasePrintLayout";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useParties } from "@/hooks/useParties";
import { usePurchases } from "@/hooks/usePurchases";

export const Route = createFileRoute("/purchases/$id/print")({
  head: () => ({
    meta: [
      { title: "Purchase — Print preview" },
      { name: "description", content: "Print-ready purchase bill layout. Use Print → Save as PDF to download." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PurchasePrintPage,
});

function PurchasePrintPage() {
  const { id } = Route.useParams();
  const { businesses, activeId } = useBusinesses();
  const { allPurchases, hydrated, ensureLines } = usePurchases(activeId);
  const purchase = allPurchases.find((p) => p.id === id);
  const business = businesses.find((b) => b.id === purchase?.businessId);
  const { parties } = useParties(purchase?.businessId);
  const party = parties.find((p) => p.id === purchase?.partyId);

  useEffect(() => {
    if (!purchase) return;
    if (purchase.lines.length === 0) {
      void ensureLines(purchase.id).catch(() => {});
    }
  }, [purchase, ensureLines]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("auto") === "1" && purchase) {
      const t = setTimeout(() => window.print(), 300);
      return () => clearTimeout(t);
    }
  }, [purchase]);

  if (!hydrated) {
    return <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (!purchase) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-24 text-center">
        <h1 className="text-xl font-semibold">Purchase not found</h1>
        <Button asChild variant="outline">
          <Link to="/purchases" search={{ q: "", status: "all", from: "", to: "" }}>
            Back to Purchases
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="invoice-print-shell min-h-screen bg-slate-200/60 py-6">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-2">
        <Button asChild variant="ghost" className="gap-2">
          <Link to="/purchases/$id" params={{ id: purchase.id }}>
            <ArrowLeft className="h-4 w-4" />
            Back to purchase
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
        <PurchasePrintLayout purchase={purchase} business={business} party={party} />
      </div>

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
