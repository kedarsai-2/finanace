import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { format } from "date-fns";
import { ArrowLeft, FileMinus, Ban, Lock, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { useInvoices } from "@/hooks/useInvoices";
import { useParties, formatCurrency } from "@/hooks/useParties";
import { canEditInvoice, lineMath } from "@/types/invoice";

export const Route = createFileRoute("/credit-notes/$id")({
  head: () => ({
    meta: [
      { title: "Credit Note Details" },
      { name: "description", content: "View credit note items, totals and status." },
    ],
  }),
  component: CreditNoteDetailPage,
});

function CreditNoteDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { businesses, activeId } = useBusinesses();
  const { allInvoices, hydrated, cancel, remove, ensureLines } = useInvoices(activeId);
  const cn = allInvoices.find((i) => i.id === id && i.kind === "credit-note");
  const business = businesses.find((b) => b.id === cn?.businessId);
  const { parties } = useParties(cn?.businessId);
  const party = parties.find((p) => p.id === cn?.partyId);
  const source = cn?.sourceInvoiceId ? allInvoices.find((i) => i.id === cn.sourceInvoiceId) : null;

  useEffect(() => {
    if (!cn) return;
    if (cn.lines.length === 0) void ensureLines(cn.id).catch(() => {});
  }, [cn, ensureLines]);

  if (!hydrated) {
    return <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (!cn) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-24 text-center">
        <FileMinus className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">Credit note not found</h1>
        <Button asChild variant="outline">
          <Link to="/credit-notes">Back to Credit Notes</Link>
        </Button>
      </div>
    );
  }

  const editable = canEditInvoice(cn);
  const currency = business?.currency ?? "INR";

  const handleCancel = async () => {
    try {
      await cancel(cn.id);
      toast.success(`Credit note ${cn.number} cancelled`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not cancel credit note";
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    try {
      await remove(cn.id);
      toast.success(`Credit note ${cn.number} deleted`);
      navigate({ to: "/credit-notes" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not delete credit note";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background pb-24">
      <header className="sticky top-16 z-10 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button asChild size="icon" variant="ghost" className="h-9 w-9">
              <Link to="/credit-notes" aria-label="Back">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Credit Note · {business?.name ?? "Workspace"}
              </p>
              <h1 className="font-mono text-xl font-bold tracking-tight sm:text-2xl">
                {cn.number}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {cn.status !== "cancelled" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="gap-2 text-destructive">
                    <Ban className="h-4 w-4" />
                    <span className="hidden sm:inline">Cancel</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel this credit note?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cancelling reverses the ledger credit on the party.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Cancel credit note
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {editable ? (
              <Button asChild className="gap-2">
                <Link to="/invoices/$id/edit" params={{ id: cn.id }}>
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

      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Credit Note
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-tight">{cn.number}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Issued {format(new Date(cn.date), "dd MMM yyyy")}
              </p>
              {source && (
                <p className="mt-2 text-sm">
                  Against invoice{" "}
                  <Link
                    to="/invoices/$id"
                    params={{ id: source.id }}
                    className="font-mono font-semibold text-primary hover:underline"
                  >
                    {source.number}
                  </Link>
                </p>
              )}
            </div>
            <span
              className={
                cn.status === "final"
                  ? "inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary"
                  : cn.status === "cancelled"
                    ? "inline-flex rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-destructive"
                    : "inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              }
            >
              {cn.status}
            </span>
          </div>

          <Separator className="my-5" />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Credited to
              </p>
              <p className="mt-1 text-base font-semibold">{cn.partyName}</p>
              {party?.mobile && (
                <p className="mt-0.5 text-sm text-muted-foreground">{party.mobile}</p>
              )}
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                From
              </p>
              <p className="mt-1 text-base font-semibold">{business?.name ?? "—"}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="px-6 py-4">
            <h2 className="text-base font-semibold">Items</h2>
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
                  <th className="px-6 py-2 text-right">Total Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cn.lines.map((line) => {
                  const m = lineMath(line);
                  return (
                    <tr key={line.id}>
                      <td className="px-6 py-3 font-medium">{line.name}</td>
                      <td className="px-3 py-3 text-muted-foreground">{line.unit || "—"}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{line.qty}</td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {formatCurrency(line.rate, currency)}
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
          <Separator />
          <div className="flex items-baseline justify-between px-6 py-4">
            <span className="text-sm font-semibold">Credit total</span>
            <span className="text-2xl font-bold tabular-nums text-destructive">
              − {formatCurrency(cn.total, currency)}
            </span>
          </div>
        </section>

        <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
          <h3 className="text-sm font-semibold text-destructive">Danger zone</h3>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="mt-3 gap-1.5 text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
                Delete credit note
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {cn.number}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This soft-deletes the credit note and reverses its ledger effect.
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
    </div>
  );
}
