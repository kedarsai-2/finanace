import {
  Outlet,
  createFileRoute,
  Link,
  useNavigate,
  useRouterState,
  type SearchSchemaInput,
} from "@tanstack/react-router";
import { z } from "zod";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Users,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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

import { useBusinesses } from "@/hooks/useBusinesses";
import { useParties, formatCurrency } from "@/hooks/useParties";
import { useInvoices } from "@/hooks/useInvoices";
import { usePurchases } from "@/hooks/usePurchases";
import { usePayments } from "@/hooks/usePayments";
import type { Party, PartyType } from "@/types/party";

const FILTERS = ["all", "customer", "supplier", "both"] as const;
type Filter = (typeof FILTERS)[number];

const searchSchema = z.object({
  q: z.string().catch("").default(""),
  type: z.enum(FILTERS).catch("all").default("all"),
});

export const Route = createFileRoute("/parties")({
  validateSearch: (
    search: Partial<z.infer<typeof searchSchema>> & SearchSchemaInput,
  ): z.infer<typeof searchSchema> => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Parties — Customers & Suppliers" },
      {
        name: "description",
        content:
          "Manage all your customers and suppliers. Track balances, receivables and payables in one place.",
      },
    ],
  }),
  component: PartiesRouteLayout,
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

function PartiesRouteLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/parties") return <Outlet />;
  return <PartiesPage />;
}

function PartiesPage() {
  const navigate = useNavigate({ from: "/parties" });
  const { q, type } = Route.useSearch();
  const { activeId, businesses } = useBusinesses();
  const { parties, hydrated, remove } = useParties(activeId);
  const activeBusiness = businesses.find((b) => b.id === activeId);
  const { allInvoices } = useInvoices(activeId);
  const { allPurchases } = usePurchases(activeId);
  const { payments } = usePayments(activeId);

  // Compute "last activity" per party (latest date across invoices, purchases, payments).
  const lastActivityByParty = useMemo(() => {
    const map = new Map<string, string>();
    const stamp = (pid: string, d?: string) => {
      if (!pid || !d) return;
      const cur = map.get(pid);
      if (!cur || cur < d) map.set(pid, d);
    };
    for (const i of allInvoices) if (!i.deleted) stamp(i.partyId, i.date);
    for (const p of allPurchases) if (!p.deleted) stamp(p.partyId, p.date);
    for (const pay of payments) stamp(pay.partyId, pay.date);
    return map;
  }, [allInvoices, allPurchases, payments]);

  const [deleting, setDeleting] = useState<Party | null>(null);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return parties.filter((p) => {
      if (type !== "all" && p.type !== type) return false;
      if (!term) return true;
      return p.name.toLowerCase().includes(term) || p.mobile.includes(term);
    });
  }, [parties, q, type]);

  const totals = useMemo(() => {
    let receivable = 0;
    let payable = 0;
    for (const p of parties) {
      if (p.balance > 0) receivable += p.balance;
      else if (p.balance < 0) payable += -p.balance;
    }
    return { receivable, payable, count: parties.length };
  }, [parties]);

  const setQuery = (next: string) =>
    navigate({ search: (prev: z.infer<typeof searchSchema>) => ({ ...prev, q: next }) });
  const setType = (next: Filter) =>
    navigate({ search: (prev: z.infer<typeof searchSchema>) => ({ ...prev, type: next }) });

  const confirmDelete = () => {
    if (!deleting) return;
    const name = deleting.name;
    remove(deleting.id);
    setDeleting(null);
    toast.success(`Deleted ${name}`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <header className="border-b border-border/60 bg-card/40 backdrop-blur">
        <div className="max-w-screen-2xl px-6 py-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {activeBusiness?.name ?? "Workspace"}
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">Parties</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {hydrated
                  ? `${totals.count} ${totals.count === 1 ? "party" : "parties"} • Customers, suppliers & balances`
                  : "Loading…"}
              </p>
            </div>
            <Button asChild size="lg" className="gap-2">
              <Link to="/parties/new" search={{ q: "", type: "all" }}>
                <Plus className="h-4 w-4" />
                Add Party
              </Link>
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryCard
              label="Total receivable"
              value={formatCurrency(totals.receivable)}
              tone="success"
              icon={<ArrowDownCircle className="h-4 w-4" />}
            />
            <SummaryCard
              label="Total payable"
              value={formatCurrency(totals.payable)}
              tone="destructive"
              icon={<ArrowUpCircle className="h-4 w-4" />}
            />
            <SummaryCard
              label="Net position"
              value={formatCurrency(totals.receivable - totals.payable)}
              tone={totals.receivable - totals.payable >= 0 ? "success" : "destructive"}
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or mobile…"
                className="h-11 pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-card p-1">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setType(f)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                    type === f
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f === "all" ? "All" : TYPE_LABEL[f as PartyType] + "s"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl px-6 py-8">
        {hydrated && visible.length === 0 ? (
          <EmptyState filtered={parties.length > 0} />
        ) : (
          <PartiesTable
            parties={visible}
            currency={activeBusiness?.currency ?? "INR"}
            onDelete={setDeleting}
            lastActivity={lastActivityByParty}
          />
        )}
      </main>

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the party and any linked balance records from this view.
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
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: "success" | "destructive";
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 flex items-center gap-1.5 text-2xl font-bold tabular-nums",
          tone === "success" ? "text-success" : "text-destructive",
        )}
      >
        {icon}
        {value}
      </p>
    </div>
  );
}

