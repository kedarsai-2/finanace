import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  ArrowLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  Pencil,
  Phone,
  Mail,
  MapPin,
  FileText,
  Receipt,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { useBusinesses } from "@/hooks/useBusinesses";
import { useParties, formatCurrency } from "@/hooks/useParties";
import type { PartyType } from "@/types/party";

export const Route = createFileRoute("/parties/$id")({
  head: () => ({
    meta: [
      { title: "Party Details — Ledger & Balance" },
      {
        name: "description",
        content:
          "View party details, outstanding balance and full ledger history in one place.",
      },
    ],
  }),
  component: PartyDetailsPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <h1 className="text-2xl font-bold">Party not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This party may have been deleted or doesn't belong to the active business.
      </p>
      <Button asChild className="mt-6">
        <Link to="/parties">Back to Parties</Link>
      </Button>
    </div>
  ),
});

const TYPE_LABEL: Record<PartyType, string> = {
  customer: "Customer",
  supplier: "Supplier",
  both: "Both",
};

const TYPE_BADGE: Record<PartyType, string> = {
  customer: "bg-primary/10 text-primary",
  supplier: "bg-warning/15 text-warning-foreground/80",
  both: "bg-accent text-accent-foreground",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
}

function PartyDetailsPage() {
  const { id } = Route.useParams();
  const { activeId, businesses } = useBusinesses();
  const { allParties, ledger, hydrated } = useParties(activeId);
  const party = allParties.find((p) => p.id === id);
  const business = businesses.find((b) => b.id === party?.businessId);
  const currency = business?.currency ?? "INR";

  const entries = useMemo(
    () =>
      ledger
        .filter((e) => e.partyId === id)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [ledger, id],
  );

  const totals = useMemo(() => {
    let receivable = 0;
    let payable = 0;
    for (const e of entries) {
      if (e.amount > 0) receivable += e.amount;
      else payable += -e.amount;
    }
    return { receivable, payable, net: receivable - payable };
  }, [entries]);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="h-32 animate-pulse rounded-2xl bg-muted/50" />
      </div>
    );
  }

  if (!party) {
    throw notFound();
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <header className="border-b border-border/60 bg-card/40 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4 gap-1.5">
            <Link to="/parties">
              <ArrowLeft className="h-4 w-4" />
              Back to Parties
            </Link>
          </Button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-base font-semibold text-primary-foreground shadow">
                {initials(party.name)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {party.name}
                  </h1>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      TYPE_BADGE[party.type],
                    )}
                  >
                    {TYPE_LABEL[party.type]}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {party.mobile && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      {party.mobile}
                    </span>
                  )}
                  {party.email && (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      {party.email}
                    </span>
                  )}
                  {(party.city || party.state) && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {[party.city, party.state].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {party.gstNumber && (
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                      <FileText className="h-3.5 w-3.5" />
                      GST: {party.gstNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button asChild variant="outline" className="gap-2">
              <Link to="/parties/$id/edit" params={{ id: party.id }}>
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryCard
              label="Total receivable"
              value={formatCurrency(totals.receivable, currency)}
              tone="success"
              icon={<ArrowDownCircle className="h-4 w-4" />}
            />
            <SummaryCard
              label="Total payable"
              value={formatCurrency(totals.payable, currency)}
              tone="destructive"
              icon={<ArrowUpCircle className="h-4 w-4" />}
            />
            <SummaryCard
              label="Net balance"
              value={formatCurrency(totals.net, currency)}
              tone={totals.net >= 0 ? "success" : "destructive"}
              hint={totals.net >= 0 ? "Receivable" : "Payable"}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <Tabs defaultValue="ledger" className="w-full">
          <TabsList className="h-10">
            <TabsTrigger value="ledger" className="gap-1.5">
              <Receipt className="h-3.5 w-3.5" />
              Ledger
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-1.5" disabled>
              Transactions
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Soon
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ledger" className="mt-4">
            <LedgerView entries={entries} currency={currency} />
          </TabsContent>

          <TabsContent value="transactions" className="mt-4">
            <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center text-sm text-muted-foreground">
              Transactions view coming soon.
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
  icon,
  hint,
}: {
  label: string;
  value: string;
  tone: "success" | "destructive";
  icon?: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 flex items-center gap-1.5 text-2xl font-bold tabular-nums",
          tone === "success" ? "text-success" : "text-destructive",
        )}
      >
        {icon}
        {value}
      </p>
      {hint && (
        <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

function LedgerView({
  entries,
  currency,
}: {
  entries: { id: string; date: string; note: string; amount: number }[];
  currency: string;
}) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Receipt className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-base font-semibold">No ledger entries yet</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Opening balance and future invoices, payments and adjustments will
          appear here.
        </p>
      </div>
    );
  }

  // Compute running balance (oldest → newest), then display newest first.
  const chronological = [...entries].reverse();
  let running = 0;
  const withRunning = chronological.map((e) => {
    running += e.amount;
    return { ...e, running };
  });
  const display = [...withRunning].reverse();

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="hidden grid-cols-[140px_1fr_140px_140px_140px] items-center gap-4 border-b border-border bg-muted/40 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
        <span>Date</span>
        <span>Particulars</span>
        <span className="text-right">Debit</span>
        <span className="text-right">Credit</span>
        <span className="text-right">Balance</span>
      </div>
      <ul className="divide-y divide-border">
        {display.map((e) => {
          const isReceivable = e.amount > 0;
          return (
            <li
              key={e.id}
              className="grid grid-cols-2 gap-2 px-5 py-3 text-sm sm:grid-cols-[140px_1fr_140px_140px_140px] sm:items-center sm:gap-4"
            >
              <span className="text-muted-foreground">
                {new Date(e.date).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span className="font-medium text-foreground">{e.note}</span>
              <span className="text-right font-mono tabular-nums text-success">
                {isReceivable ? formatCurrency(e.amount, currency) : "—"}
              </span>
              <span className="text-right font-mono tabular-nums text-destructive">
                {!isReceivable ? formatCurrency(e.amount, currency) : "—"}
              </span>
              <span
                className={cn(
                  "text-right font-mono font-semibold tabular-nums",
                  e.running > 0 && "text-success",
                  e.running < 0 && "text-destructive",
                  e.running === 0 && "text-muted-foreground",
                )}
              >
                {formatCurrency(e.running, currency)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
