import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Wallet, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useInvoices } from "@/hooks/useInvoices";
import { usePayments } from "@/hooks/usePayments";
import { useAccounts } from "@/hooks/useAccounts";
import { formatCurrency } from "@/hooks/useParties";
import { cn } from "@/lib/utils";
import { paymentStatusOf, type Invoice } from "@/types/invoice";
import {
  PAYMENT_MODE_LABEL,
  type Payment,
  type PaymentAllocation,
  type PaymentMode,
} from "@/types/payment";
import { ACCOUNT_TYPE_LABEL } from "@/types/account";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, dialog opens scoped to this party (Record Payment from invoice). */
  partyId: string;
  partyName: string;
  businessId: string;
  currency?: string;
  /** When set, this invoice is preselected and prioritised in allocation. */
  focusInvoiceId?: string;
  onRecorded?: (payment: Payment) => void;
}

interface AllocRow {
  invoice: Invoice;
  outstanding: number;
  selected: boolean;
  amount: number;
  manuallyEdited: boolean;
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  partyId,
  partyName,
  businessId,
  currency = "INR",
  focusInvoiceId,
  onRecorded,
}: Props) {
  const { invoices, upsert } = useInvoices(businessId);
  const { add: addPayment } = usePayments(businessId);
  const { accounts } = useAccounts(businessId);

  // ---------- Open invoices for this party (oldest first) -----------------
  const openInvoices = useMemo(() => {
    return invoices
      .filter(
        (i) =>
          i.partyId === partyId &&
          i.status !== "cancelled" &&
          i.total - i.paidAmount > 0.01,
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [invoices, partyId]);

  const totalOutstanding = openInvoices.reduce(
    (sum, i) => sum + (i.total - i.paidAmount),
    0,
  );

  // ---------- Form state --------------------------------------------------
  const [date, setDate] = useState<Date>(new Date());
  const [accountId, setAccountId] = useState<string>("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [autoAllocate, setAutoAllocate] = useState(true);
  const [rows, setRows] = useState<AllocRow[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const mode: PaymentMode = selectedAccount?.type ?? "upi";

  // Reset whenever the dialog opens.
  useEffect(() => {
    if (!open) return;
    setDate(new Date());
    setAccountId(accounts[0]?.id ?? "");
    setReference("");
    setNotes("");
    setAutoAllocate(true);
    // Default: pre-select focused invoice if given, else all open invoices.
    const initialRows: AllocRow[] = openInvoices.map((inv) => {
      const outstanding = inv.total - inv.paidAmount;
      const selected = focusInvoiceId ? inv.id === focusInvoiceId : true;
      return {
        invoice: inv,
        outstanding,
        selected,
        amount: 0,
        manuallyEdited: false,
      };
    });
    setRows(initialRows);
    // Default amount = outstanding of focused invoice, else everything open.
    if (focusInvoiceId) {
      const focused = openInvoices.find((i) => i.id === focusInvoiceId);
      setAmount(focused ? focused.total - focused.paidAmount : 0);
    } else {
      setAmount(
        initialRows.reduce((s, r) => s + (r.selected ? r.outstanding : 0), 0),
      );
    }
    // We intentionally only re-init on open / party change — not on every row tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, partyId, focusInvoiceId]);

  // ---------- Auto-allocation --------------------------------------------
  // Allocate `amount` across selected rows in order (oldest first).
  // Manually-edited rows keep their values; remainder spills to the rest.
  useEffect(() => {
    if (!autoAllocate) return;
    setRows((prev) => {
      let remaining = amount;
      // First, honour manual values on selected rows.
      const manualLocked = prev.map((r) => {
        if (r.selected && r.manuallyEdited) {
          const capped = Math.min(Math.max(0, r.amount), r.outstanding);
          remaining -= capped;
          return { ...r, amount: capped };
        }
        return r;
      });
      remaining = Math.max(0, remaining);
      // Then fill remaining selected, in order (oldest first).
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

  const toggleRow = (invoiceId: string, selected: boolean) => {
    setAutoAllocate(true); // re-trigger redistribution on next change
    setRows((prev) =>
      prev.map((r) =>
        r.invoice.id === invoiceId
          ? { ...r, selected, amount: selected ? r.amount : 0, manuallyEdited: false }
          : r,
      ),
    );
  };

  const editRowAmount = (invoiceId: string, value: number) => {
    setAutoAllocate(false);
    setRows((prev) =>
      prev.map((r) =>
        r.invoice.id === invoiceId
          ? {
              ...r,
              amount: Math.min(Math.max(0, value), r.outstanding),
              manuallyEdited: true,
            }
          : r,
      ),
    );
  };

  const fillRemaining = () => {
    setAmount(totalOutstanding);
    setAutoAllocate(true);
    setRows((prev) => prev.map((r) => ({ ...r, manuallyEdited: false, selected: true })));
  };

  const resetAllocation = () => {
    setAutoAllocate(true);
    setRows((prev) => prev.map((r) => ({ ...r, manuallyEdited: false })));
  };

  // ---------- Submit ------------------------------------------------------
  const validate = (): string | null => {
    if (!(amount > 0)) return "Enter an amount greater than 0";
    if (amount - totalOutstanding > 0.01)
      return `Amount exceeds outstanding ${formatCurrency(totalOutstanding, currency)}`;
    if (!rows.some((r) => r.selected && r.amount > 0))
      return "Select at least one invoice to allocate to";
    if (overAllocated) return "Allocation exceeds the entered amount";
    if (unallocated > 0.01)
      return `${formatCurrency(unallocated, currency)} is unallocated. Adjust rows or amount.`;
    return null;
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSubmitting(true);
    try {
      const allocations: PaymentAllocation[] = rows
        .filter((r) => r.selected && r.amount > 0)
        .map((r) => ({
          invoiceId: r.invoice.id,
          invoiceNumber: r.invoice.number,
          amount: r.amount,
        }));

      const payment: Payment = {
        id: `pay_${Date.now()}`,
        businessId,
        partyId,
        date: date.toISOString(),
        amount,
        mode,
        account: account.trim() || undefined,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
        allocations,
      };
      addPayment(payment);

      // Update each affected invoice's paidAmount.
      for (const alloc of allocations) {
        const inv = rows.find((r) => r.invoice.id === alloc.invoiceId)?.invoice;
        if (!inv) continue;
        const updated: Invoice = {
          ...inv,
          paidAmount: inv.paidAmount + alloc.amount,
        };
        upsert(updated);
      }

      toast.success(
        `Recorded ${formatCurrency(amount, currency)} against ${allocations.length} ${
          allocations.length === 1 ? "invoice" : "invoices"
        }`,
      );
      onRecorded?.(payment);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Record Payment
          </DialogTitle>
          <DialogDescription>
            From <span className="font-medium text-foreground">{partyName}</span>{" "}
            • Outstanding{" "}
            <span className="font-semibold text-foreground">
              {formatCurrency(totalOutstanding, currency)}
            </span>
          </DialogDescription>
        </DialogHeader>

        {openInvoices.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            No outstanding invoices for this party.
          </div>
        ) : (
          <div className="space-y-5">
            {/* Top fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={fillRemaining}
                    className="shrink-0"
                  >
                    Full
                  </Button>
                </div>
              </div>
              <div>
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 w-full justify-between font-normal"
                    >
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
              <div>
                <Label htmlFor="mode">Mode</Label>
                <Select value={mode} onValueChange={(v) => setMode(v as PaymentMode)}>
                  <SelectTrigger id="mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PAYMENT_MODE_LABEL) as PaymentMode[]).map((m) => (
                      <SelectItem key={m} value={m}>
                        {PAYMENT_MODE_LABEL[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="account">Account</Label>
                <Input
                  id="account"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder={
                    mode === "cash"
                      ? "Cash drawer"
                      : mode === "upi"
                      ? "UPI VPA"
                      : "HDFC ****1234"
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="reference">Reference</Label>
                <Input
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Cheque / UTR / UPI txn ID"
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

            <Separator />

            {/* Allocation table */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Allocate to invoices</p>
                  <p className="text-xs text-muted-foreground">
                    Oldest invoices are filled first. Edit a row to override.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetAllocation}
                  className="text-xs"
                >
                  Reset
                </Button>
              </div>
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="w-10 px-3 py-2"></th>
                      <th className="px-3 py-2 text-left">Invoice</th>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-right">Outstanding</th>
                      <th className="px-3 py-2 text-right">Allocate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((r) => {
                      const newPaid = r.invoice.paidAmount + r.amount;
                      const newStatus = paymentStatusOf({
                        ...r.invoice,
                        paidAmount: newPaid,
                      });
                      return (
                        <tr
                          key={r.invoice.id}
                          className={cn(
                            "transition-colors",
                            r.selected ? "" : "opacity-60",
                          )}
                        >
                          <td className="px-3 py-2">
                            <Checkbox
                              checked={r.selected}
                              onCheckedChange={(v) => toggleRow(r.invoice.id, !!v)}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <p className="font-mono font-medium">
                              {r.invoice.number}
                            </p>
                            {r.selected && r.amount > 0 && (
                              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                                → {newStatus}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {format(new Date(r.invoice.date), "dd MMM")}
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
                              onChange={(e) =>
                                editRowAmount(r.invoice.id, Number(e.target.value))
                              }
                              disabled={!r.selected}
                              className="ml-auto h-8 w-28 text-right tabular-nums"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
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
                    ? `Over-allocated by ${formatCurrency(allocatedTotal - amount, currency)}`
                    : unallocated > 0.01
                    ? `Unallocated ${formatCurrency(unallocated, currency)}`
                    : "Allocation balanced"}
                </span>
                <span className="text-muted-foreground">
                  Allocated{" "}
                  <span className="font-semibold text-foreground tabular-nums">
                    {formatCurrency(allocatedTotal, currency)}
                  </span>{" "}
                  of {formatCurrency(amount, currency)}
                </span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || openInvoices.length === 0}
            className="gap-2"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
            Record payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