function PartiesTable({
  parties,
  currency,
  onDelete,
  lastActivity,
}: {
  parties: Party[];
  currency: string;
  onDelete: (p: Party) => void;
  lastActivity: Map<string, string>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="hidden grid-cols-[minmax(0,2fr)_110px_130px_180px_160px_100px] items-center gap-4 border-b border-border bg-muted/40 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:grid">
        <span>Party name</span>
        <span>Type</span>
        <span>Mobile</span>
        <span>Dates</span>
        <span className="text-right">Balance</span>
        <span className="text-right">Actions</span>
      </div>

      <ul className="divide-y divide-border">
        {parties.map((p) => {
          const receivable = p.balance > 0;
          const payable = p.balance < 0;
          const last = lastActivity.get(p.id);
          return (
            <li
              key={p.id}
              className="group grid grid-cols-1 items-start gap-3 px-5 py-4 transition-colors hover:bg-muted/30 md:grid-cols-[minmax(0,2fr)_110px_130px_180px_160px_100px] md:items-center"
            >
              <Link
                to="/parties/$id"
                params={{ id: p.id }}
                search={{ q: "", type: "all" }}
                className="flex min-w-0 items-center gap-3 text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-sm font-semibold text-primary-foreground">
                  {p.name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((s) => s[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground hover:text-primary">
                    {p.name}
                  </p>
                  {p.city && (
                    <p className="truncate text-xs text-muted-foreground">
                      {p.city}
                      {p.state ? `, ${p.state}` : ""}
                    </p>
                  )}
                </div>
              </Link>

              <span
                className={cn(
                  "inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-medium",
                  TYPE_BADGE[p.type],
                )}
              >
                {TYPE_LABEL[p.type]}
              </span>

<<<<<<< HEAD
              <span className="font-mono text-sm text-muted-foreground">{p.mobile || "—"}</span>

              <div className="text-xs text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground/80">Added:</span>{" "}
                  {p.createdAt ? format(new Date(p.createdAt), "dd MMM yyyy") : "—"}
                </p>
                <p className="mt-0.5">
                  <span className="font-medium text-foreground/80">Last:</span>{" "}
                  {last ? format(new Date(last), "dd MMM yyyy") : "No activity"}
                </p>
              </div>
=======
              <span className="font-mono text-sm text-muted-foreground">
                {p.mobile || "—"}
              </span>
>>>>>>> 77a25eb (Changes)

              <div className="text-xs text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground/80">Added:</span>{" "}
                  {p.createdAt ? format(new Date(p.createdAt), "dd MMM yyyy") : "—"}
                </p>
                <p className="mt-0.5">
                  <span className="font-medium text-foreground/80">Last:</span>{" "}
                  {last ? format(new Date(last), "dd MMM yyyy") : "No activity"}
                </p>
              </div>

              <div className="flex flex-col items-start sm:items-end">
                <span
                  className={cn(
                    "text-base font-bold tabular-nums",
                    receivable && "text-success",
                    payable && "text-destructive",
                    p.balance === 0 && "text-muted-foreground",
                  )}
                >
                  {formatCurrency(p.balance, currency)}
                </span>
                {p.balance !== 0 && (
                  <span
                    className={cn(
                      "mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                      receivable
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {receivable ? "Receivable" : "Payable"}
                  </span>
                )}
              </div>

              <div className="flex justify-start gap-1 md:justify-end md:opacity-100 md:transition-opacity">
                <Button
                  asChild
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  aria-label={`Edit ${p.name}`}
                >
                  <Link
                    to="/parties/$id/edit"
                    params={{ id: p.id }}
                    search={{ q: "", type: "all" }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onDelete(p)}
                  aria-label={`Delete ${p.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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
        <Users className="h-8 w-8" />
      </div>
      <h2 className="mt-6 text-xl font-semibold">
        {filtered ? "No parties match your filters" : "No parties found"}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {filtered
          ? "Try a different search term or clear the type filter."
          : "Add your first customer or supplier to start tracking balances."}
      </p>
      <Button asChild size="lg" className="mt-6 gap-2">
        <Link to="/parties/new" search={{ q: "", type: "all" }}>
          <Plus className="h-4 w-4" />
          Add Party
        </Link>
      </Button>
    </div>
  );
}
