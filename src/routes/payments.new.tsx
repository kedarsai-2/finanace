import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarIcon,
  Wallet,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { useBusinesses } from "@/hooks/useBusinesses";
import { useAccounts } from "@/hooks/useAccounts";
import { usePayments } from "@/hooks/usePayments";
import { useInvoices } from "@/hooks/useInvoices";
import { usePurchases } from "@/hooks/usePurchases";
import { useParties, formatCurrency } from "@/hooks/useParties";
import { ACCOUNT_TYPE_LABEL } from "@/types/account";
import {
  PAYMENT_MODE_LABEL,
  type Payment,
  type PaymentAllocation,
  type PaymentDirection,
} from "@/types/payment";
import type { Invoice } from "@/types/invoice";
import type { Purchase } from "@/types/purchase";

export const Route = createFileRoute("/payments/new")({
  head: () => ({ meta: [{ title: "Record Payment — QOBOX" }] }),
  component: NewPaymentPage,
});

interface AllocRow {
  docId: string;
  docNumber: string;
  date: string;
  outstanding: number;
  selected: boolean;
  amount: number;
  manuallyEdited: boolean;
}

function NewPaymentPage() {
  const navigate = useNavigate();
  const { activeId, businesses } = useBusinesses();
  const business = businesses.find((b) => b.id === activeId);
  const currency = business?.currency ?? "INR";

  const { parties } = useParties(activeId);
  const { accounts, hydrated: accountsHydrated } = useAccounts(activeId, []);
  const safeAccounts = useMemo(() => accounts.filter((a) => !!a.id), [accounts]);
  const { invoices, upsert: upsertInvoice } = useInvoices(activeId);
  const { purchases, upsert: upsertPurchase } = usePurchases(activeId);
  const { create: createPayment } = usePayments(activeId);

  const [direction, setDirection] = useState<PaymentDirection>("in");
  const [partyId, setPartyId] = useState<string>("");
  const [accountId, setAccountId] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState<Date>(new Date());
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [autoAllocate, setAutoAllocate] = useState(true);
  const [rows, setRows] = useState<AllocRow[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const firstAccountId = safeAccounts[0]?.id ?? "";
  useEffect(() => {
    if (!accountsHydrated || accountId) return;
    if (firstAccountId) setAccountId(firstAccountId);
  }, [accountsHydrated, firstAccountId, accountId]);

  const selectedAccount = safeAccounts.find((a) => a.id === accountId);
  const mode: import("@/types/payment").PaymentMode =
    selectedAccount?.type ?? "bank";

  // All parties are eligible — direction is now derived from doc allocations only.
  const filteredParties = parties;

  // Open documents for the selected party.
  const openDocs = useMemo(() => {
    if (!partyId) return [];
    if (direction === "in") {
      return invoices
        .filter(
          (i): i is Invoice =>
            i.partyId === partyId &&
            i.status !== "cancelled" &&
            i.total - i.paidAmount > 0.01,
        )
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((i) => ({
          docId: i.id,
          docNumber: i.number,
          date: i.date,
          outstanding: i.total - i.paidAmount,
        }));
    }
    return purchases
      .filter(
        (p): p is Purchase =>
          p.partyId === partyId &&
          p.status !== "cancelled" &&
          p.total - p.paidAmount > 0.01,
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((p) => ({
        docId: p.id,
        docNumber: p.number,
        date: p.date,
        outstanding: p.total - p.paidAmount,
      }));
  }, [direction, partyId, invoices, purchases]);

  const totalOutstanding = openDocs.reduce((s, d) => s + d.outstanding, 0);

  // Reset rows when openDocs changes (party / direction switch).
  useEffect(() => {
    setRows(
      openDocs.map((d) => ({
        ...d,
        selected: true,
        amount: 0,
        manuallyEdited: false,
      })),
    );
    setAutoAllocate(true);
  }, [openDocs]);

  // Auto-allocate amount oldest-first across selected rows.
  useEffect(() => {
    if (!autoAllocate) return;
    setRows((prev) => {
      let remaining = amount;
      const manualLocked = prev.map((r) => {
        if (r.selected && r.manuallyEdited) {
          const capped = Math.min(Math.max(0, r.amount), r.outstanding);
          remaining -= capped;
          return { ...r, amount: capped };
        }
        return r;
      });
      remaining = Math.max(0, remaining);
      return manualLocked.map((r) => {
        if (!r.selected || r.manuallyEdited) {
          return r.selected ? r : { ...r, amount: 0 };
        }
        const allotted = Math.min(remaining, r.outstanding);
        remaining -= allotted;
        return { ...r, amount: allotted };
      });
    });
  }, [amount, autoAllocate]);

  const allocatedTotal = rows
    .filter((r) => r.selected)
    .reduce((s, r) => s + r.amount, 0);
  const unallocated = Math.max(0, amount - allocatedTotal);
  const overAllocated = allocatedTotal - amount > 0.01;

  const toggleRow = (docId: string, selected: boolean) => {
    setAutoAllocate(true);
    setRows((prev) =>
      prev.map((r) =>
        r.docId === docId
          ? { ...r, selected, amount: selected ? r.amount : 0, manuallyEdited: false }
          : r,
      ),
    );
  };

  const editRow = (docId: string, value: number) => {
    setAutoAllocate(false);
    setRows((prev) =>
      prev.map((r) =>
        r.docId === docId
          ? {
              ...r,
              amount: Math.min(Math.max(0, value), r.outstanding),
              manuallyEdited: true,
            }
          : r,
      ),
    );
  };

  const validate = (): string | null => {
    if (!(amount > 0)) return "Enter an amount greater than 0";
    if (!accountId) return "Select an account";
    if (overAllocated) return "Allocation exceeds the entered amount";
    if (partyId && rows.length > 0 && unallocated > 0.01) {
      // Allow advance if user explicitly unchecks all rows.
      const anySelected = rows.some((r) => r.selected);
      if (anySelected) {
        return `${formatCurrency(unallocated, currency)} unallocated. Adjust rows or amount.`;
      }
    }
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    if (!activeId) return;
    setSubmitting(true);
    try {
      const allocations: PaymentAllocation[] = rows
        .filter((r) => r.selected && r.amount > 0)
        .map((r) => ({
          docId: r.docId,
          docNumber: r.docNumber,
          amount: r.amount,
        }));

      const payment: Omit<Payment, "id"> = {
        businessId: activeId,
        partyId: partyId || "_advance",
        direction,
        date: date.toISOString(),
        amount,
        mode,
        accountId,
        account: selectedAccount?.name,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
        allocations,
      };
      await createPayment(payment);

      // Update document paidAmount (must await in backend-mode).
      for (const alloc of allocations) {
        if (direction === "in") {
          const inv = invoices.find((i) => i.id === alloc.docId);
          if (inv) {
            await upsertInvoice({ ...inv, paidAmount: inv.paidAmount + alloc.amount });
          }
        } else {
          const pur = purchases.find((p) => p.id === alloc.docId);
          if (pur) {
            await upsertPurchase({ ...pur, paidAmount: pur.paidAmount + alloc.amount });
          }
        }
      }

      toast.success(
        `Recorded ${direction === "in" ? "receipt" : "payment"} of ${formatCurrency(
          amount,
          currency,
        )}`,
      );
      navigate({ to: "/payments", search: { dir: "all", from: "", to: "", account: "" } });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-3 gap-2">
        <Link to="/payments" search={{ dir: "all", from: "", to: "", account: "" }}>
          <ArrowLeft className="h-4 w-4" /> Back to payments
        </Link>
      </Button>
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          New payment
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Record Payment</h1>
      </header>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Direction */}
        <div className="rounded-xl border border-border bg-card p-6">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Payment type
          </Label>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setDirection("in");
                setPartyId("");
              }}
              className={cn(
                "flex items-center gap-3 rounded-lg border-2 p-4 text-left transition",
                direction === "in"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-border/80",
              )}
            >
              <ArrowDownCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="font-semibold">Receive</p>
                <p className="text-xs text-muted-foreground">Money coming in</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setDirection("out");
                setPartyId("");
              }}
              className={cn(
                "flex items-center gap-3 rounded-lg border-2 p-4 text-left transition",
                direction === "out"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-border/80",
              )}
            >
              <ArrowUpCircle className="h-6 w-6 text-destructive" />
              <div>
                <p className="font-semibold">Pay</p>
                <p className="text-xs text-muted-foreground">Money going out</p>
              </div>
            </button>
          </div>
        </div>

        {/* Party + amount + account */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="party">Party (optional)</Label>
              <Select
                value={partyId || "_none"}
                onValueChange={(v) => setPartyId(v === "_none" ? "" : v)}
              >
                <SelectTrigger id="party">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">No party (general / advance)</SelectItem>
                  {filteredParties.filter((p) => !!p.id).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="text-right tabular-nums"
                />
                {totalOutstanding > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAmount(totalOutstanding);
                      setAutoAllocate(true);
                    }}
                  >
                    Full
                  </Button>
                )}
              </div>
              {totalOutstanding > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Outstanding {formatCurrency(totalOutstanding, currency)}
                </p>
              )}
            </div>
            <div>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-10 w-full justify-between font-normal">
                    {format(date, "dd MMM yyyy")}
                    <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="account">Account *</Label>
              {safeAccounts.length === 0 ? (
                <p className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  No accounts yet.{" "}
                  <Link to="/accounts/new" className="font-medium text-primary underline">
                    Add an account
                  </Link>{" "}
                  first.
                </p>
              ) : (
                <Select
                  value={accountId || undefined}
                  onValueChange={(v) => setAccountId(v)}
                >
                  <SelectTrigger id="account">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {safeAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} • {ACCOUNT_TYPE_LABEL[a.type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedAccount && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Mode auto-set to {PAYMENT_MODE_LABEL[mode]}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="reference">Reference</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Cheque / UTR / Reference"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
        </div>

        {/* Allocation */}
        {partyId && rows.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">
                  Allocate to {direction === "in" ? "invoices" : "purchases"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Oldest filled first. Edit a row to override.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAutoAllocate(true);
                  setRows((prev) =>
                    prev.map((r) => ({ ...r, manuallyEdited: false })),
                  );
                }}
              >
                Reset
              </Button>
            </div>
            <Separator className="mb-3" />
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="w-10 px-3 py-2"></th>
                    <th className="px-3 py-2 text-left">
                      {direction === "in" ? "Invoice" : "Purchase"}
                    </th>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-right">Outstanding</th>
                    <th className="px-3 py-2 text-right">Allocate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r) => (
                    <tr
                      key={r.docId}
                      className={cn("transition-colors", r.selected ? "" : "opacity-60")}
                    >
                      <td className="px-3 py-2">
                        <Checkbox
                          checked={r.selected}
                          onCheckedChange={(v) => toggleRow(r.docId, !!v)}
                        />
                      </td>
                      <td className="px-3 py-2 font-mono font-medium">{r.docNumber}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {format(new Date(r.date), "dd MMM")}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatCurrency(r.outstanding, currency)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Input
                          type="number"
                          min={0}
                          max={r.outstanding}
                          step="0.01"
                          value={r.amount || ""}
                          onChange={(e) => editRow(r.docId, Number(e.target.value))}
                          disabled={!r.selected}
                          className="ml-auto h-8 w-28 text-right tabular-nums"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span
                className={cn(
                  "rounded-md px-2 py-1",
                  overAllocated
                    ? "bg-destructive/10 text-destructive"
                    : unallocated > 0.01
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary/10 text-primary",
                )}
              >
                {overAllocated
                  ? `Over by ${formatCurrency(allocatedTotal - amount, currency)}`
                  : unallocated > 0.01
                    ? `Unallocated ${formatCurrency(unallocated, currency)} (saved as advance if no rows selected)`
                    : "Allocation balanced"}
              </span>
              <span className="text-muted-foreground">
                Allocated{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {formatCurrency(allocatedTotal, currency)}
                </span>
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate({ to: "/payments", search: { dir: "all", from: "", to: "", account: "" } })}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} className="gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
            Save payment
          </Button>
        </div>
      </form>
    </div>
  );
}
