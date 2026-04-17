import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  FileText,
  Ban,
  CalendarIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

import { useBusinesses } from "@/hooks/useBusinesses";
import { useInvoices } from "@/hooks/useInvoices";
import { formatCurrency } from "@/hooks/useParties";
import {
  paymentStatusOf,
  type Invoice,
  type InvoiceStatus,
  type PaymentStatus,
} from "@/types/invoice";

const STATUS_FILTERS = ["all", "draft", "final", "cancelled"] as const;
const PAY_FILTERS = ["all", "paid", "partial", "unpaid"] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];
type PayFilter = (typeof PAY_FILTERS)[number];

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  status: fallback(z.enum(STATUS_FILTERS), "all").default("all"),
  payment: fallback(z.enum(PAY_FILTERS), "all").default("all"),
  from: fallback(z.string(), "").default(""),
  to: fallback(z.string(), "").default(""),
});

type SearchValues = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/invoices")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Invoices — Sales & Receivables" },
      {
        name: "description",
        content: "Manage all your invoices. Track totals, payments and outstanding balances.",
      },
    ],
  }),
  component: InvoicesPage,
});

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  final: "Final",
  cancelled: "Cancelled",
};

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  final: "bg-primary/10 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
};

const PAY_BADGE: Record<PaymentStatus, string> = {
  paid: "bg-success/10 text-success",
  partial: "bg-warning/15 text-warning-foreground/80",
  unpaid: "bg-muted text-muted-foreground",
};

