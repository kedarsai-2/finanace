import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarIcon,
  Loader2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
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
import { useParties, formatCurrency } from "@/hooks/useParties";
import { ACCOUNT_TYPE_LABEL } from "@/types/account";
import {
  accountsForPaymentPicker,
  accountOptionsForMode,
  formatAccountOptionLabel,
} from "@/lib/paymentAccounts";
import {
  PAYMENT_MODE_LABEL,
  type Payment,
  type PaymentDirection,
} from "@/types/payment";
import { ProofUpload } from "@/components/proof/ProofUpload";

interface PaymentFormProps {
  /** When provided the form operates in edit mode. */
  initial?: Payment;
}

export function PaymentForm({ initial }: PaymentFormProps) {
  const navigate = useNavigate();
  const { activeId, businesses } = useBusinesses();
  const businessIds = useMemo(() => businesses.map((b) => b.id), [businesses]);

  const effectiveBusinessId = initial?.businessId ?? activeId;
  const business = businesses.find((b) => b.id === effectiveBusinessId);
  const currency = business?.currency ?? "INR";

  const { parties } = useParties(effectiveBusinessId ?? null);
  const { accounts, hydrated: accountsHydrated } = useAccounts(null, businessIds);
  const safeAccounts = useMemo(() => accounts.filter((a) => !!a.id), [accounts]);

  const { create: createPayment, update: updatePayment } = usePayments(null);

  const isEdit = !!initial;

  const [direction, setDirection] = useState<PaymentDirection>(initial?.direction ?? "in");
  const [partyId, setPartyId] = useState<string>(initial?.partyId === "_advance" ? "" : (initial?.partyId ?? ""));
  const [accountId, setAccountId] = useState<string>(initial?.accountId ?? "");
  const [mode, setMode] = useState<Payment["mode"]>(initial?.mode ?? "cash");
  const [amount, setAmount] = useState<number>(initial?.amount ?? 0);
  const [date, setDate] = useState<Date>(initial ? new Date(initial.date) : new Date());
  const [reference, setReference] = useState(initial?.reference ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [proofDataUrl, setProofDataUrl] = useState<string | undefined>(initial?.proofDataUrl);
  const [proofName, setProofName] = useState<string | undefined>(initial?.proofName);
  const [submitting, setSubmitting] = useState(false);

  const paymentPickerAccounts = useMemo(() => accountsForPaymentPicker(accounts), [accounts]);
  const showAccountBusiness = businesses.length > 1;
  const businessById = useMemo(
    () => Object.fromEntries(businesses.map((b) => [b.id, b.name])),
    [businesses],
  );
  const accountOptions = useMemo(
    () => accountOptionsForMode(paymentPickerAccounts, mode),
    [paymentPickerAccounts, mode],
  );

  const modeEffectMountedRef = useRef(false);

  useEffect(() => {
    if (isEdit || !accountsHydrated || accountId) return;
    const opts = accountOptionsForMode(paymentPickerAccounts, mode);
    if (opts[0]?.id) setAccountId(opts[0].id);
  }, [accountsHydrated, accountId, mode, isEdit, paymentPickerAccounts]);

  useEffect(() => {
    if (!modeEffectMountedRef.current) {
      modeEffectMountedRef.current = true;
      return;
    }
    const opts = accountOptionsForMode(paymentPickerAccounts, mode);
    const keepCurrent = !!accountId && opts.some((a) => a.id === accountId);
    if (!keepCurrent) setAccountId(opts[0]?.id ?? "");
  }, [mode, paymentPickerAccounts, accountId]);

  const validate = (): string | null => {
    if (!(amount > 0)) return "Enter an amount greater than 0";
    if (!accountId) return `Select a ${mode === "cash" ? "cash" : "bank"} account`;
    if (mode !== "cash" && !proofDataUrl)
      return "Upload payment attachment (image or document)";
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { toast.error(err); return; }
    if (!effectiveBusinessId) { toast.error("Select a business first"); return; }

    setSubmitting(true);
    try {
      const selectedAccount = safeAccounts.find((a) => a.id === accountId);
      const patch: Partial<Omit<Payment, "id" | "businessId">> = {
        partyId: partyId || "_advance",
        direction,
        date: date.toISOString(),
        amount,
        mode,
        accountId: accountId || undefined,
        account: selectedAccount?.name,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
        proofDataUrl,
        proofName,
      };

      if (isEdit && initial) {
        await updatePayment(initial.id, patch);
        toast.success("Payment updated");
      } else {
        await createPayment({ ...patch, businessId: effectiveBusinessId, allocations: [] } as Omit<Payment, "id">);
        toast.success(`Recorded ${direction === "in" ? "receipt" : "payment"} of ${formatCurrency(amount, currency)}`);
      }

      navigate({ to: "/payments", search: { dir: "all", from: "", to: "", account: "" } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Direction — read-only in edit mode */}
      <div className="rounded-xl border border-border bg-card p-6">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Payment type
        </Label>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {(["in", "out"] as PaymentDirection[]).map((d) => {
            const isIn = d === "in";
            const Icon = isIn ? ArrowDownCircle : ArrowUpCircle;
            const active = direction === d;
            return (
              <button
                key={d}
                type="button"
                disabled={isEdit}
                onClick={() => { setDirection(d); setPartyId(""); }}
                className={cn(
                  "flex items-center gap-3 rounded-lg border-2 p-4 text-left transition",
                  active ? "border-primary bg-primary/5" : "border-border hover:border-border/80",
                  isEdit && "cursor-default opacity-70",
                )}
              >
                <Icon className={cn("h-6 w-6", isIn ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")} />
                <div>
                  <p className="font-semibold">{isIn ? "Receive" : "Pay"}</p>
                  <p className="text-xs text-muted-foreground">{isIn ? "Money coming in" : "Money going out"}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Core fields */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="party">Party (optional)</Label>
            <Select value={partyId || "_none"} onValueChange={(v) => setPartyId(v === "_none" ? "" : v)}>
              <SelectTrigger id="party"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">No party (general / advance)</SelectItem>
                {parties.filter((p) => !!p.id).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              min={0}
              step="0.01"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="text-right tabular-nums"
              placeholder="0.00"
            />
          </div>

          <div>
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" className="h-10 w-full justify-between font-normal">
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
            <Label htmlFor="mode">Payment mode</Label>
            <Select
              value={mode}
              onValueChange={(v) => {
                const nextMode = v as Payment["mode"];
                const opts = accountOptionsForMode(paymentPickerAccounts, nextMode);
                const keepCurrent =
                  !!accountId && opts.some((a) => a.id === accountId);
                setMode(nextMode);
                if (!keepCurrent) setAccountId(opts[0]?.id ?? "");
              }}
            >
              <SelectTrigger id="mode"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(PAYMENT_MODE_LABEL) as Payment["mode"][]).map((m) => (
                  <SelectItem key={m} value={m}>{PAYMENT_MODE_LABEL[m]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="account">Account *</Label>
            {accountOptions.length === 0 ? (
              <p className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                No {mode === "cash" ? "cash" : "bank"} accounts yet.{" "}
                <Link to="/accounts/new" className="font-medium text-primary underline">
                  Add one
                </Link>.
              </p>
            ) : (
              <Select value={accountId || undefined} onValueChange={setAccountId}>
                <SelectTrigger id="account">
                  <SelectValue placeholder={`Select ${mode === "cash" ? "cash" : "bank"} account`} />
                </SelectTrigger>
                <SelectContent>
                  {accountOptions.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {formatAccountOptionLabel(
                        a,
                        businessById[a.businessId],
                        showAccountBusiness,
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <div className="sm:col-span-2">
            <ProofUpload
              id="pay-proof"
              label="Attachments"
              required={mode !== "cash"}
              proofDataUrl={proofDataUrl}
              proofName={proofName}
              onChange={(p) => { setProofDataUrl(p.proofDataUrl); setProofName(p.proofName); }}
            />
          </div>
        </div>
      </div>

      {/* Existing allocations (read-only in edit) */}
      {isEdit && initial && initial.allocations.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="mb-3 text-sm font-semibold">Allocated to</p>
          <div className="divide-y divide-border rounded-lg border border-border">
            {initial.allocations.map((a, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="font-mono text-muted-foreground">{a.docNumber}</span>
                <span className="tabular-nums font-medium">{formatCurrency(a.amount, currency)}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Allocations cannot be changed after creation.</p>
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
          {isEdit ? "Save changes" : "Save payment"}
        </Button>
      </div>
    </form>
  );
}
