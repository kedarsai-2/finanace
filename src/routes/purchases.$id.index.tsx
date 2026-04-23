import { useEffect, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  ArrowLeft,
  Ban,
  Lock,
  Pencil,
  Printer,
  ShoppingCart,
  CircleCheck,
  CircleDashed,
  Clock,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useBusinesses } from "@/hooks/useBusinesses";
import { useParties, formatCurrency } from "@/hooks/useParties";
import { usePurchases } from "@/hooks/usePurchases";
import { Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { lineMath } from "@/types/invoice";
import { canEditPurchase, type Purchase } from "@/types/purchase";

export const Route = createFileRoute("/purchases/$id/")({
  head: () => ({
    meta: [
      { title: "Purchase Details" },
      { name: "description", content: "View purchase header, items, tax breakdown, and activity timeline." },
    ],
  }),
  component: PurchaseDetailsPage,
});

const LIST_SEARCH = {
  q: "",
  status: "all" as const,
  from: "",
  to: "",
};

function PurchaseDetailsPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { businesses, activeId } = useBusinesses();
  const { allPurchases, cancel, remove, ensureLines, convertToReturn } = usePurchases(activeId);
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

  if (!purchase) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-24 text-center">
        <ShoppingCart className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">Purchase not found</h1>
        <p className="text-sm text-muted-foreground">
          It may have been deleted, or the link is incorrect.
        </p>
        <Button asChild variant="outline">
          <Link to="/purchases" search={LIST_SEARCH}>
            Back to Purchases
          </Link>
        </Button>
      </div>
    );
  }

  const editable = canEditPurchase(purchase);
  const currency = business?.currency ?? "INR";

  const handleCancel = () => {
    cancel(purchase.id);
    toast.success(`Purchase ${purchase.number} cancelled`);
  };

  const handleDelete = () => {
    remove(purchase.id);
    toast.success(`Purchase ${purchase.number} deleted`);
    navigate({ to: "/purchases", search: LIST_SEARCH });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background pb-24">
      {/* Top bar */}
      <header className="sticky top-16 z-10 border-b border-border/60 bg-background/85 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button asChild size="icon" variant="ghost" className="h-9 w-9">
              <Link to="/purchases" search={LIST_SEARCH} aria-label="Back">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {business?.name ?? "Workspace"}
              </p>
              <h1 className="font-mono text-xl font-bold tracking-tight sm:text-2xl">
                {purchase.number}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" className="gap-2">
              <Link to="/purchases/$id/print" params={{ id: purchase.id }}>
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Print / PDF</span>
              </Link>
            </Button>
            {purchase.status !== "cancelled" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="gap-2 text-destructive">
                    <Ban className="h-4 w-4" />
                    <span className="hidden sm:inline">Cancel</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel this purchase?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cancelling {purchase.number} marks it void. It stays in records
                      for audit but cannot be edited again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Cancel purchase
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {editable ? (
              <Button asChild className="gap-2">
                <Link to="/purchases/$id/edit" params={{ id: purchase.id }}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Link>
              </Button>
            ) : (
              <Button disabled className="gap-2">
                <Lock className="h-4 w-4" />
                Locked
              </Button>
            )}
            {purchase.status === "final" && purchase.kind !== "return" && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={async () => {
                  const ret = await convertToReturn(purchase.id);
                  if (ret) {
                    toast.success(`Return ${ret.number} created`);
                    navigate({ to: "/purchase-returns/$id", params: { id: ret.id } });
                  }
                }}
              >
                <Undo2 className="h-4 w-4" />
                <span className="hidden sm:inline">Return</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[1fr_320px]">
        {/* Main column */}
        <div className="space-y-6">
          {/* Header card */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Purchase
                </p>
                <p className="mt-1 font-mono text-2xl font-bold tracking-tight">
                  {purchase.number}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Dated {format(new Date(purchase.date), "dd MMM yyyy")}
                  {purchase.dueDate
                    ? ` • Due ${format(new Date(purchase.dueDate), "dd MMM yyyy")}`
                    : ""}
                </p>
              </div>
              <StatusBadge status={purchase.status} />
            </div>

            <Separator className="my-5" />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Supplier
                </p>
                <p className="mt-1 text-base font-semibold">
                  {purchase.partyName}
                </p>
                {party && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {party.mobile}
                    {party.state ? ` • ${party.state}` : ""}
                  </p>
                )}
                {party?.gstNumber && (
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    GSTIN: {party.gstNumber}
                  </p>
                )}
              </div>
              <div className="sm:text-right">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Billed to
                </p>
                <p className="mt-1 text-base font-semibold">
                  {business?.name ?? "—"}
                </p>
                {business?.state && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {business.state}
                  </p>
                )}
                {business?.gstNumber && (
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    GSTIN: {business.gstNumber}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Items */}
          <section className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-base font-semibold">Items</h2>
              <span className="text-xs text-muted-foreground">
                {purchase.lines.length} {purchase.lines.length === 1 ? "line" : "lines"}
              </span>
            </div>
            <Separator />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-2 text-left">Item</th>
                    <th className="px-3 py-2 text-left">Unit</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Unit Price</th>
                    <th className="px-3 py-2 text-right">Disc.</th>
                    <th className="px-6 py-2 text-right">Total Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {purchase.lines.map((line) => {
                    const m = lineMath(line);
                    return (
                      <tr key={line.id}>
                        <td className="px-6 py-3">
                          <p className="font-medium">{line.name}</p>
                        </td>
                        <td className="px-3 py-3 text-left text-muted-foreground">
                          {line.unit || "—"}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          {line.qty}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          {formatCurrency(line.rate, currency)}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                          {line.discountValue > 0
                            ? line.discountKind === "percent"
                              ? `${line.discountValue}%`
                              : formatCurrency(line.discountValue, currency)
                            : "—"}
                        </td>
                        <td className="px-6 py-3 text-right font-semibold tabular-nums">
                          {formatCurrency(m.total, currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Totals */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-base font-semibold">Totals</h2>
            <Separator className="my-4" />
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <Row label="Subtotal" value={formatCurrency(purchase.subtotal, currency)} />
              {purchase.itemDiscountTotal > 0 && (
                <Row
                  label="Line discounts"
                  value={`− ${formatCurrency(purchase.itemDiscountTotal, currency)}`}
                  muted
                />
              )}
              {purchase.overallDiscountAmount > 0 && (
                <Row
                  label="Overall discount"
                  value={`− ${formatCurrency(purchase.overallDiscountAmount, currency)}`}
                  muted
                />
              )}
            </dl>
            <Separator className="my-4" />
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold">Grand total</span>
              <span className="text-2xl font-bold tabular-nums">
                {formatCurrency(purchase.total, currency)}
              </span>
            </div>
          </section>

          {/* Notes & terms */}
          {(purchase.notes || purchase.terms) && (
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {purchase.notes && (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Notes
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{purchase.notes}</p>
                </div>
              )}
              {purchase.terms && (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Terms & conditions
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{purchase.terms}</p>
                </div>
              )}
            </section>
          )}

          {/* Danger zone */}
          <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 print:hidden">
            <h3 className="text-sm font-semibold text-destructive">Danger zone</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Delete moves this purchase out of every list. Records remain for audit.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="mt-3 text-destructive">
                  Delete purchase
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {purchase.number}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This soft-deletes the purchase. It will disappear from lists and
                    totals, but is retained for audit.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </section>
        </div>

        {/* Side column */}
        <aside className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold">Summary</h3>
            <Separator className="my-3" />
            <dl className="space-y-2 text-sm">
              <Row label="Total" value={formatCurrency(purchase.total, currency)} emphasis />
              <Row label="Tax" value={formatCurrency(purchase.taxTotal, currency)} muted />
              <Row label="Items" value={String(purchase.lines.length)} muted />
            </dl>
            <p className="mt-4 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Supplier payments will arrive in a future update.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold">Activity</h3>
            <Separator className="my-3" />
            <Timeline purchase={purchase} />
          </section>
        </aside>
      </div>
    </div>
  );
}

// ----------------------- Sub components -------------------------------------

function Row({
  label,
  value,
  muted,
  emphasis,
}: {
  label: string;
  value: string;
  muted?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={cn("text-muted-foreground", emphasis && "font-semibold text-foreground")}>
        {label}
      </dt>
      <dd
        className={cn(
          "tabular-nums",
          muted && "text-muted-foreground",
          emphasis && "text-base font-bold",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function StatusBadge({ status }: { status: Purchase["status"] }) {
  const map = {
    draft: { label: "Draft", variant: "secondary" as const, icon: CircleDashed },
    final: { label: "Final", variant: "default" as const, icon: CircleCheck },
    cancelled: { label: "Cancelled", variant: "destructive" as const, icon: Ban },
  };
  const cfg = map[status];
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

interface TimelineEvent {
  id: string;
  at: string;
  title: string;
  description?: string;
  icon: typeof Clock;
  tone: "default" | "success" | "destructive";
}

function Timeline({ purchase }: { purchase: Purchase }) {
  const events = useMemo<TimelineEvent[]>(() => {
    const list: TimelineEvent[] = [
      {
        id: "created",
        at: purchase.date,
        title: "Purchase created",
        description: `Draft ${purchase.number} created for ${purchase.partyName}`,
        icon: Receipt,
        tone: "default",
      },
    ];
    if (purchase.finalizedAt) {
      list.push({
        id: "finalized",
        at: purchase.finalizedAt,
        title: "Finalised",
        description: "Locked for editing after 24 hours",
        icon: CircleCheck,
        tone: "success",
      });
    }
    if (purchase.status === "cancelled") {
      list.push({
        id: "cancelled",
        at: purchase.finalizedAt ?? purchase.date,
        title: "Cancelled",
        description: "Purchase marked as void",
        icon: Ban,
        tone: "destructive",
      });
    }
    return list.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }, [purchase]);

  return (
    <ol className="relative space-y-4 border-l border-border pl-4">
      {events.map((e) => {
        const Icon = e.icon;
        return (
          <li key={e.id} className="relative">
            <span
              className={cn(
                "absolute -left-[22px] flex h-4 w-4 items-center justify-center rounded-full border border-border bg-background",
                e.tone === "success" && "border-primary/40 bg-primary/15 text-primary",
                e.tone === "destructive" && "border-destructive/40 bg-destructive/15 text-destructive",
              )}
            >
              <Icon className="h-2.5 w-2.5" />
            </span>
            <p className="text-sm font-medium leading-tight">{e.title}</p>
            {e.description && (
              <p className="mt-0.5 text-xs text-muted-foreground">{e.description}</p>
            )}
            <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
              {format(new Date(e.at), "dd MMM yyyy")}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
