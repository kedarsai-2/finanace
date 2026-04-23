import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

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
import { useExpenses } from "@/hooks/useExpenses";
import { useExpenseCategories } from "@/hooks/useExpenseCategories";
import { useParties } from "@/hooks/useParties";
import { QuickAddPartyDialog } from "@/components/party/QuickAddPartyDialog";
import { ProofUpload } from "@/components/proof/ProofUpload";
import { ACCOUNT_TYPE_LABEL } from "@/types/account";
import { PAYMENT_MODE_LABEL, type PaymentMode } from "@/types/payment";
import type { Expense } from "@/types/expense";

const LAST_ACCOUNT_KEY = "bm.expenses.lastAccount";

interface ExpenseFormProps {
  initial?: Expense;
  onSaved?: (e: Expense) => void;
  onCancel?: () => void;
  /** When true, render only the essential quick-add fields. */
  compact?: boolean;
}

export function ExpenseForm({ initial, onSaved, onCancel, compact = false }: ExpenseFormProps) {
  const navigate = useNavigate();
  const { activeId } = useBusinesses();
  const { accounts } = useAccounts(activeId, []);
  const safeAccounts = useMemo(() => accounts.filter((a) => !!a.id), [accounts]);
  const bankAccounts = useMemo(() => safeAccounts.filter((a) => a.type === "bank"), [safeAccounts]);
  const cashAccountId = useMemo(
    () => safeAccounts.find((a) => a.type === "cash")?.id ?? "",
    [safeAccounts],
  );
  const { categories } = useExpenseCategories(activeId);
  const { parties } = useParties(activeId);
  const { add, upsert } = useExpenses(activeId);

  const supplierParties = parties;

  const [date, setDate] = useState<Date>(initial ? new Date(initial.date) : new Date());
  const [accountId, setAccountId] = useState<string>(initial?.accountId ?? "");
  const [category, setCategory] = useState<string>(
    initial?.category ?? categories[0]?.name ?? "Other",
  );
  const [amount, setAmount] = useState<number>(initial?.amount ?? 0);
  const [mode, setMode] = useState<PaymentMode>(initial?.mode ?? "cash");
  const [partyId, setPartyId] = useState<string>(initial?.partyId ?? "");
  const [reference, setReference] = useState<string>(initial?.reference ?? "");
  const [notes, setNotes] = useState<string>(initial?.notes ?? "");
  const [proofDataUrl, setProofDataUrl] = useState<string | undefined>(initial?.proofDataUrl);
  const [proofName, setProofName] = useState<string | undefined>(initial?.proofName);
  const [showQuickParty, setShowQuickParty] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Autofill last-used account on create
  useEffect(() => {
    if (initial || accountId) return;
    if (mode === "cash") return;
    const last = typeof window !== "undefined" ? localStorage.getItem(LAST_ACCOUNT_KEY) : null;
    const candidate = (last && bankAccounts.find((a) => a.id === last)?.id) || bankAccounts[0]?.id;
    if (candidate) setAccountId(candidate);
  }, [bankAccounts, accountId, initial, mode]);

  // If user switches to cash mode, clear account selection (cash doesn't need a bank account).
  useEffect(() => {
    if (mode === "cash") {
      setAccountId("");
    } else if (!accountId && bankAccounts[0]?.id) {
      setAccountId(bankAccounts[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Default category when categories load
  useEffect(() => {
    if (!category && categories[0]) setCategory(categories[0].name);
  }, [categories, category]);

  const onSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!activeId) return toast.error("Select a business first");
    if (mode === "cash" && !cashAccountId)
      return toast.error("Set cash balance first (Cash tab → Edit cash balance)");
    if (mode !== "cash" && !accountId) return toast.error("Bank account is required");
    if (!(amount > 0)) return toast.error("Amount must be greater than 0");
    if (!category) return toast.error("Pick a category");
    if (mode !== "cash" && !proofDataUrl)
      return toast.error(`Upload a proof image for the ${PAYMENT_MODE_LABEL[mode]} expense`);

    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const exp: Expense = {
        id: initial?.id ?? `exp_${Date.now().toString(36)}`,
        businessId: activeId,
        accountId: mode === "cash" ? cashAccountId : accountId,
        date: date.toISOString(),
        amount,
        category,
        partyId: partyId || undefined,
        mode,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
        proofDataUrl,
        proofName,
        createdAt: initial?.createdAt ?? now,
        updatedAt: initial ? now : undefined,
      };
      if (initial) upsert(exp);
      else add(exp);
      if (typeof window !== "undefined") {
        if (mode !== "cash" && accountId) localStorage.setItem(LAST_ACCOUNT_KEY, accountId);
      }
      toast.success(initial ? "Expense updated" : "Expense recorded");
      onSaved?.(exp);
      if (!onSaved) navigate({ to: "/expenses" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Section title="Expense details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
          <div className="sm:col-span-2">
            <Label htmlFor="exp-amt">
              Amount <span className="text-destructive">*</span>
            </Label>
            <Input
              id="exp-amt"
              type="number"
              min={0}
              step="0.01"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="text-right tabular-nums"
              placeholder="0.00"
              autoFocus
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
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
          <div className="sm:col-span-2">
            <Label htmlFor="exp-cat">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="exp-cat">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-3">
            <Label htmlFor="exp-acc">
              Account <span className="text-destructive">*</span>
            </Label>
            {mode === "cash" ? (
              <div className="flex h-10 items-center rounded-md border border-border bg-muted/20 px-3 text-sm text-muted-foreground">
                Not required for Cash expenses
              </div>
            ) : (
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger id="exp-acc">
                  <SelectValue placeholder="Select bank account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} • {ACCOUNT_TYPE_LABEL[a.type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="sm:col-span-3">
            <Label htmlFor="exp-mode">Payment mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as PaymentMode)}>
              <SelectTrigger id="exp-mode">
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
        </div>
      </Section>

      {!compact && (
        <>
          <Section
            title="Party (optional)"
            description="Link this expense to a party for reporting. Does not affect party ledger."
          >
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[240px] flex-1">
                <Label htmlFor="exp-party">Party</Label>
                <Select
                  value={partyId || "__none"}
                  onValueChange={(v) => setPartyId(v === "__none" ? "" : v)}
                >
                  <SelectTrigger id="exp-party">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">None</SelectItem>
                    {supplierParties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => setShowQuickParty(true)}
              >
                <Plus className="h-4 w-4" /> Add Party
              </Button>
            </div>
          </Section>

          <Section title="Additional info">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="exp-ref">Reference</Label>
                <Input
                  id="exp-ref"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Bill / receipt no."
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="exp-notes">Notes</Label>
                <Textarea
                  id="exp-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional details"
                />
              </div>
            </div>
          </Section>

          <Section
            title="Proof"
            description="Bill, receipt or transfer screenshot. Required for Bank and Cheque modes."
          >
            <ProofUpload
              id="exp-proof"
              label="Proof image"
              required={mode !== "cash"}
              proofDataUrl={proofDataUrl}
              proofName={proofName}
              onChange={(p) => {
                setProofDataUrl(p.proofDataUrl);
                setProofName(p.proofName);
              }}
            />
          </Section>
        </>
      )}

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting} className="gap-2">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {initial ? "Save changes" : "Save expense"}
        </Button>
      </div>

      <QuickAddPartyDialog
        open={showQuickParty}
        onOpenChange={setShowQuickParty}
        onCreated={(p) => setPartyId(p.id)}
      />
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <header className="mb-3">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </header>
      {children}
    </section>
  );
}