function InvoicesPage() {
  const navigate = useNavigate({ from: "/invoices" });
  const { q, status, payment, from, to } = Route.useSearch();
  const { activeId, businesses } = useBusinesses();
  const { invoices, hydrated, remove, cancel } = useInvoices(activeId);
  const activeBusiness = businesses.find((b) => b.id === activeId);

  const [deleting, setDeleting] = useState<Invoice | null>(null);
  const [cancelling, setCancelling] = useState<Invoice | null>(null);

  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(to) : undefined;

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return invoices
      .filter((inv) => {
        if (status !== "all" && inv.status !== status) return false;
        if (payment !== "all" && paymentStatusOf(inv) !== payment) return false;
        const d = new Date(inv.date).getTime();
        if (fromDate && d < fromDate.setHours(0, 0, 0, 0)) return false;
        if (toDate && d > toDate.setHours(23, 59, 59, 999)) return false;
        if (!term) return true;
        return (
          inv.number.toLowerCase().includes(term) ||
          inv.partyName.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, q, status, payment, fromDate, toDate]);

  const totals = useMemo(() => {
    let total = 0;
    let paid = 0;
    let count = 0;
    for (const inv of invoices) {
      if (inv.status === "cancelled") continue;
      total += inv.total;
      paid += inv.paidAmount;
      count += 1;
    }
    return { total, paid, outstanding: total - paid, count };
  }, [invoices]);

  const setSearch = (next: Partial<SearchValues>) =>
    navigate({ search: (prev: SearchValues) => ({ ...prev, ...next }) });

  const confirmDelete = () => {
    if (!deleting) return;
    const n = deleting.number;
    remove(deleting.id);
    setDeleting(null);
    toast.success(`Deleted ${n}`);
  };

  const confirmCancel = () => {
    if (!cancelling) return;
    const n = cancelling.number;
    cancel(cancelling.id);
    setCancelling(null);
    toast.success(`Cancelled ${n}`);
  };

  const currency = activeBusiness?.currency ?? "INR";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <header className="border-b border-border/60 bg-card/40 backdrop-blur">
        <div className="max-w-screen-2xl px-6 py-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {activeBusiness?.name ?? "Workspace"}
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">Invoices</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {hydrated
                  ? `${totals.count} active • ${formatCurrency(totals.outstanding, currency)} outstanding`
                  : "Loading…"}
              </p>
            </div>
            <Button asChild size="lg" className="gap-2">
              <Link to="/invoices/new">
                <Plus className="h-4 w-4" />
                Create Invoice
              </Link>
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryCard label="Total billed" value={formatCurrency(totals.total, currency)} />
            <SummaryCard label="Total received" value={formatCurrency(totals.paid, currency)} tone="success" />
            <SummaryCard
              label="Outstanding"
              value={formatCurrency(totals.outstanding, currency)}
              tone={totals.outstanding > 0 ? "destructive" : "muted"}
            />
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setSearch({ q: e.target.value })}
                placeholder="Search by invoice number or party…"
                className="h-11 pl-10"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <FilterGroup label="Status">
                {STATUS_FILTERS.map((f) => (
                  <FilterChip
                    key={f}
                    active={status === f}
                    onClick={() => setSearch({ status: f })}
                  >
                    {f === "all" ? "All" : STATUS_LABEL[f as InvoiceStatus]}
                  </FilterChip>
                ))}
              </FilterGroup>

              <FilterGroup label="Payment">
                {PAY_FILTERS.map((f) => (
                  <FilterChip
                    key={f}
                    active={payment === f}
                    onClick={() => setSearch({ payment: f })}
                  >
                    <span className="capitalize">{f}</span>
                  </FilterChip>
                ))}
              </FilterGroup>

              <DateRange
                from={fromDate}
                to={toDate}
                onFrom={(d) => setSearch({ from: d ? d.toISOString() : "" })}
                onTo={(d) => setSearch({ to: d ? d.toISOString() : "" })}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl px-6 py-8">
        {hydrated && visible.length === 0 ? (
          <EmptyState filtered={invoices.length > 0} />
        ) : (
          <InvoicesTable
            invoices={visible}
            currency={currency}
            onDelete={setDeleting}
            onCancel={setCancelling}
          />
        )}
      </main>

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.number}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide the invoice from your list. Past payments and
              ledger entries are kept for audit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!cancelling} onOpenChange={(v) => !v && setCancelling(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel {cancelling?.number}?</AlertDialogTitle>
            <AlertDialogDescription>
              Cancelled invoices remain visible but are excluded from
              receivables and totals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep invoice</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel}>
              Cancel invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "destructive" | "muted";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-2xl font-bold tabular-nums",
          tone === "success" && "text-success",
          tone === "destructive" && "text-destructive",
          tone === "muted" && "text-muted-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
        {children}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function DateRange({
  from,
  to,
  onFrom,
  onTo,
}: {
  from?: Date;
  to?: Date;
  onFrom: (d?: Date) => void;
  onTo: (d?: Date) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
      <DatePill label="From" value={from} onChange={onFrom} />
      <span className="px-1 text-xs text-muted-foreground">→</span>
      <DatePill label="To" value={to} onChange={onTo} />
      {(from || to) && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => {
            onFrom(undefined);
            onTo(undefined);
          }}
          aria-label="Clear date range"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

function DatePill({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: Date;
  onChange: (d?: Date) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
            value
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          {value ? format(value, "dd MMM yyyy") : label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}

function InvoicesTable({
  invoices,
  currency,
  onDelete,
  onCancel,
}: {
  invoices: Invoice[];
  currency: string;
  onDelete: (i: Invoice) => void;
  onCancel: (i: Invoice) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="hidden grid-cols-[140px_110px_1.6fr_130px_130px_130px_220px] items-center gap-4 border-b border-border bg-muted/40 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
        <span>Invoice</span>
        <span>Date</span>
        <span>Party</span>
        <span className="text-right">Total</span>
        <span className="text-right">Paid</span>
        <span className="text-right">Balance</span>
        <span className="text-right">Status / Actions</span>
      </div>

      <ul className="divide-y divide-border">
        {invoices.map((inv) => {
          const balance = inv.total - inv.paidAmount;
          const pay = paymentStatusOf(inv);
          const cancelled = inv.status === "cancelled";
          return (
            <li
              key={inv.id}
              className="group grid grid-cols-1 items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/30 sm:grid-cols-[140px_110px_1.6fr_130px_130px_130px_220px]"
            >
              <Link
                to="/invoices/$id"
                params={{ id: inv.id }}
                className="font-mono text-sm font-semibold text-foreground hover:text-primary"
              >
                {inv.number}
              </Link>
              <span className="text-sm text-muted-foreground">
                {format(new Date(inv.date), "dd MMM yyyy")}
              </span>
              <Link
                to="/parties/$id"
                params={{ id: inv.partyId }}
                className="truncate text-sm font-medium text-foreground hover:text-primary"
              >
                {inv.partyName}
              </Link>
              <span className="text-right font-semibold tabular-nums">
                {formatCurrency(inv.total, currency)}
              </span>
              <span className="text-right tabular-nums text-muted-foreground">
                {formatCurrency(inv.paidAmount, currency)}
              </span>
              <span
                className={cn(
                  "text-right font-semibold tabular-nums",
                  cancelled && "text-muted-foreground line-through",
                  !cancelled && balance > 0 && "text-destructive",
                  !cancelled && balance <= 0 && "text-success",
                )}
              >
                {formatCurrency(balance, currency)}
              </span>

              <div className="flex items-center justify-start gap-1.5 sm:justify-end">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
                    STATUS_BADGE[inv.status],
                  )}
                >
                  {STATUS_LABEL[inv.status]}
                </span>
                {!cancelled && (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
                      PAY_BADGE[pay],
                    )}
                  >
                    {pay}
                  </span>
                )}

                <div className="ml-1 flex items-center gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                  {inv.status === "draft" && (
                    <Button
                      asChild
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      aria-label={`Edit ${inv.number}`}
                    >
                      <Link to="/invoices/$id/edit" params={{ id: inv.id }}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                  {!cancelled && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-warning hover:bg-warning/10"
                      onClick={() => onCancel(inv)}
                      aria-label={`Cancel ${inv.number}`}
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(inv)}
                    aria-label={`Delete ${inv.number}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
        <FileText className="h-8 w-8" />
      </div>
      <h2 className="mt-6 text-xl font-semibold">
        {filtered ? "No invoices match your filters" : "No invoices found"}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {filtered
          ? "Try a different search term or clear the filters."
          : "Create your first invoice to start tracking sales and receivables."}
      </p>
      <Button asChild size="lg" className="mt-6 gap-2">
        <Link to="/invoices/new">
          <Plus className="h-4 w-4" />
          Create Invoice
        </Link>
      </Button>
    </div>
  );
}
