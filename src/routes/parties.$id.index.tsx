import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo } from "react";
import { format } from "date-fns";
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
import { useInvoices } from "@/hooks/useInvoices";
import { usePayments } from "@/hooks/usePayments";
import { usePurchases } from "@/hooks/usePurchases";
import { PartyLedger } from "@/components/party/PartyLedger";
import { PartyPredictionCard } from "@/components/ai/PartyPredictionCard";
import type { PartyType } from "@/types/party";
import type { Invoice } from "@/types/invoice";
import type { Purchase } from "@/types/purchase";
import type { Payment } from "@/types/payment";

export const Route = createFileRoute("/parties/$id/")({
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
  const { invoices } = useInvoices(activeId);
  const { payments } = usePayments(activeId);
  const { allPurchases } = usePurchases(activeId);
  const { allInvoices } = useInvoices(activeId);

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
            <TabsTrigger value="transactions" className="gap-1.5">
              Transactions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ledger" className="mt-4 space-y-4">
            {(party.type === "customer" || party.type === "both") && (
              <PartyPredictionCard party={party} invoices={invoices} payments={payments} />
            )}
            <PartyLedger party={party} entries={entries} currency={currency} />
          </TabsContent>

          <TabsContent value="transactions" className="mt-4">
            <PartyTimeline
              partyId={party.id}
              invoices={allInvoices}
              purchases={allPurchases}
              payments={payments}
              currency={currency}
            />
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

type TimelineRow = {
  id: string;
  date: string;
  kind: "Invoice" | "Credit Note" | "Purchase" | "Purch. Return" | "Payment";
  ref: string;
  link: string;
  amount: number;
  tone: "primary" | "destructive" | "success" | "warning";
};

function PartyTimeline({
  partyId,
  invoices,
  purchases,
  payments,
  currency,
}: {
  partyId: string;
  invoices: Invoice[];
  purchases: Purchase[];
  payments: Payment[];
  currency: string;
}) {
  const rows: TimelineRow[] = [];
  for (const inv of invoices) {
    if (inv.deleted || inv.partyId !== partyId) continue;
    const isCN = inv.kind === "credit-note";
    rows.push({
      id: inv.id,
      date: inv.date,
      kind: isCN ? "Credit Note" : "Invoice",
      ref: inv.number,
      link: isCN ? `/credit-notes/${inv.id}` : `/invoices/${inv.id}`,
      amount: isCN ? -inv.total : inv.total,
      tone: isCN ? "destructive" : "primary",
    });
  }
  for (const p of purchases) {
    if (p.deleted || p.partyId !== partyId) continue;
    const isRet = p.kind === "return";
    rows.push({
      id: p.id,
      date: p.date,
      kind: isRet ? "Purch. Return" : "Purchase",
      ref: p.number,
      link: isRet ? `/purchase-returns/${p.id}` : `/purchases/${p.id}`,
      amount: isRet ? p.total : -p.total,
      tone: isRet ? "success" : "warning",
    });
  }
  for (const pay of payments) {
    if (pay.partyId !== partyId) continue;
    rows.push({
      id: pay.id,
      date: pay.date,
      kind: "Payment",
      ref: pay.reference || "—",
      link: `/payments`,
      amount: pay.direction === "in" ? -pay.amount : pay.amount,
      tone: "success",
    });
  }
  rows.sort((a, b) => (a.date < b.date ? 1 : -1));

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center text-sm text-muted-foreground">
        No transactions yet for this party.
      </div>
    );
  }

  const toneClass = (t: TimelineRow["tone"]) =>
    t === "primary"
      ? "bg-primary/10 text-primary"
      : t === "destructive"
        ? "bg-destructive/10 text-destructive"
        : t === "success"
          ? "bg-success/15 text-success"
          : "bg-warning/15 text-warning-foreground/80";

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <ul className="divide-y divide-border">
        {rows.map((r) => (
          <li
            key={`${r.kind}-${r.id}`}
            className="grid grid-cols-[110px_120px_1fr_140px] items-center gap-3 px-5 py-3 text-sm"
          >
            <span className="text-muted-foreground">
              {format(new Date(r.date), "dd MMM yyyy")}
            </span>
            <span>
              <span
                className={cn(
                  "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                  toneClass(r.tone),
                )}
              >
                {r.kind}
              </span>
            </span>
            <a
              href={r.link}
              className="font-mono text-xs text-primary hover:underline"
            >
              {r.ref}
            </a>
            <span
              className={cn(
                "text-right font-mono font-semibold tabular-nums",
                r.amount > 0 ? "text-success" : "text-destructive",
              )}
            >
              {r.amount >= 0 ? "+ " : "− "}
              {formatCurrency(r.amount, currency)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

