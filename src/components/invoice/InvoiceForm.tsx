import { useEffect, useMemo, useRef, useState } from "react";
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
import { uploadFileToCloudinary } from "@/lib/cloudinary";
import {
  fileToDataUrl,
  parseProofAttachments,
  stringifyProofAttachments,
} from "@/lib/proofAttachments";
import { cn } from "@/lib/utils";
import {
  computeTotals,
  lineMath,
  nextInvoiceNumber,
  canEditInvoice,
  type Invoice,
  type InvoiceType,
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

type PaymentSplit = {
  id: string;
  sourcePaymentId?: string;
  sourceLocked?: boolean;
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
  const {
    payments: paymentRecords,
    hydrated: paymentsHydrated,
    create: createPayment,
    update: updatePayment,
    remove: removePayment,
  } = usePayments(activeId);
  const activeBusiness = businesses.find((b) => b.id === activeId);

  const existing = useMemo(
    () => (invoiceId ? allInvoices.find((i) => i.id === invoiceId) : undefined),
    [invoiceId, allInvoices],
  );

  // -------- Form state ----------------------------------------------------
  const [partyId, setPartyId] = useState("");
  const [number, setNumber] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [invoiceType, setInvoiceType] = useState<InvoiceType>("standard");
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
  const newSplitId = () => `pay_${Math.random().toString(36).slice(2, 9)}`;
  const emptySplit = (): PaymentSplit => ({ id: newSplitId(), mode: "cash", amount: 0 });
  const [payments, setPayments] = useState<PaymentSplit[]>([]);
  const seededPaymentsForInvoiceRef = useRef<string | null>(null);
  const initialSourceSplitsRef = useRef<Record<string, PaymentSplit>>({});
  const updateSplit = (id: string, patch: Partial<PaymentSplit>) =>
    setPayments((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const removeSplit = (id: string) => setPayments((prev) => prev.filter((s) => s.id !== id));

  const didSourceSplitChange = (prev: PaymentSplit | undefined, next: PaymentSplit) => {
    if (!prev) return false;
    return (
      prev.mode !== next.mode ||
      (prev.accountId ?? "") !== (next.accountId ?? "") ||
      Number(prev.amount || 0) !== Number(next.amount || 0) ||
      (prev.reference ?? "").trim() !== (next.reference ?? "").trim() ||
      (prev.notes ?? "").trim() !== (next.notes ?? "").trim() ||
      (prev.proofDataUrl ?? "") !== (next.proofDataUrl ?? "") ||
      (prev.proofName ?? "") !== (next.proofName ?? "")
    );
  };

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
      setInvoiceType(existing.invoiceType ?? "standard");
      setLines(existing.lines.length ? existing.lines : [emptyLine()]);
      setOverallDiscountKind(existing.overallDiscountKind);
      setOverallDiscountValue(existing.overallDiscountValue);
      setNotes(existing.notes ?? "");
      setTermsText(existing.terms ?? "");
      if (seededPaymentsForInvoiceRef.current !== existing.id) {
        // Always wait for payment hydration in edit mode so we do not seed
        // "no payments" too early and accidentally allow duplicate entries.
        if (!paymentsHydrated) return;
        const normalizedInvoiceNumber = existing.number.trim().toLowerCase();
        const matchesCurrentInvoice = (alloc: { docId: string; docNumber: string }) =>
          alloc.docId === existing.id ||
          (alloc.docNumber ?? "").trim().toLowerCase() === normalizedInvoiceNumber;
        const linkedSplitsFromRecords: PaymentSplit[] = paymentRecords
          .filter((p) => {
            const hasAllocationMatch = p.allocations.some(matchesCurrentInvoice);
            const hasReferenceMatch =
              (p.reference ?? "").trim().toLowerCase() === normalizedInvoiceNumber;
            return hasAllocationMatch || hasReferenceMatch;
          })
          .map((p) => ({
            id: `pay_existing_${p.id}`,
            sourcePaymentId: p.id,
            sourceLocked: false,
            mode: p.mode,
            accountId: p.accountId,
            amount: Number(p.allocations.find(matchesCurrentInvoice)?.amount ?? p.amount ?? 0),
            reference: p.reference,
            notes: p.notes,
            proofDataUrl: p.proofDataUrl,
            proofName: p.proofName,
          }));
        const linkedSplits =
          linkedSplitsFromRecords.length > 0 || existing.paidAmount <= 0
            ? linkedSplitsFromRecords
            : [
                {
                  id: `pay_existing_carried_${existing.id}`,
                  sourcePaymentId: `carried_${existing.id}`,
                  sourceLocked: true,
                  mode: "cash" as PaymentMode,
                  amount: Number(existing.paidAmount ?? 0),
                  notes: "Previously captured payment",
                },
              ];
        setPayments(linkedSplits);
        initialSourceSplitsRef.current = Object.fromEntries(
          linkedSplitsFromRecords
            .filter((split) => !!split.sourcePaymentId)
            .map((split) => [split.sourcePaymentId!, split]),
        );
        seededPaymentsForInvoiceRef.current = existing.id;
      }
    } else if (activeId) {
      setNumber(nextInvoiceNumber(allInvoices, activeId));
      if (seededPaymentsForInvoiceRef.current !== null) {
        setPayments([]);
        initialSourceSplitsRef.current = {};
        seededPaymentsForInvoiceRef.current = null;
      }
    }
  }, [existing, hydrated, activeId, allInvoices, ensureLines, paymentRecords, paymentsHydrated]);

  const party = parties.find((p) => p.id === partyId);

  const dueDate = useMemo(() => addDays(date, 0), [date]);

  const totals = useMemo(
    () =>
      computeTotals({
        lines,
        overallDiscountKind,
        overallDiscountValue,
      }),
    [lines, overallDiscountKind, overallDiscountValue],
  );

  // -------- Edit-lock -----------------------------------------------------
  const locked = mode === "edit" && existing ? !canEditInvoice(existing) : false;
  const lockedReason =
    existing?.status === "cancelled"
      ? "Cancelled sales cannot be edited."
      : "Final sales can only be edited within 24 hours of finalising.";

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
   * Allows editing line total directly by back-calculating unit rate.
   * Keeps existing discount kind/value behavior intact.
   */
  const updateLineTotal = (id: string, nextTotal: number) =>
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const safeQty = l.qty > 0 ? l.qty : 1;
        const safeTotal = Math.max(0, Number.isFinite(nextTotal) ? nextTotal : 0);
        let gross = safeTotal;
        if (l.discountKind === "percent") {
          const pct = Math.min(100, Math.max(0, l.discountValue || 0));
          const factor = 1 - pct / 100;
          gross = factor > 0 ? safeTotal / factor : safeTotal;
        } else {
          gross = safeTotal + Math.max(0, l.discountValue || 0);
        }
        const nextRate = Math.max(0, gross / safeQty);
        return { ...l, rate: Number(nextRate.toFixed(2)) };
      }),
    );

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
    if (!number.trim()) return "Sale number is required";
    if (number.trim().toUpperCase().startsWith("CN-")) {
      return "Sale number cannot start with CN- (reserved for credit notes)";
    }
    if (!/^[A-Z0-9-]{1,30}$/i.test(number.trim()))
      return "Sale number can only contain letters, numbers and dashes (max 30)";
    if (
      allInvoices.some(
        (i) =>
          i.businessId === activeId &&
          i.id !== existing?.id &&
          !i.deleted &&
          i.number.toLowerCase() === number.trim().toLowerCase(),
      )
    ) {
      return `Sale number ${number} already exists`;
    }
    if (!lines.length) return "Add at least one item";
    for (const l of lines) {
      if (!l.name.trim()) return "Each line needs an item name";
      if (!(l.qty > 0)) return `Quantity must be greater than 0 for ${l.name}`;
      if (l.rate < 0) return `Price cannot be negative for ${l.name}`;
      if (l.discountValue < 0) return `Discount cannot be negative for ${l.name}`;
      if (l.discountKind === "percent" && l.discountValue > 100)
        return `Discount % cannot exceed 100 for ${l.name}`;
    }
    if (overallDiscountValue < 0) return "Overall discount cannot be negative";
    if (overallDiscountKind === "percent" && overallDiscountValue > 100)
      return "Overall discount % cannot exceed 100";
    // Payment splits
    let paySum = 0;
    let additionalPaySum = 0;
    const existingPaidAmount = existing?.paidAmount ?? 0;
    const outstandingLimit = Math.max(0, totals.total - existingPaidAmount);
    for (const s of payments) {
      if (!(s.amount > 0)) return "Each payment row must have an amount > 0";
      if (s.sourcePaymentId && s.sourceLocked) {
        paySum += Math.max(0, s.amount || 0);
        continue;
      }
      if (!s.accountId)
        return `Select a ${s.mode === "cash" ? "cash" : PAYMENT_MODE_LABEL[s.mode]} account for the payment`;
      if (s.mode !== "cash" && !s.proofDataUrl)
        return `Upload an attachment for the ${PAYMENT_MODE_LABEL[s.mode]} payment`;
      paySum += s.amount;
      if (!s.sourcePaymentId) additionalPaySum += s.amount;
    }
    if (paySum - 0.001 > totals.total)
      return `Payments (${paySum.toFixed(2)}) exceed invoice total (${totals.total.toFixed(2)})`;
    if (additionalPaySum - 0.001 > outstandingLimit)
      return `New payment (${additionalPaySum.toFixed(2)}) exceeds outstanding balance (${outstandingLimit.toFixed(2)}).`;
    return null;
  };

  const buildInvoice = (status: Invoice["status"]): Invoice => {
    const isFinal = status === "final";
    const paidAmount =
      status === "final" ? payments.reduce((s, p) => s + Math.max(0, p.amount || 0), 0) : 0;
    return {
      id: existing?.id ?? `inv_${Date.now()}`,
      businessId: existing?.businessId ?? activeId!,
      number: number.trim(),
      date: date.toISOString(),
      dueDate: dueDate.toISOString(),
      paymentTermsDays: undefined,
      invoiceType,
      partyId,
      partyName: party?.name ?? "",
      partyState: party?.state,
      businessState: activeBusiness?.state,
      lines,
      overallDiscountKind,
      overallDiscountValue,
      ...totals,
      paidAmount,
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
      const draftInv = buildInvoice(status);
      const savedInv = await upsert(draftInv);
      const inv = savedInv ?? draftInv;
      if (status === "final") {
        const currentSourceSplits = payments.filter((p) => p.sourcePaymentId && !p.sourceLocked);
        const currentSourceIds = new Set(currentSourceSplits.map((p) => p.sourcePaymentId!));
        const removedSourceIds = Object.keys(initialSourceSplitsRef.current).filter(
          (id) => !currentSourceIds.has(id),
        );
        for (const sourcePaymentId of removedSourceIds) {
          await removePayment(sourcePaymentId);
        }
        for (const split of currentSourceSplits) {
          const sourcePaymentId = split.sourcePaymentId!;
          const original = initialSourceSplitsRef.current[sourcePaymentId];
          if (!didSourceSplitChange(original, split)) continue;
          const selectedAccount = split.accountId
            ? accounts.find((a) => a.id === split.accountId)
            : undefined;
          await updatePayment(sourcePaymentId, {
            partyId: inv.partyId || "_advance",
            direction: "in",
            date: inv.date,
            amount: split.amount,
            mode: split.mode,
            accountId: split.accountId,
            account: selectedAccount?.name,
            reference: split.reference?.trim() || undefined,
            notes: split.notes?.trim() || undefined,
            proofDataUrl: split.proofDataUrl,
            proofName: split.proofName,
            allocations: [{ docId: inv.id, docNumber: inv.number, amount: split.amount }],
          });
        }
        const validSplits = payments.filter((p) => !p.sourcePaymentId && p.amount > 0);
        for (const split of validSplits) {
          const selectedAccount = split.accountId
            ? accounts.find((a) => a.id === split.accountId)
            : undefined;
          await createPayment({
            businessId: inv.businessId,
            partyId: inv.partyId || "_advance",
            direction: "in",
            date: inv.date,
            amount: split.amount,
            mode: split.mode,
            accountId: split.accountId,
            account: selectedAccount?.name,
            reference: split.reference?.trim() || undefined,
            notes: split.notes?.trim() || undefined,
            proofDataUrl: split.proofDataUrl,
            proofName: split.proofName,
            allocations: [{ docId: inv.id, docNumber: inv.number, amount: split.amount }],
          });
        }
        initialSourceSplitsRef.current = Object.fromEntries(
          payments
            .filter((p) => !!p.sourcePaymentId && !p.sourceLocked)
            .map((p) => [p.sourcePaymentId!, p]),
        );
      }
      toast.success(
        status === "final" ? `Sale ${inv.number} finalised` : `Draft ${inv.number} saved`,
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
                {mode === "edit" ? "Edit Sale" : "New Sale"}
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
            <strong className="font-semibold">This sale is locked.</strong> {lockedReason}
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

        {/* 2. Sale meta --------------------------------------------------- */}
        <FormSection step={2} title="Sale Details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="number">Sale number *</Label>
              <Input
                id="number"
                value={number}
                onChange={(e) => setNumber(e.target.value.toUpperCase())}
                readOnly={mode === "edit"}
                placeholder="INV-0001"
                className={cn(
                  "font-mono",
                  mode === "edit" && "cursor-not-allowed bg-muted/50 text-muted-foreground",
                )}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {mode === "edit"
                  ? "Auto-generated and locked."
                  : "Auto-generated. Edit if needed — duplicates are blocked."}
              </p>
            </div>
            <div>
              <Label htmlFor="invoiceType">Invoice type *</Label>
              <Select value={invoiceType} onValueChange={(v) => setInvoiceType(v as InvoiceType)}>
                <SelectTrigger id="invoiceType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="advance">Advance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sale date</Label>
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
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Unit Price</th>
                  <th className="px-3 py-2 text-right">Total Price</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lines.map((line) => {
                  const m = lineMath(line);
                  const catalog = line.itemId ? items.find((x) => x.id === line.itemId) : undefined;
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
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={m.taxable}
                          onChange={(e) => updateLineTotal(line.id, Number(e.target.value))}
                          className="h-9 text-right tabular-nums font-semibold"
                        />
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

        {/* 4. Summary ----------------------------------------------------- */}
        <FormSection step={4} title="Summary" description="Review the invoice total before saving.">
          <div className="flex justify-end">
            <dl className="w-full max-w-sm space-y-2 rounded-xl border border-border bg-card p-4 text-sm">
              <Row label="Subtotal" value={formatCurrency(totals.subtotal, currency)} />
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
            alreadyPaidAmount={existing?.paidAmount ?? 0}
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
              onPointerDown={(e) => {
                if (locked) return;
                // PopoverTrigger toggles on the same gesture; without this, onFocus
                // opens then the trigger immediately closes the popover.
                e.stopPropagation();
              }}
              onClick={(e) => {
                if (locked) return;
                e.stopPropagation();
                setOpen(true);
              }}
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

const PAYMENT_MODES: PaymentMode[] = ["cash", "bank", "cheque"];
const MAX_PROOF_BYTES = 2 * 1024 * 1024; // 2 MB

function PaymentSplitsEditor({
  splits,
  accounts,
  currency,
  invoiceTotal,
  alreadyPaidAmount,
  onChange,
  onRemove,
  onAdd,
  disabled,
}: {
  splits: PaymentSplit[];
  accounts: Account[];
  currency: string;
  invoiceTotal: number;
  alreadyPaidAmount: number;
  onChange: (id: string, patch: Partial<PaymentSplit>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  disabled?: boolean;
}) {
  const existingPaid = splits
    .filter((p) => !!p.sourcePaymentId)
    .reduce((s, p) => s + (p.amount || 0), 0);
  const additionalPaid = splits
    .filter((p) => !p.sourcePaymentId)
    .reduce((s, p) => s + (p.amount || 0), 0);
  const effectiveAlreadyPaid = Math.max(alreadyPaidAmount, existingPaid);
  const paid = effectiveAlreadyPaid + additionalPaid;
  const remaining = Math.max(0, invoiceTotal - paid);
  const [uploadingProofIds, setUploadingProofIds] = useState<Record<string, boolean>>({});

  const handleImage = async (id: string, file: File | null) => {
    const current = splits.find((x) => x.id === id);
    const parsed = parseProofAttachments(current?.proofDataUrl, current?.proofName);
    if (!file) {
      onChange(id, {
        ...stringifyProofAttachments({
          ...parsed,
          imageUrl: undefined,
          imageName: undefined,
        }),
      });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Attachment image must be an image file");
      return;
    }
    if (file.size > MAX_PROOF_BYTES) {
      toast.error("Attachment image must be under 2 MB");
      return;
    }
    setUploadingProofIds((prev) => ({ ...prev, [id]: true }));
    try {
      let imageUrl: string;
      let imageName: string;
      try {
        const uploaded = await uploadFileToCloudinary(file, "image");
        imageUrl = uploaded.secureUrl;
        imageName = uploaded.originalFilename;
      } catch {
        // Mobile/offline fallback: keep attachment locally when Cloudinary is unreachable.
        imageUrl = await fileToDataUrl(file);
        imageName = file.name;
        toast.warning("Cloud upload unavailable. Image stored locally.");
      }
      onChange(
        id,
        stringifyProofAttachments({
          ...parsed,
          imageUrl,
          imageName,
        }),
      );
      toast.success("Attachment image uploaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload attachment image";
      toast.error(message);
    } finally {
      setUploadingProofIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleDocument = async (id: string, file: File | null) => {
    const current = splits.find((x) => x.id === id);
    const parsed = parseProofAttachments(current?.proofDataUrl, current?.proofName);
    if (!file) {
      onChange(
        id,
        stringifyProofAttachments({
          ...parsed,
          documentUrl: undefined,
          documentName: undefined,
        }),
      );
      return;
    }
    if (!/\.(pdf|doc|docx|xls|xlsx|txt)$/i.test(file.name)) {
      toast.error("Document must be PDF, DOC, DOCX, XLS, XLSX or TXT");
      return;
    }
    if (file.size > MAX_PROOF_BYTES) {
      toast.error("Attachment document must be under 2 MB");
      return;
    }
    setUploadingProofIds((prev) => ({ ...prev, [id]: true }));
    try {
      const dataUrl = await fileToDataUrl(file);
      onChange(
        id,
        stringifyProofAttachments({
          ...parsed,
          documentUrl: dataUrl,
          documentName: file.name,
        }),
      );
      toast.success("Attachment document stored in database");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload attachment document";
      toast.error(message);
    } finally {
      setUploadingProofIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleAdditionalDocument = async (id: string, file: File | null) => {
    const current = splits.find((x) => x.id === id);
    const parsed = parseProofAttachments(current?.proofDataUrl, current?.proofName);
    if (!file) {
      onChange(
        id,
        stringifyProofAttachments({
          ...parsed,
          additionalDocumentUrl: undefined,
          additionalDocumentName: undefined,
        }),
      );
      return;
    }
    if (!/\.(pdf|doc|docx|xls|xlsx|txt)$/i.test(file.name)) {
      toast.error("Document must be PDF, DOC, DOCX, XLS, XLSX or TXT");
      return;
    }
    if (file.size > MAX_PROOF_BYTES) {
      toast.error("Attachment document must be under 2 MB");
      return;
    }
    setUploadingProofIds((prev) => ({ ...prev, [id]: true }));
    try {
      const dataUrl = await fileToDataUrl(file);
      onChange(
        id,
        stringifyProofAttachments({
          ...parsed,
          additionalDocumentUrl: dataUrl,
          additionalDocumentName: file.name,
        }),
      );
      toast.success("Additional attachment document stored in database");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload additional attachment document";
      toast.error(message);
    } finally {
      setUploadingProofIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
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
        const uploadingProof = Boolean(uploadingProofIds[s.id]);
        const proof = parseProofAttachments(s.proofDataUrl, s.proofName);
        const isLockedSource = Boolean(s.sourcePaymentId && s.sourceLocked);
        const requiresAccount = s.mode !== "cash";
        const requiresProof = s.mode !== "cash";
        const accountOptions = accounts.filter((a) => {
          if (s.mode === "cash") return a.type === "cash";
          if (s.mode === "bank" || s.mode === "cheque") return a.type === "bank";
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
                  disabled={disabled || isLockedSource}
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
                  disabled={
                    disabled ||
                    isLockedSource ||
                    (s.mode === "cash" && accountOptions.length === 0)
                  }
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
                disabled={disabled || isLockedSource}
                aria-label="Remove payment"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {isLockedSource && (
              <p className="mt-2 text-xs text-muted-foreground">
                Previously recorded payment (legacy entry). You can edit only the amount here.
              </p>
            )}
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Reference {s.mode === "cheque" ? "(cheque no.)" : ""}</Label>
                <Input
                  value={s.reference ?? ""}
                  onChange={(e) => onChange(s.id, { reference: e.target.value })}
                  placeholder={s.mode === "cheque" ? "Cheque #" : "Reference"}
                  disabled={disabled || isLockedSource}
                />
              </div>
              <div>
                <Label>Attachments {requiresProof ? "*" : "(optional)"}</Label>
                {proof.imageUrl ? (
                  <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 py-1.5">
                    <img
                      src={proof.imageUrl}
                      alt="proof"
                      className="h-9 w-9 rounded object-cover"
                    />
                    <span className="flex-1 truncate text-xs text-muted-foreground">
                      {proof.imageName ?? "Attachment image"}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => handleImage(s.id, null)}
                      disabled={disabled || isLockedSource || uploadingProof}
                      aria-label="Remove proof"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <label
                    className={cn(
                      "flex h-9 cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-background px-3 text-sm text-muted-foreground hover:bg-muted/40",
                      (disabled || isLockedSource) && "pointer-events-none opacity-50",
                    )}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {requiresProof ? "Upload image (required)" : "Upload image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={disabled || isLockedSource || uploadingProof}
                      onChange={(e) => handleImage(s.id, e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
                {proof.documentUrl ? (
                  <div className="mt-2 flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 py-1.5">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Document 1
                    </span>
                    <span className="flex-1 truncate text-xs text-muted-foreground">
                      {proof.documentName ?? "Attachment document"}
                    </span>
                    <a
                      href={proof.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      View
                    </a>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => handleDocument(s.id, null)}
                      disabled={disabled || isLockedSource || uploadingProof}
                      aria-label="Remove document"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <label
                    className={cn(
                      "mt-2 flex h-9 cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-background px-3 text-sm text-muted-foreground hover:bg-muted/40",
                      (disabled || isLockedSource) && "pointer-events-none opacity-50",
                    )}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload document 1
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                      className="hidden"
                      disabled={disabled || isLockedSource || uploadingProof}
                      onChange={(e) => handleDocument(s.id, e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
                {proof.additionalDocumentUrl ? (
                  <div className="mt-2 flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 py-1.5">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Document 2
                    </span>
                    <span className="flex-1 truncate text-xs text-muted-foreground">
                      {proof.additionalDocumentName ?? "Additional attachment document"}
                    </span>
                    <a
                      href={proof.additionalDocumentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      View
                    </a>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => handleAdditionalDocument(s.id, null)}
                      disabled={disabled || isLockedSource || uploadingProof}
                      aria-label="Remove additional document"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <label
                    className={cn(
                      "mt-2 flex h-9 cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-background px-3 text-sm text-muted-foreground hover:bg-muted/40",
                      (disabled || isLockedSource) && "pointer-events-none opacity-50",
                    )}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload document 2
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                      className="hidden"
                      disabled={disabled || isLockedSource || uploadingProof}
                      onChange={(e) => handleAdditionalDocument(s.id, e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
                {uploadingProof && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Uploading attachment to Cloudinary...
                  </p>
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
