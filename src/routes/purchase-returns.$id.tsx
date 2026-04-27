import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { format } from "date-fns";
import { ArrowLeft, Undo2, Ban, Lock, Pencil, Trash2 } from "lucide-react";
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
import { usePurchases } from "@/hooks/usePurchases";
import { useParties, formatCurrency } from "@/hooks/useParties";
import { lineMath } from "@/types/invoice";
import { canEditPurchase } from "@/types/purchase";
import { verifyActionPassword } from "@/lib/actionPassword";

export const Route = createFileRoute("/purchase-returns/$id")({
  head: () => ({
    meta: [
      { title: "Purchase Return Details" },
      { name: "description", content: "View purchase return items, totals and status." },
    ],
  }),
  component: PurchaseReturnDetailPage,
});

function PurchaseReturnDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { businesses, activeId } = useBusinesses();
  const { allPurchases, cancel, remove, ensureLines } = usePurchases(activeId);
  const ret = allPurchases.find((p) => p.id === id && p.kind === "return");
  const business = businesses.find((b) => b.id === ret?.businessId);
  const { parties } = useParties(ret?.businessId);
  const party = parties.find((p) => p.id === ret?.partyId);
  const source = ret?.sourcePurchaseId
    ? allPurchases.find((p) => p.id === ret.sourcePurchaseId)
    : null;

  useEffect(() => {
    if (!ret) return;
    if (ret.lines.length === 0) void ensureLines(ret.id).catch(() => {});
  }, [ret, ensureLines]);

  if (!ret) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-24 text-center">
        <Undo2 className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">Return not found</h1>
        <Button asChild variant="outline">
          <Link to="/purchase-returns">Back to Returns</Link>
        </Button>
      </div>
    );
  }

  const editable = canEditPurchase(ret);
  const currency = business?.currency ?? "INR";

  const handleCancel = async () => {
    try {
      await cancel(ret.id);
      toast.success(`Return ${ret.number} cancelled`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not cancel return";
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    try {
      await remove(ret.id);
      toast.success(`Return ${ret.number} deleted`);
      navigate({ to: "/purchase-returns" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not delete return";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background pb-24">
      <header className="sticky top-16 z-10 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button asChild size="icon" variant="ghost" className="h-9 w-9">
              <Link to="/purchase-returns" aria-label="Back">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Purchase Return · {business?.name ?? "Workspace"}
              </p>
              <h1 className="font-mono text-xl font-bold tracking-tight sm:text-2xl">
                {ret.number}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {ret.status !== "cancelled" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="gap-2 text-destructive" title="Cancel">
                    <Ban className="h-4 w-4" />
                    <span className="hidden sm:inline">Cancel</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel this return?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cancelling reverses the supplier debit on the ledger.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        if (!verifyActionPassword()) return;
                        void handleCancel();
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Cancel return
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {editable ? (
              <Button asChild className="gap-2">
                <Link
                  to="/purchases/$id/edit"
                  params={{ id: ret.id }}
                  onClick={(e) => {
                    if (!verifyActionPassword()) e.preventDefault();
                  }}
                >
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
                Purchase Return
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-tight">{ret.number}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Dated {format(new Date(ret.date), "dd MMM yyyy")}
              </p>
              {source && (
                <p className="mt-2 text-sm">
                  Against purchase{" "}
                  <Link
                    to="/purchases/$id"
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
                ret.status === "final"
                  ? "inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary"
                  : ret.status === "cancelled"
                    ? "inline-flex rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-destructive"
                    : "inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              }
            >
              {ret.status}
            </span>
          </div>

          <Separator className="my-5" />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Returned to
              </p>
              <p className="mt-1 text-base font-semibold">{ret.partyName}</p>
              {party?.mobile && (
                <p className="mt-0.5 text-sm text-muted-foreground">{party.mobile}</p>
              )}
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Returned by
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
                {ret.lines.map((line) => {
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
            <span className="text-sm font-semibold">Return total</span>
            <span className="text-2xl font-bold tabular-nums text-success">
              + {formatCurrency(ret.total, currency)}
            </span>
          </div>
        </section>

        <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
          <h3 className="text-sm font-semibold text-destructive">Danger zone</h3>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="mt-3 gap-1.5 text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
                Delete return
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {ret.number}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This soft-deletes the return and reverses the ledger entry.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (!verifyActionPassword()) return;
                    void handleDelete();
                  }}
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
