import { Outlet, createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useMemo } from "react";
import { format } from "date-fns";
import { FileMinus, Search } from "lucide-react";

import { useBusinesses } from "@/hooks/useBusinesses";
import { useInvoices } from "@/hooks/useInvoices";
import { formatCurrency } from "@/hooks/useParties";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/credit-notes")({
  head: () => ({
    meta: [
      { title: "Credit Notes — Sales Returns" },
      {
        name: "description",
        content: "View and manage credit notes issued against sales invoices.",
      },
    ],
  }),
  component: CreditNotesRouteLayout,
});

function CreditNotesRouteLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/credit-notes") return <Outlet />;
  return <CreditNotesPage />;
}

function CreditNotesPage() {
  const { activeId, scopedBusinessId, businesses } = useBusinesses();
  const { creditNotes, allInvoices, hydrated } = useInvoices(scopedBusinessId);
  const activeBusiness = businesses.find((b) => b.id === activeId);
  const currency = activeBusiness?.currency ?? "INR";

  const sorted = useMemo(
    () => [...creditNotes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [creditNotes],
  );

  const totals = useMemo(() => {
    let total = 0;
    let count = 0;
    for (const cn of creditNotes) {
      if (cn.status === "cancelled") continue;
      total += cn.total;
      count += 1;
    }
    return { total, count };
  }, [creditNotes]);

  const sourceMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const inv of allInvoices) m.set(inv.id, inv.number);
    return m;
  }, [allInvoices]);

  const inferSourceFromNotes = (notes?: string) => {
    const raw = (notes ?? "").trim();
    if (!raw) return undefined;
    const firstLine = raw.split("\n")[0]?.trim() ?? "";
    const m = /^Against\s+([A-Z0-9-]+)/i.exec(firstLine);
    return m?.[1];
  };

  const creditNotePaymentTypeLabel = (mode?: "cash" | "bank") =>
    mode === "cash" ? "Cash" : mode === "bank" ? "Bank" : "Not set";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <header className="border-b border-border/60 bg-card/40 backdrop-blur">
        <div className="max-w-screen-2xl px-6 py-8">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {activeBusiness?.name ?? "Workspace"}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Credit Notes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {hydrated
              ? `${totals.count} credit note${totals.count === 1 ? "" : "s"} • ${formatCurrency(totals.total, currency)} credited`
              : "Loading…"}
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SummaryCard label="Total Credit Notes" value={String(totals.count)} />
            <SummaryCard label="Total Credited" value={formatCurrency(totals.total, currency)} />
          </div>

          <p className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
            Credit notes are created by opening any finalised invoice and choosing
            <span className="px-1 font-medium text-foreground">Convert → Credit Note</span>.
          </p>
        </div>
      </header>

      <main className="max-w-screen-2xl px-6 py-8">
        {hydrated && sorted.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="hidden grid-cols-[130px_110px_minmax(0,1.4fr)_120px_130px_120px_100px] items-center gap-4 border-b border-border bg-muted/40 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
              <span>CN Number</span>
              <span>Date</span>
              <span>Party</span>
              <span>Against</span>
              <span>Payment type</span>
              <span className="text-right">Amount</span>
              <span className="text-center">Status</span>
            </div>
            <ul className="divide-y divide-border">
              {sorted.map((cn) => (
                <li
                  key={cn.id}
                  className="grid grid-cols-1 items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/30 sm:grid-cols-[130px_110px_minmax(0,1.4fr)_120px_130px_120px_100px]"
                >
                  <Link
                    to="/credit-notes/$id"
                    params={{ id: cn.id }}
                    className="font-mono text-sm font-semibold text-foreground hover:text-primary"
                  >
                    {cn.number}
                  </Link>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(cn.date), "dd MMM yyyy")}
                  </span>
                  <Link
                    to="/parties/$id"
                    params={{ id: cn.partyId }}
                    className="truncate text-sm font-medium text-foreground hover:text-primary"
                  >
                    {cn.partyName}
                  </Link>
                  <span className="font-mono text-xs text-muted-foreground">
                    {cn.sourceInvoiceId
                      ? (sourceMap.get(cn.sourceInvoiceId) ?? inferSourceFromNotes(cn.notes) ?? "—")
                      : (inferSourceFromNotes(cn.notes) ?? "—")}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {creditNotePaymentTypeLabel(cn.cnPaymentMode)}
                  </span>
                  <span className="text-right font-semibold tabular-nums text-destructive">
                    − {formatCurrency(cn.total, currency)}
                  </span>
                  <span className="text-center">
                    <span
                      className={
                        cn.status === "cancelled"
                          ? "inline-flex rounded-full bg-destructive/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-destructive"
                          : cn.status === "final"
                            ? "inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary"
                            : "inline-flex rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                      }
                    >
                      {cn.status === "final"
                        ? "Final"
                        : cn.status === "cancelled"
                          ? "Cancelled"
                          : "Draft"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <FileMinus className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No credit notes yet</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Open any finalised invoice and click{" "}
        <span className="font-medium">Convert → Credit Note</span> to issue a credit against it.
      </p>
      <Link
        to="/invoices"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:opacity-90"
      >
        <Search className="h-4 w-4" />
        Browse invoices
      </Link>
    </div>
  );
}
