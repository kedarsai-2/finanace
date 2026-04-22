import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { format } from "date-fns";
import { Undo2, Search } from "lucide-react";

import { useBusinesses } from "@/hooks/useBusinesses";
import { usePurchases } from "@/hooks/usePurchases";
import { formatCurrency } from "@/hooks/useParties";

export const Route = createFileRoute("/purchase-returns")({
  head: () => ({
    meta: [
      { title: "Purchase Returns — Debit Notes" },
      {
        name: "description",
        content: "View and manage purchase returns / debit notes issued against supplier bills.",
      },
    ],
  }),
  component: PurchaseReturnsPage,
});

function PurchaseReturnsPage() {
  const { activeId, scopedBusinessId, businesses } = useBusinesses();
  const { returns, allPurchases, hydrated } = usePurchases(scopedBusinessId);
  const activeBusiness = businesses.find((b) => b.id === activeId);
  const currency = activeBusiness?.currency ?? "INR";

  const sorted = useMemo(
    () => [...returns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [returns],
  );

  const totals = useMemo(() => {
    let total = 0;
    let count = 0;
    for (const r of returns) {
      if (r.status === "cancelled") continue;
      total += r.total;
      count += 1;
    }
    return { total, count };
  }, [returns]);

  const sourceMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of allPurchases) m.set(p.id, p.number);
    return m;
  }, [allPurchases]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <header className="border-b border-border/60 bg-card/40 backdrop-blur">
        <div className="max-w-screen-2xl px-6 py-8">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {activeBusiness?.name ?? "Workspace"}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Purchase Returns</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {hydrated
              ? `${totals.count} return${totals.count === 1 ? "" : "s"} • ${formatCurrency(totals.total, currency)} returned`
              : "Loading…"}
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SummaryCard label="Total Returns" value={String(totals.count)} />
            <SummaryCard label="Total Returned" value={formatCurrency(totals.total, currency)} />
          </div>

          <p className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
            Returns are created by opening any finalised purchase and choosing
            <span className="px-1 font-medium text-foreground">Convert → Purchase Return</span>.
          </p>
        </div>
      </header>

      <main className="max-w-screen-2xl px-6 py-8">
        {hydrated && sorted.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="hidden grid-cols-[140px_110px_1.6fr_140px_140px_120px] items-center gap-4 border-b border-border bg-muted/40 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
              <span>Return No.</span>
              <span>Date</span>
              <span>Supplier</span>
              <span>Against</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Status</span>
            </div>
            <ul className="divide-y divide-border">
              {sorted.map((r) => (
                <li
                  key={r.id}
                  className="grid grid-cols-1 items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/30 sm:grid-cols-[140px_110px_1.6fr_140px_140px_120px]"
                >
                  <Link
                    to="/purchase-returns/$id"
                    params={{ id: r.id }}
                    className="font-mono text-sm font-semibold text-foreground hover:text-primary"
                  >
                    {r.number}
                  </Link>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(r.date), "dd MMM yyyy")}
                  </span>
                  <Link
                    to="/parties/$id"
                    params={{ id: r.partyId }}
                    className="truncate text-sm font-medium text-foreground hover:text-primary"
                  >
                    {r.partyName}
                  </Link>
                  <span className="font-mono text-xs text-muted-foreground">
                    {r.sourcePurchaseId ? (sourceMap.get(r.sourcePurchaseId) ?? "—") : "—"}
                  </span>
                  <span className="text-right font-semibold tabular-nums text-success">
                    + {formatCurrency(r.total, currency)}
                  </span>
                  <span className="text-right">
                    <span
                      className={
                        r.status === "cancelled"
                          ? "inline-flex rounded-full bg-destructive/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-destructive"
                          : r.status === "final"
                            ? "inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary"
                            : "inline-flex rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                      }
                    >
                      {r.status}
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
        <Undo2 className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No purchase returns yet</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Open any finalised purchase and click{" "}
        <span className="font-medium">Convert → Purchase Return</span> to record returned stock.
      </p>
      <Link
        to="/purchases"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:opacity-90"
      >
        <Search className="h-4 w-4" />
        Browse purchases
      </Link>
    </div>
  );
}
