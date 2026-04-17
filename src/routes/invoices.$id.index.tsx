import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  ArrowLeft,
  Ban,
  Copy,
  FileText,
  IndianRupee,
  Lock,
  MessageCircle,
  Pencil,
  Plus,
  Printer,
  Receipt,
  Share2,
  CircleCheck,
  CircleAlert,
  CircleDashed,
  Clock,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useBusinesses } from "@/hooks/useBusinesses";
import { useParties, formatCurrency } from "@/hooks/useParties";
import { useInvoices } from "@/hooks/useInvoices";
import { usePayments } from "@/hooks/usePayments";
import { RecordPaymentDialog } from "@/components/payment/RecordPaymentDialog";
import { cn } from "@/lib/utils";
import {
  canEditInvoice,
  lineMath,
  paymentStatusOf,
  type Invoice,
} from "@/types/invoice";
import { PAYMENT_MODE_LABEL, type Payment } from "@/types/payment";
import {
  copyShareText,
  invoicePrintUrl,
  shareInvoiceOnWhatsApp,
} from "@/lib/share";

export const Route = createFileRoute("/invoices/$id")({
  head: () => ({
    meta: [
      { title: "Invoice Details" },
      { name: "description", content: "View invoice header, items, tax, payments, and activity timeline." },
    ],
  }),
  component: InvoiceDetailsPage,
});

const LIST_SEARCH = {
  q: "",
  status: "all" as const,
  payment: "all" as const,
  from: "",
  to: "",
};

function InvoiceDetailsPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { businesses } = useBusinesses();
  const { allInvoices, cancel, remove } = useInvoices();
  const invoice = allInvoices.find((i) => i.id === id);
  const business = businesses.find((b) => b.id === invoice?.businessId);
  const { parties } = useParties(invoice?.businessId);
  const party = parties.find((p) => p.id === invoice?.partyId);
  const { payments } = usePayments(invoice?.businessId);
  const [payOpen, setPayOpen] = useState(false);

  const invoicePayments = useMemo(
    () =>
      invoice
        ? payments
            .filter((p) =>
              p.allocations.some((a) => a.docId === invoice.id),
            )
            .sort(
              (a, b) =>
                new Date(a.date).getTime() - new Date(b.date).getTime(),
            )
        : [],
    [payments, invoice],
  );

  if (!invoice) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-24 text-center">
        <FileText className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">Invoice not found</h1>
        <p className="text-sm text-muted-foreground">
          It may have been deleted, or the link is incorrect.
        </p>
        <Button asChild variant="outline">
          <Link to="/invoices" search={LIST_SEARCH}>
            Back to Invoices
          </Link>
        </Button>
      </div>
    );
  }

  const intraState =
    !!invoice.businessState &&
    !!invoice.partyState &&
    invoice.businessState === invoice.partyState;
  const balance = Math.max(0, invoice.total - invoice.paidAmount);
  const payStatus = paymentStatusOf(invoice);
  const editable = canEditInvoice(invoice);
  const currency = business?.currency ?? "INR";

  const handleCancel = () => {
    cancel(invoice.id);
    toast.success(`Invoice ${invoice.number} cancelled`);
  };

  const handleDelete = () => {
    remove(invoice.id);
    toast.success(`Invoice ${invoice.number} deleted`);
    navigate({ to: "/invoices", search: LIST_SEARCH });
  };

  const shareArgs = {
    partyName: invoice.partyName,
    invoiceNumber: invoice.number,
    pdfUrl: invoicePrintUrl(invoice.id),
    summaryLine: `Total ${formatCurrency(invoice.total, currency)} • Balance ${formatCurrency(balance, currency)}`,
    phone: party?.mobile,
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background pb-24">
      {/* Top bar */}
      <header className="sticky top-16 z-10 border-b border-border/60 bg-background/85 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button asChild size="icon" variant="ghost" className="h-9 w-9">
              <Link to="/invoices" search={LIST_SEARCH} aria-label="Back">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {business?.name ?? "Workspace"}
              </p>
              <h1 className="font-mono text-xl font-bold tracking-tight sm:text-2xl">
                {invoice.number}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => shareInvoiceOnWhatsApp(shareArgs)}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Send on WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => copyShareText(shareArgs)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy message + link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    void navigator.clipboard?.writeText(shareArgs.pdfUrl);
                    toast.success("PDF link copied");
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy PDF link only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button asChild variant="outline" className="gap-2">
              <Link to="/invoices/$id/print" params={{ id: invoice.id }}>
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Print / PDF</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => setPayOpen(true)}
              disabled={invoice.status === "cancelled" || balance <= 0}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Record Payment</span>
            </Button>
            {invoice.status !== "cancelled" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="gap-2 text-destructive">
                    <Ban className="h-4 w-4" />
                    <span className="hidden sm:inline">Cancel</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel this invoice?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cancelling {invoice.number} marks it as void. It stays in
                      records for audit but cannot be edited again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Cancel invoice
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {editable ? (
              <Button asChild className="gap-2">
                <Link to="/invoices/$id/edit" params={{ id: invoice.id }}>
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
                  Invoice
                </p>
                <p className="mt-1 font-mono text-2xl font-bold tracking-tight">
                  {invoice.number}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Issued {format(new Date(invoice.date), "dd MMM yyyy")}
                  {invoice.dueDate
                    ? ` • Due ${format(new Date(invoice.dueDate), "dd MMM yyyy")}`
                    : ""}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={invoice.status} />
                <PaymentBadge status={payStatus} />
              </div>
            </div>

            <Separator className="my-5" />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Billed to
                </p>
                <p className="mt-1 text-base font-semibold">
                  {invoice.partyName}
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
                  From
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
                {invoice.lines.length} {invoice.lines.length === 1 ? "line" : "lines"}
              </span>
            </div>
            <Separator />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-2 text-left">Item</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Rate</th>
                    <th className="px-3 py-2 text-right">Disc.</th>
                    <th className="px-3 py-2 text-right">Tax %</th>
                    <th className="px-6 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoice.lines.map((line) => {
                    const m = lineMath(line);
                    return (
                      <tr key={line.id}>
                        <td className="px-6 py-3">
                          <p className="font-medium">{line.name}</p>
                          {line.unit && (
                            <p className="text-xs text-muted-foreground">
                              {line.unit}
                            </p>
                          )}
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
                        <td className="px-3 py-3 text-right tabular-nums">
                          {line.taxPercent}%
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

          {/* Tax + totals */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-base font-semibold">Tax breakdown</h2>
            <p className="text-xs text-muted-foreground">
              {intraState
                ? "Same-state invoice — CGST + SGST applied."
                : "Inter-state invoice — IGST applied."}
            </p>
            <Separator className="my-4" />
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <Row label="Subtotal" value={formatCurrency(invoice.subtotal, currency)} />
              {invoice.itemDiscountTotal > 0 && (
                <Row
                  label="Line discounts"
                  value={`− ${formatCurrency(invoice.itemDiscountTotal, currency)}`}
                  muted
                />
              )}
              {invoice.overallDiscountAmount > 0 && (
                <Row
                  label="Overall discount"
                  value={`− ${formatCurrency(invoice.overallDiscountAmount, currency)}`}
                  muted
                />
              )}
              <Row
                label="Taxable value"
                value={formatCurrency(invoice.taxableValue, currency)}
              />
              {intraState ? (
                <>
                  <Row label="CGST" value={formatCurrency(invoice.cgst, currency)} muted />
                  <Row label="SGST" value={formatCurrency(invoice.sgst, currency)} muted />
                </>
              ) : (
                <Row label="IGST" value={formatCurrency(invoice.igst, currency)} muted />
              )}
              <Row label="Tax total" value={formatCurrency(invoice.taxTotal, currency)} />
            </dl>
            <Separator className="my-4" />
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold">Grand total</span>
              <span className="text-2xl font-bold tabular-nums">
                {formatCurrency(invoice.total, currency)}
              </span>
            </div>
          </section>

          {/* Notes & terms */}
          {(invoice.notes || invoice.terms) && (
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {invoice.notes && (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Notes
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Terms & conditions
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{invoice.terms}</p>
                </div>
              )}
            </section>
          )}

          {/* Danger zone */}
          <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 print:hidden">
            <h3 className="text-sm font-semibold text-destructive">Danger zone</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Delete moves this invoice out of every list. Records remain for audit.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="mt-3 text-destructive">
                  Delete invoice
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {invoice.number}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This soft-deletes the invoice. It will disappear from lists
                    and totals, but is retained for audit.
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
          {/* Payment summary */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold">Payment summary</h3>
            <Separator className="my-3" />
            <dl className="space-y-2 text-sm">
              <Row label="Total" value={formatCurrency(invoice.total, currency)} />
              <Row
                label="Paid"
                value={formatCurrency(invoice.paidAmount, currency)}
                tone="success"
              />
              <Row
                label="Balance"
                value={formatCurrency(balance, currency)}
                tone={balance > 0 ? "warning" : "success"}
                emphasis
              />
            </dl>
            <Button
              className="mt-4 w-full gap-2"
              onClick={() => setPayOpen(true)}
              disabled={invoice.status === "cancelled" || balance <= 0}
            >
              <IndianRupee className="h-4 w-4" />
              Record payment
            </Button>
          </section>

          {/* Activity timeline */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold">Activity</h3>
            <Separator className="my-3" />
            <Timeline invoice={invoice} payments={invoicePayments} currency={currency} />
          </section>
        </aside>
      </div>

      <RecordPaymentDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        partyId={invoice.partyId}
        partyName={invoice.partyName}
        businessId={invoice.businessId}
        currency={currency}
        focusInvoiceId={invoice.id}
      />
    </div>
  );
}

// ----------------------- Sub components -------------------------------------

function Row({
  label,
  value,
  muted,
  emphasis,
  tone,
}: {
  label: string;
  value: string;
  muted?: boolean;
  emphasis?: boolean;
  tone?: "success" | "warning";
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
          tone === "success" && "text-foreground",
          tone === "warning" && "text-destructive",
          emphasis && "text-base font-bold",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function StatusBadge({ status }: { status: Invoice["status"] }) {
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

function PaymentBadge({ status }: { status: "paid" | "partial" | "unpaid" }) {
  const map = {
    paid: { label: "Paid", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", icon: CircleCheck },
    partial: { label: "Partial", className: "bg-amber-500/15 text-amber-700 dark:text-amber-300", icon: CircleAlert },
    unpaid: { label: "Unpaid", className: "bg-muted text-muted-foreground", icon: CircleDashed },
  };
  const cfg = map[status];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-transparent px-2.5 py-0.5 text-xs font-semibold",
        cfg.className,
      )}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

interface TimelineEvent {
  id: string;
  at: string; // ISO
  title: string;
  description?: string;
  icon: typeof Clock;
  tone: "default" | "success" | "warning" | "destructive";
}

function Timeline({
  invoice,
  payments,
  currency,
}: {
  invoice: Invoice;
  payments: Payment[];
  currency: string;
}) {
  const events = useMemo<TimelineEvent[]>(() => {
    const list: TimelineEvent[] = [
      {
        id: "created",
        at: invoice.date,
        title: "Invoice created",
        description: `Draft ${invoice.number} created for ${invoice.partyName}`,
        icon: Receipt,
        tone: "default",
      },
    ];
    if (invoice.finalizedAt) {
      list.push({
        id: "finalized",
        at: invoice.finalizedAt,
        title: "Finalised",
        description: "Locked for editing after 24 hours",
        icon: CircleCheck,
        tone: "success",
      });
    }
    for (const p of payments) {
      const allocated =
        p.allocations.find((a) => a.docId === invoice.id)?.amount ?? 0;
      list.push({
        id: `payment-${p.id}`,
        at: p.date,
        title: `Payment recorded — ${formatCurrency(allocated, currency)}`,
        description: `${PAYMENT_MODE_LABEL[p.mode]}${
          p.account ? ` • ${p.account}` : ""
        }${p.reference ? ` • Ref ${p.reference}` : ""}`,
        icon: IndianRupee,
        tone: "success",
      });
    }
    if (invoice.status === "cancelled") {
      list.push({
        id: "cancelled",
        at: invoice.finalizedAt ?? invoice.date,
        title: "Cancelled",
        description: "Invoice marked as void",
        icon: Ban,
        tone: "destructive",
      });
    }
    return list.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }, [invoice, payments, currency]);

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
                e.tone === "warning" && "border-destructive/40 bg-destructive/10 text-destructive",
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
