import {
  Outlet,
  createFileRoute,
  Link,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { z } from "zod";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ShoppingCart,
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
import { usePurchases } from "@/hooks/usePurchases";
import { formatCurrency } from "@/hooks/useParties";
import type { Purchase, PurchaseStatus } from "@/types/purchase";

const STATUS_FILTERS = ["all", "draft", "final", "cancelled"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const searchSchema = z.object({
  q: z.string().catch(""),
  status: z.enum(STATUS_FILTERS).catch("all"),
  from: z.string().catch(""),
  to: z.string().catch(""),
});

type SearchValues = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/purchases")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Purchases — Bills & Payables" },
      {
        name: "description",
        content: "Manage all your purchase bills. Track totals and supplier payables.",
      },
    ],
  }),
  component: PurchasesRouteLayout,
});

const STATUS_LABEL: Record<PurchaseStatus, string> = {
  draft: "Draft",
  final: "Final",
  cancelled: "Cancelled",
};

const STATUS_BADGE: Record<PurchaseStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  final: "bg-primary/10 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
};

function PurchasesRouteLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/purchases") return <Outlet />;
  return <PurchasesPage />;
}

function PurchasesPage() {
  const navigate = useNavigate({ from: "/purchases" });
  const { q, status, from, to } = Route.useSearch();
  const { activeId, scopedBusinessId, businesses } = useBusinesses();
  const { purchases, hydrated, remove, cancel } = usePurchases(scopedBusinessId);
  const activeBusiness = businesses.find((b) => b.id === activeId);

  const [deleting, setDeleting] = useState<Purchase | null>(null);
  const [cancelling, setCancelling] = useState<Purchase | null>(null);

  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(to) : undefined;

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return purchases
      .filter((p) => {
        if (status !== "all" && p.status !== status) return false;
        const d = new Date(p.date).getTime();
        if (fromDate && d < fromDate.setHours(0, 0, 0, 0)) return false;
        if (toDate && d > toDate.setHours(23, 59, 59, 999)) return false;
        if (!term) return true;
        return (
          p.number.toLowerCase().includes(term) ||
          p.partyName.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [purchases, q, status, fromDate, toDate]);

  const totals = useMemo(() => {
    let total = 0;
    let count = 0;
    for (const p of purchases) {
      if (p.status === "cancelled") continue;
      total += p.total;
      count += 1;
    }
    return { total, count };
  }, [purchases]);

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
              <h1 className="mt-1 text-3xl font-bold tracking-tight">Purchases</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {hydrated
                  ? `${totals.count} active • ${formatCurrency(totals.total, currency)} billed`
                  : "Loading…"}
              </p>
            </div>
            <Button asChild size="lg" className="gap-2">
              <Link to="/purchases/new">
                <Plus className="h-4 w-4" />
                Add Purchase
              </Link>
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SummaryCard label="Total purchases" value={String(totals.count)} />
            <SummaryCard
              label="Total Purchase"
              value={formatCurrency(totals.total, currency)}
            />
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setSearch({ q: e.target.value })}
                placeholder="Search by purchase number or supplier…"
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
                    {f === "all" ? "All" : STATUS_LABEL[f as PurchaseStatus]}
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
          <EmptyState filtered={purchases.length > 0} />
        ) : (
          <PurchasesTable
            purchases={visible}
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
              This hides the purchase from your list. Records are kept for audit.
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
              Cancelled purchases stay visible but are excluded from payables and totals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep purchase</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel}>
              Cancel purchase
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
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

function PurchasesTable({
  purchases,
  currency,
  onDelete,
  onCancel,
}: {
  purchases: Purchase[];
  currency: string;
  onDelete: (p: Purchase) => void;
  onCancel: (p: Purchase) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="hidden grid-cols-[140px_110px_1.6fr_140px_220px] items-center gap-4 border-b border-border bg-muted/40 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
        <span>Purchase</span>
        <span>Date</span>
        <span>Supplier</span>
        <span className="text-right">Total</span>
        <span className="text-right">Status / Actions</span>
      </div>

      <ul className="divide-y divide-border">
        {purchases.map((p) => {
          const cancelled = p.status === "cancelled";
          return (
            <li
              key={p.id}
              className="group grid grid-cols-1 items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/30 sm:grid-cols-[140px_110px_1.6fr_140px_220px]"
            >
              <Link
                to="/purchases/$id"
                params={{ id: p.id }}
                className="font-mono text-sm font-semibold text-foreground hover:text-primary"
              >
                {p.number}
              </Link>
              <span className="text-sm text-muted-foreground">
                {format(new Date(p.date), "dd MMM yyyy")}
              </span>
              <Link
                to="/parties/$id"
                params={{ id: p.partyId }}
                className="truncate text-sm font-medium text-foreground hover:text-primary"
              >
                {p.partyName}
              </Link>
              <span
                className={cn(
                  "text-right font-semibold tabular-nums",
                  cancelled && "text-muted-foreground line-through",
                )}
              >
                {formatCurrency(p.total, currency)}
              </span>

              <div className="flex items-center justify-start gap-1.5 sm:justify-end">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
                    STATUS_BADGE[p.status],
                  )}
                >
                  {STATUS_LABEL[p.status]}
                </span>

                <div className="ml-1 flex items-center gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                  {p.status === "draft" && (
                    <Button
                      asChild
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      aria-label={`Edit ${p.number}`}
                    >
                      <Link to="/purchases/$id/edit" params={{ id: p.id }}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                  {!cancelled && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-warning hover:bg-warning/10"
                      onClick={() => onCancel(p)}
                      aria-label={`Cancel ${p.number}`}
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(p)}
                    aria-label={`Delete ${p.number}`}
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
        <ShoppingCart className="h-8 w-8" />
      </div>
      <h2 className="mt-6 text-xl font-semibold">
        {filtered ? "No purchases match your filters" : "No purchases found"}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {filtered
          ? "Try a different search term or clear the filters."
          : "Record your first purchase to track supplier bills and payables."}
      </p>
      <Button asChild size="lg" className="mt-6 gap-2">
        <Link to="/purchases/new">
          <Plus className="h-4 w-4" />
          Add Purchase
        </Link>
      </Button>
    </div>
  );
}
