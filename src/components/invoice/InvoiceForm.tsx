import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { format, addDays } from "date-fns";
import {
  ArrowLeft,
  CalendarIcon,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
  UserPlus,
  Search as SearchIcon,
  Lock,
  RefreshCw,
  AlertTriangle,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { FormSection } from "@/components/business/FormSection";
import { QuickAddPartyDialog } from "@/components/party/QuickAddPartyDialog";
import { QuickAddItemDialog } from "@/components/item/QuickAddItemDialog";

import { useBusinesses } from "@/hooks/useBusinesses";
import { useParties, formatCurrency } from "@/hooks/useParties";
import { useItems } from "@/hooks/useItems";
import { useInvoices } from "@/hooks/useInvoices";
import { useAccounts } from "@/hooks/useAccounts";
import { usePayments } from "@/hooks/usePayments";
import { cn } from "@/lib/utils";
import {
  computeTotals,
  lineMath,
  nextInvoiceNumber,
  canEditInvoice,
  type Invoice,
  type InvoiceLine,
  type DiscountKind,
} from "@/types/invoice";
import type { Item } from "@/types/item";
import { PAYMENT_MODE_LABEL, type PaymentMode } from "@/types/payment";
import type { Account } from "@/types/account";

interface Props {
  mode: "new" | "edit";
  invoiceId?: string;
}

const PAYMENT_TERMS = [0, 7, 15, 30, 45, 60, 90] as const;

type PaymentSplit = {
  id: string;
  mode: PaymentMode;
  accountId?: string;
  amount: number;
  reference?: string;
  notes?: string;
  proofDataUrl?: string;
  proofName?: string;
};

function emptyLine(): InvoiceLine {
  return {
    id: `ln_${Math.random().toString(36).slice(2, 9)}`,
    name: "",
    qty: 1,
    unit: "pcs",
    rate: 0,
    discountKind: "percent",
    discountValue: 0,
    taxPercent: 18,
  };
}

export function InvoiceForm({ mode, invoiceId }: Props) {
  const navigate = useNavigate();
  const { businesses, activeId } = useBusinesses();
  const { parties } = useParties(activeId);
  const { items } = useItems(activeId);
  const { allInvoices, upsert, hydrated, ensureLines } = useInvoices(activeId);
  const { accounts } = useAccounts(activeId);
  const { create: createPayment } = usePayments(activeId);
  const activeBusiness = businesses.find((b) => b.id === activeId);

  const existing = useMemo(
    () => (invoiceId ? allInvoices.find((i) => i.id === invoiceId) : undefined),
    [invoiceId, allInvoices],
  );

  // -------- Form state ----------------------------------------------------
  const [partyId, setPartyId] = useState("");
  const [number, setNumber] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [terms, setTerms] = useState<number>(30);
  const [lines, setLines] = useState<InvoiceLine[]>([emptyLine()]);
  const [overallDiscountKind, setOverallDiscountKind] = useState<DiscountKind>("percent");
  const [overallDiscountValue, setOverallDiscountValue] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [termsText, setTermsText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [partyOpen, setPartyOpen] = useState(false);
  const [quickPartyOpen, setQuickPartyOpen] = useState(false);
  const [quickItemForRow, setQuickItemForRow] = useState<string | null>(null);

  // -------- Payment splits ------------------------------------------------
  type PaymentSplit = {
    id: string;
    mode: PaymentMode;
    accountId?: string;
    amount: number;
    reference?: string;
    notes?: string;
    proofDataUrl?: string;
    proofName?: string;
  };
  const newSplitId = () => `pay_${Math.random().toString(36).slice(2, 9)}`;
  const emptySplit = (): PaymentSplit => ({ id: newSplitId(), mode: "cash", amount: 0 });
  const [payments, setPayments] = useState<PaymentSplit[]>([]);
  const updateSplit = (id: string, patch: Partial<PaymentSplit>) =>
    setPayments((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const removeSplit = (id: string) =>
    setPayments((prev) => prev.filter((s) => s.id !== id));

  // Initialise from existing or sensible defaults.
  useEffect(() => {
    if (!hydrated) return;
    if (existing) {
      if (existing.lines.length === 0) {
        void ensureLines(existing.id).catch(() => {});
      }
      setPartyId(existing.partyId);
      setNumber(existing.number);
      setDate(new Date(existing.date));
      setTerms(existing.paymentTermsDays ?? 30);
      setLines(existing.lines.length ? existing.lines : [emptyLine()]);
      setOverallDiscountKind(existing.overallDiscountKind);
      setOverallDiscountValue(existing.overallDiscountValue);
      setNotes(existing.notes ?? "");
      setTermsText(existing.terms ?? "");
    } else if (activeId) {
      setNumber(nextInvoiceNumber(allInvoices, activeId));
    }
  }, [existing, hydrated, activeId, allInvoices, ensureLines]);

  const party = parties.find((p) => p.id === partyId);
  const businessState = activeBusiness?.state;
  const intraState = !!businessState && !!party?.state && businessState === party.state;

  const dueDate = useMemo(() => addDays(date, terms || 0), [date, terms]);

  const totals = useMemo(
    () =>
      computeTotals({
        lines,
        overallDiscountKind,
        overallDiscountValue,
        intraState,
      }),
    [lines, overallDiscountKind, overallDiscountValue, intraState],
  );

  // -------- Edit-lock -----------------------------------------------------
  const locked = mode === "edit" && existing ? !canEditInvoice(existing) : false;
  const lockedReason =
    existing?.status === "cancelled"
      ? "Cancelled invoices cannot be edited."
      : "Final invoices can only be edited within 24 hours of finalising.";

  // -------- Line helpers --------------------------------------------------
  const updateLine = (id: string, patch: Partial<InvoiceLine>) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (id: string) =>
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((l) => l.id !== id)));

  const applyItemToLine = (lineId: string, item: Item) =>
    updateLine(lineId, {
      itemId: item.id,
      name: item.name,
      unit: item.unit,
      rate: item.sellingPrice,
      taxPercent: item.taxPercent,
    });

  /**
   * Re-syncs every line that was picked from the catalog with the most recent
   * item price / unit / tax. Lines without an `itemId` (free-text) are untouched.
   */
  const refreshFromCatalog = () => {
    let changed = 0;
    setLines((prev) =>
      prev.map((l) => {
        if (!l.itemId) return l;
        const it = items.find((x) => x.id === l.itemId);
        if (!it) return l;
        if (
          it.sellingPrice === l.rate &&
          it.taxPercent === l.taxPercent &&
          it.unit === l.unit &&
          it.name === l.name
        ) {
          return l;
        }
        changed += 1;
        return {
          ...l,
          name: it.name,
          unit: it.unit,
          rate: it.sellingPrice,
          taxPercent: it.taxPercent,
        };
      }),
    );
    toast.success(
      changed === 0
        ? "All items already up to date"
        : `Refreshed ${changed} ${changed === 1 ? "line" : "lines"} from latest catalog`,
    );
  };

  // -------- Validation ----------------------------------------------------
  const validate = (): string | null => {
    if (!activeId) return "Select an active business first";
    if (!partyId) return "Please select a party";
    if (!number.trim()) return "Invoice number is required";
    if (!/^[A-Z0-9-]{1,30}$/i.test(number.trim()))
      return "Invoice number can only contain letters, numbers and dashes (max 30)";
    if (
      allInvoices.some(
        (i) =>
          i.businessId === activeId &&
          i.id !== existing?.id &&
          !i.deleted &&
          i.number.toLowerCase() === number.trim().toLowerCase(),
      )
    ) {
      return `Invoice number ${number} already exists`;
    }
    if (!lines.length) return "Add at least one item";
    for (const l of lines) {
      if (!l.name.trim()) return "Each line needs an item name";
      if (!(l.qty > 0)) return `Quantity must be greater than 0 for ${l.name}`;
      if (l.rate < 0) return `Price cannot be negative for ${l.name}`;
      if (l.discountValue < 0)
        return `Discount cannot be negative for ${l.name}`;
      if (l.discountKind === "percent" && l.discountValue > 100)
        return `Discount % cannot exceed 100 for ${l.name}`;
    }
    if (overallDiscountValue < 0) return "Overall discount cannot be negative";
    if (overallDiscountKind === "percent" && overallDiscountValue > 100)
      return "Overall discount % cannot exceed 100";
    // Payment splits
    let paySum = 0;
    for (const s of payments) {
      if (!(s.amount > 0)) return "Each payment row must have an amount > 0";
      if (s.mode !== "cash" && !s.accountId)
        return `Select a ${PAYMENT_MODE_LABEL[s.mode]} account for the payment`;
      if (s.mode !== "cash" && !s.proofDataUrl)
        return `Upload a proof image for the ${PAYMENT_MODE_LABEL[s.mode]} payment`;
      paySum += s.amount;
    }
    if (paySum - 0.001 > totals.total)
      return `Payments (${paySum.toFixed(2)}) exceed invoice total (${totals.total.toFixed(2)})`;
    return null;
  };

  const buildInvoice = (status: Invoice["status"]): Invoice => {
    const isFinal = status === "final";
    const newPaidAmount = payments.reduce((s, p) => s + (p.amount || 0), 0);
    return {
      id: existing?.id ?? `inv_${Date.now()}`,
      businessId: existing?.businessId ?? activeId!,
      number: number.trim(),
      date: date.toISOString(),
      dueDate: dueDate.toISOString(),
      paymentTermsDays: terms,
      partyId,
      partyName: party?.name ?? "",
      partyState: party?.state,
      businessState,
      lines,
      overallDiscountKind,
      overallDiscountValue,
      ...totals,
      paidAmount: (existing?.paidAmount ?? 0) + newPaidAmount,
      status,
      deleted: existing?.deleted,
      notes: notes.trim() || undefined,
      terms: termsText.trim() || undefined,
      finalizedAt: isFinal
        ? (existing?.finalizedAt ?? new Date().toISOString())
        : existing?.finalizedAt,
    };
  };

  const handleSave = async (status: Invoice["status"]) => {
    if (locked) {
      toast.error(lockedReason);
      return;
    }
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSubmitting(true);
    try {
      const inv = buildInvoice(status);
      await upsert(inv);
      // Persist payment splits as Payment records (only for new payments
      // captured in this form session — `payments` is reset after save).
      for (const s of payments) {
        try {
          await createPayment({
            businessId: inv.businessId,
            partyId: inv.partyId,
            direction: "in",
            date: inv.date,
            amount: s.amount,
            mode: s.mode,
            accountId: s.accountId,
            reference: s.reference,
            notes: s.notes,
            proofDataUrl: s.proofDataUrl,
            allocations: [
              { docId: inv.id, docNumber: inv.number, amount: s.amount },
            ],
          });
        } catch (e) {
          console.error("Failed to record payment split", e);
        }
      }
      toast.success(
        status === "final" ? `Invoice ${inv.number} finalised` : `Draft ${inv.number} saved`,
      );
      navigate({
        to: "/invoices",
        search: { q: "", status: "all", payment: "all", from: "", to: "" },
      });
    } finally {
      setSubmitting(false);
    }
  };

  const cancelHref = {
    to: "/invoices" as const,
    search: { q: "", status: "all" as const, payment: "all" as const, from: "", to: "" },
  };

  const currency = activeBusiness?.currency ?? "INR";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background pb-32">
      <header className="sticky top-16 z-10 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <Button asChild size="icon" variant="ghost" className="h-9 w-9">
              <Link {...cancelHref} aria-label="Back">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {activeBusiness?.name ?? "Workspace"}
              </p>
              <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
                {mode === "edit" ? "Edit Invoice" : "New Invoice"}
                {locked && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    Locked
                  </span>
                )}
              </h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Button variant="ghost" onClick={() => navigate(cancelHref)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSave("draft")}
              disabled={submitting || locked}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSave("final")}
              disabled={submitting || locked}
              className="gap-2"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Save & Finalize
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        {locked && (
          <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning-foreground/80">
            <strong className="font-semibold">This invoice is locked.</strong> {lockedReason}
          </div>
        )}

        {/* 1. Party --------------------------------------------------------- */}
        <FormSection step={1} title="Party" description="Who is this invoice for?">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label>Party *</Label>
              <Popover open={partyOpen} onOpenChange={setPartyOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "h-10 w-full justify-between font-normal",
                      !party && "text-muted-foreground",
                    )}
                  >
                    {party ? party.name : "Select party…"}
                    <SearchIcon className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search parties…" />
                    <CommandList>
                      <CommandEmpty>No parties found.</CommandEmpty>
                      <CommandGroup>
                        {parties.map((p) => (
                          <CommandItem
                            key={p.id}
                            value={`${p.name} ${p.mobile}`}
                            onSelect={() => {
                              setPartyId(p.id);
                              setPartyOpen(false);
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{p.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {p.mobile}
                                {p.state ? ` • ${p.state}` : ""}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {party && (
                <p className="mt-1 text-xs text-muted-foreground">
                  GSTIN: {party.gstNumber ?? "—"} • State: {party.state ?? "—"}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setQuickPartyOpen(true)}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Add Party
            </Button>
          </div>
        </FormSection>

        {/* 2. Invoice meta --------------------------------------------------- */}
        <FormSection step={2} title="Invoice Details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="number">Invoice number *</Label>
              <Input
                id="number"
                value={number}
                onChange={(e) => setNumber(e.target.value.toUpperCase())}
                placeholder="INV-0001"
                className="font-mono"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Auto-generated. Edit if needed — duplicates are blocked.
              </p>
            </div>
            <div>
              <Label>Invoice date</Label>
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
            <div>
              <Label htmlFor="terms">Payment terms</Label>
              <Select value={String(terms)} onValueChange={(v) => setTerms(Number(v))}>
                <SelectTrigger id="terms">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TERMS.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d === 0 ? "Due on receipt" : `Net ${d} days`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Due date</Label>
              <Input value={format(dueDate, "dd MMM yyyy")} disabled className="bg-muted/40" />
            </div>
          </div>
        </FormSection>

        {/* 3. Items ---------------------------------------------------------- */}
        <FormSection
          step={3}
          title="Items"
          description="Each row becomes a line on the invoice. Pulled prices reflect the current catalog."
        >
          {lines.some((l) => !!l.itemId) && (
            <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={refreshFromCatalog}
                disabled={locked}
                className="gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh from catalog
              </Button>
            </div>
          )}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Item</th>
                  <th className="px-3 py-2 text-left">Unit</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Unit Price</th>
                  <th className="px-3 py-2 text-right">Total Price</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lines.map((line) => {
                  const m = lineMath(line);
                  const catalog = line.itemId
                    ? items.find((x) => x.id === line.itemId)
                    : undefined;
                  const drift =
                    catalog &&
                    (catalog.sellingPrice !== line.rate ||
                      catalog.taxPercent !== line.taxPercent ||
                      catalog.unit !== line.unit);
                  return (
                    <tr key={line.id} className="align-top">
                      <td className="min-w-[220px] px-2 py-2">
                        <ItemPicker
                          value={line.name}
                          items={items}
                          onSelect={(item) => applyItemToLine(line.id, item)}
                          onChangeName={(v) => updateLine(line.id, { name: v, itemId: undefined })}
                          onQuickAdd={() => setQuickItemForRow(line.id)}
                          locked={!!line.itemId}
                        />
                        {drift && catalog && (
                          <button
                            type="button"
                            onClick={() => applyItemToLine(line.id, catalog)}
                            className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-warning-foreground/80 hover:text-warning-foreground"
                            title={`Catalog: ${formatCurrency(catalog.sellingPrice, currency)} · ${catalog.taxPercent}% · ${catalog.unit}`}
                          >
                            <AlertTriangle className="h-3 w-3" />
                            Catalog updated — Use latest
                          </button>
                        )}
                      </td>
                      <td className="w-20 px-2 py-2">
                        <Input
                          value={line.unit}
                          onChange={(e) => updateLine(line.id, { unit: e.target.value })}
                          className="h-9"
                        />
                      </td>
                      <td className="w-20 px-2 py-2">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.qty}
                          onChange={(e) => updateLine(line.id, { qty: Number(e.target.value) })}
                          className="h-9 text-right tabular-nums"
                        />
                      </td>
                      <td className="w-28 px-2 py-2">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.rate}
                          onChange={(e) => updateLine(line.id, { rate: Number(e.target.value) })}
                          className="h-9 text-right tabular-nums"
                        />
                      </td>
                      <td className="w-32 px-3 py-2 text-right font-semibold tabular-nums">
                        {formatCurrency(m.total, currency)}
                      </td>
                      <td className="w-10 px-2 py-2 text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => removeLine(line.id)}
                          disabled={lines.length === 1}
                          aria-label="Remove row"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Button type="button" variant="outline" onClick={addLine} className="mt-3 gap-2">
            <Plus className="h-4 w-4" />
            Add row
          </Button>
        </FormSection>

        {/* 4. GST + Summary ------------------------------------------------ */}
        <FormSection
          step={4}
          title="Summary"
          description={
            intraState
              ? "Same-state invoice — CGST + SGST applied."
              : party
                ? "Inter-state invoice — IGST applied."
                : "GST split is computed once a party is selected."
          }
        >
          <div className="flex justify-end">
            <dl className="w-full max-w-sm space-y-2 rounded-xl border border-border bg-card p-4 text-sm">
              <Row label="Subtotal" value={formatCurrency(totals.subtotal, currency)} />
              <Row label="Taxable value" value={formatCurrency(totals.taxableValue, currency)} />
              {intraState ? (
                <>
                  <Row label="CGST" value={formatCurrency(totals.cgst, currency)} muted />
                  <Row label="SGST" value={formatCurrency(totals.sgst, currency)} muted />
                </>
              ) : (
                <Row label="IGST" value={formatCurrency(totals.igst, currency)} muted />
              )}
              <div className="my-2 h-px bg-border" />
              <Row label="Total" value={formatCurrency(totals.total, currency)} emphasis />
            </dl>
          </div>
        </FormSection>

        {/* 5. Payments ---------------------------------------------------- */}
        <FormSection
          step={5}
          title="Payment"
          description="Optional. Add one or more payments — supports split tender (e.g. part Cash, part Bank). Bank, UPI and Cheque payments require a proof image."
        >
          <PaymentSplitsEditor
            splits={payments}
            accounts={accounts}
            currency={currency}
            invoiceTotal={totals.total}
            onChange={(s, patch) => updateSplit(s, patch)}
            onRemove={removeSplit}
            onAdd={() => setPayments((p) => [...p, emptySplit()])}
            disabled={locked}
          />
        </FormSection>

        {/* 6. Notes & terms -------------------------------------------------- */}
        <FormSection
          step={6}
          title="Notes & Terms"
          description="Optional, shown on the printable invoice."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Thank you for your business…"
              />
            </div>
            <div>
              <Label htmlFor="termsText">Terms & conditions</Label>
              <Textarea
                id="termsText"
                rows={4}
                value={termsText}
                onChange={(e) => setTermsText(e.target.value)}
                placeholder="Payment due within agreed terms…"
              />
            </div>
          </div>
        </FormSection>

        {/* Mobile actions */}
        <div className="flex flex-col gap-2 sm:hidden">
          <Button onClick={() => handleSave("final")} disabled={submitting || locked}>
            Save & Finalize
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave("draft")}
            disabled={submitting || locked}
          >
            Save as Draft
          </Button>
          <Button variant="ghost" onClick={() => navigate(cancelHref)}>
            Cancel
          </Button>
        </div>
      </div>

      <QuickAddPartyDialog
        open={quickPartyOpen}
        onOpenChange={setQuickPartyOpen}
        defaultType="customer"
        onCreated={(p) => setPartyId(p.id)}
      />
      <QuickAddItemDialog
        open={!!quickItemForRow}
        onOpenChange={(o) => !o && setQuickItemForRow(null)}
        defaultType="product"
        onCreated={(item) => {
          if (quickItemForRow) applyItemToLine(quickItemForRow, item);
          setQuickItemForRow(null);
        }}
      />
    </div>
  );
}

// ---------- Sub components ------------------------------------------------

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
          emphasis && "text-lg font-bold",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function ItemPicker({
  value,
  items,
  onSelect,
  onChangeName,
  onQuickAdd,
  locked,
}: {
  value: string;
  items: Item[];
  onSelect: (item: Item) => void;
  onChangeName: (v: string) => void;
  onQuickAdd: () => void;
  locked?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const active = items.filter((i) => i.active);
  return (
    <div className="flex gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex-1">
            <Input
              value={value}
              onChange={(e) => onChangeName(e.target.value)}
              onFocus={() => !locked && setOpen(true)}
              readOnly={locked}
              placeholder="Search or type item…"
              className={cn("h-9", locked && "bg-muted/50 cursor-not-allowed")}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[320px] p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command>
            <CommandInput placeholder="Search items…" autoFocus />
            <CommandList>
              <CommandEmpty>
                <div className="py-3 text-center text-sm text-muted-foreground">
                  No items match.
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onQuickAdd();
                    }}
                    className="mt-1 block w-full text-primary hover:underline"
                  >
                    + Quick add new item
                  </button>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {active.map((it) => (
                  <CommandItem
                    key={it.id}
                    value={`${it.name} ${it.sku ?? ""}`}
                    onSelect={() => {
                      onSelect(it);
                      setOpen(false);
                    }}
                  >
                    <div className="flex w-full items-center justify-between">
                      <div>
                        <p className="font-medium">{it.name}</p>
                        {it.sku && (
                          <p className="font-mono text-xs text-muted-foreground">{it.sku}</p>
                        )}
                      </div>
                      <span className="tabular-nums text-muted-foreground">{it.sellingPrice}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="h-9 w-9 shrink-0"
        onClick={onQuickAdd}
        aria-label="Quick add item"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ---------- Payment splits editor ----------------------------------------

const PAYMENT_MODES: PaymentMode[] = ["cash", "bank", "upi", "cheque"];
const MAX_PROOF_BYTES = 2 * 1024 * 1024; // 2 MB

function PaymentSplitsEditor({
  splits,
  accounts,
  currency,
  invoiceTotal,
  onChange,
  onRemove,
  onAdd,
  disabled,
}: {
  splits: PaymentSplit[];
  accounts: Account[];
  currency: string;
  invoiceTotal: number;
  onChange: (id: string, patch: Partial<PaymentSplit>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  disabled?: boolean;
}) {
  const paid = splits.reduce((s, p) => s + (p.amount || 0), 0);
  const remaining = Math.max(0, invoiceTotal - paid);

  const handleProof = (id: string, file: File | null) => {
    if (!file) {
      onChange(id, { proofDataUrl: undefined, proofName: undefined });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Proof must be an image");
      return;
    }
    if (file.size > MAX_PROOF_BYTES) {
      toast.error("Proof image must be under 2 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange(id, {
        proofDataUrl: typeof reader.result === "string" ? reader.result : undefined,
        proofName: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      {splits.length === 0 && (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          No payments captured yet. Click <span className="font-medium">Add payment</span> to record
          Cash, Bank, UPI or Cheque receipts.
        </p>
      )}
      {splits.map((s) => {
        const requiresAccount = s.mode !== "cash";
        const requiresProof = s.mode !== "cash";
        const accountOptions = accounts.filter((a) => {
          if (s.mode === "cash") return a.type === "cash";
          if (s.mode === "bank" || s.mode === "cheque") return a.type === "bank";
          if (s.mode === "upi") return a.type === "upi";
          return true;
        });
        return (
          <div key={s.id} className="rounded-xl border border-border bg-card p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_1fr_140px_auto] sm:items-end">
              <div>
                <Label>Mode *</Label>
                <Select
                  value={s.mode}
                  onValueChange={(v) =>
                    onChange(s.id, { mode: v as PaymentMode, accountId: undefined })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_MODES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {PAYMENT_MODE_LABEL[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{requiresAccount ? "Account *" : "Account"}</Label>
                <Select
                  value={s.accountId ?? ""}
                  onValueChange={(v) => onChange(s.id, { accountId: v || undefined })}
                  disabled={disabled || (s.mode === "cash" && accountOptions.length === 0)}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        accountOptions.length === 0
                          ? `No ${PAYMENT_MODE_LABEL[s.mode]} accounts configured`
                          : "Select account…"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {accountOptions.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                        {a.accountNumber
                          ? ` · ${a.accountNumber.slice(-4).padStart(a.accountNumber.length, "•")}`
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount *</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={s.amount || ""}
                  onChange={(e) => onChange(s.id, { amount: Number(e.target.value) })}
                  placeholder="0.00"
                  className="text-right tabular-nums"
                  disabled={disabled}
                />
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-9 w-9 self-end text-destructive hover:bg-destructive/10"
                onClick={() => onRemove(s.id)}
                disabled={disabled}
                aria-label="Remove payment"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Reference {s.mode === "cheque" ? "(cheque no.)" : ""}</Label>
                <Input
                  value={s.reference ?? ""}
                  onChange={(e) => onChange(s.id, { reference: e.target.value })}
                  placeholder={
                    s.mode === "cheque" ? "Cheque #" : s.mode === "upi" ? "UPI txn id" : "Reference"
                  }
                  disabled={disabled}
                />
              </div>
              <div>
                <Label>Proof {requiresProof ? "*" : "(optional)"}</Label>
                {s.proofDataUrl ? (
                  <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 py-1.5">
                    <img
                      src={s.proofDataUrl}
                      alt="proof"
                      className="h-9 w-9 rounded object-cover"
                    />
                    <span className="flex-1 truncate text-xs text-muted-foreground">
                      {s.proofName ?? "Proof image"}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => handleProof(s.id, null)}
                      aria-label="Remove proof"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <label
                    className={cn(
                      "flex h-9 cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-background px-3 text-sm text-muted-foreground hover:bg-muted/40",
                      disabled && "pointer-events-none opacity-50",
                    )}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {requiresProof ? "Upload proof image (required)" : "Upload proof image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleProof(s.id, e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onAdd}
          className="gap-2"
          disabled={disabled}
        >
          <Plus className="h-4 w-4" />
          Add payment
        </Button>
        {splits.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Captured:{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {paid.toFixed(2)} {currency}
            </span>
            {" · "}
            Remaining:{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {remaining.toFixed(2)} {currency}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
