import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowLeft, Loader2, Plus, Save, Send, Trash2, UserPlus, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { FormSection } from "@/components/business/FormSection";
import { QuickAddPartyDialog } from "@/components/party/QuickAddPartyDialog";
import { PartyPicker } from "@/components/party/PartyPicker";
import { QuickAddItemDialog } from "@/components/item/QuickAddItemDialog";
import { ItemLinePicker } from "@/components/item/ItemLinePicker";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { ProofUpload } from "@/components/proof/ProofUpload";

import { useBusinesses } from "@/hooks/useBusinesses";
import { useParties, formatCurrency } from "@/hooks/useParties";
import { useItems } from "@/hooks/useItems";
import { usePurchases } from "@/hooks/usePurchases";
import { usePayments } from "@/hooks/usePayments";
import { useAccounts } from "@/hooks/useAccounts";
import { cn } from "@/lib/utils";
import { computeTotals, lineMath, type DiscountKind } from "@/types/invoice";
import {
  nextPurchaseNumber,
  canEditPurchase,
  type PurchasePaymentMode,
  type PurchaseCategory,
  type Purchase,
  type PurchaseLine,
} from "@/types/purchase";
import type { Item } from "@/types/item";
import { ACCOUNT_TYPE_LABEL } from "@/types/account";
import {
  accountsForPaymentPicker,
  allocationMatchesDocument,
  formatAccountOptionLabel,
  isImportLedgerPayment,
} from "@/lib/paymentAccounts";

interface Props {
  mode: "new" | "edit";
  purchaseId?: string;
}

type PurchasePaymentSplit = {
  id: string;
  sourcePaymentId?: string;
  sourceLocked?: boolean;
  amount: number;
};

function emptyLine(): PurchaseLine {
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

const LIST_SEARCH = {
  to: "/purchases" as const,
  search: { q: "", status: "all" as const, from: "", to: "" },
};

export function PurchaseForm({ mode, purchaseId }: Props) {
  const navigate = useNavigate();
  const { businesses, activeId } = useBusinesses();
  const businessIds = useMemo(() => businesses.map((b) => b.id), [businesses]);
  const { parties } = useParties(activeId);
  const { items, upsert: upsertItem, remove: removeItem } = useItems(activeId);
  const { allPurchases, upsert, hydrated, ensureLines } = usePurchases(activeId);
  const {
    payments: paymentRecords,
    hydrated: paymentsHydrated,
    create: createPayment,
    update: updatePayment,
    remove: removePayment,
  } = usePayments(null);
  const { accounts } = useAccounts(null, businessIds);
  const activeBusiness = businesses.find((b) => b.id === activeId);

  // Show all parties (party-type concept removed).
  const suppliers = parties;

  const existing = useMemo(
    () => (purchaseId ? allPurchases.find((p) => p.id === purchaseId) : undefined),
    [purchaseId, allPurchases],
  );

  // -------- Form state ----------------------------------------------------
  const [partyId, setPartyId] = useState("");
  const [number, setNumber] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [lines, setLines] = useState<PurchaseLine[]>([emptyLine()]);
  const [overallDiscountKind, setOverallDiscountKind] = useState<DiscountKind>("percent");
  const [overallDiscountValue, setOverallDiscountValue] = useState<number>(0);
  const [totalOverride, setTotalOverride] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [termsText, setTermsText] = useState("");
  const [purchaseCategory, setPurchaseCategory] = useState<PurchaseCategory>("short-term");
  const [purchasePaymentMode, setPurchasePaymentMode] = useState<PurchasePaymentMode>("cash");
  const [purchaseAccountId, setPurchaseAccountId] = useState<string>("");
  const [proofDataUrl, setProofDataUrl] = useState<string | undefined>(undefined);
  const [proofName, setProofName] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const [quickPartyOpen, setQuickPartyOpen] = useState(false);
  const [quickItemForRow, setQuickItemForRow] = useState<string | null>(null);
  const [quickAssetOpen, setQuickAssetOpen] = useState(false);
  const [paymentSplits, setPaymentSplits] = useState<PurchasePaymentSplit[]>([]);
  const seededPaymentsForPurchaseRef = useRef<string | null>(null);
  const initialSourceSplitsRef = useRef<Record<string, PurchasePaymentSplit>>({});
  const paymentPickerAccounts = useMemo(() => accountsForPaymentPicker(accounts), [accounts]);
  const showAccountBusiness = businesses.length > 1;
  const businessById = useMemo(
    () => Object.fromEntries(businesses.map((b) => [b.id, b.name])),
    [businesses],
  );
  const paymentAccounts = useMemo(
    () =>
      purchasePaymentMode === "cash"
        ? paymentPickerAccounts.filter((a) => a.type === "cash")
        : paymentPickerAccounts.filter((a) => a.type === "bank"),
    [purchasePaymentMode, paymentPickerAccounts],
  );

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
      setDueDate(existing.dueDate ? new Date(existing.dueDate) : undefined);
      setLines(existing.lines.length ? existing.lines : [emptyLine()]);
      setOverallDiscountKind(existing.overallDiscountKind);
      setOverallDiscountValue(existing.overallDiscountValue);
      setTotalOverride(null);
      setNotes(existing.notes ?? "");
      setTermsText(existing.terms ?? "");
      setPurchaseCategory(existing.purchaseCategory ?? "short-term");
      setProofDataUrl(existing.proofDataUrl);
      setProofName(existing.proofName);
      if (seededPaymentsForPurchaseRef.current !== existing.id) {
        if (!paymentsHydrated) return;
        const matchesCurrentPurchase = (alloc: { docId: string; docNumber: string }) =>
          allocationMatchesDocument(alloc, existing.id, existing.number);
        const linkedPayments = paymentRecords.filter(
          (p) =>
            p.direction === "out" &&
            !isImportLedgerPayment(p) &&
            p.allocations.some(matchesCurrentPurchase),
        );
        const importOnlyPaid =
          paymentRecords
            .filter(
              (p) =>
                p.direction === "out" &&
                isImportLedgerPayment(p) &&
                p.allocations.some(matchesCurrentPurchase),
            )
            .reduce((sum, p) => {
              const alloc = p.allocations.find(matchesCurrentPurchase);
              return sum + Number(alloc?.amount ?? p.amount ?? 0);
            }, 0) > 0;
        const linkedSplitsFromRecords: PurchasePaymentSplit[] = linkedPayments.map((p) => ({
          id: `pay_existing_${p.id}`,
          sourcePaymentId: p.id,
          sourceLocked: false,
          amount: Number(p.allocations.find(matchesCurrentPurchase)?.amount ?? p.amount ?? 0),
        }));
        const linkedSplits =
          linkedSplitsFromRecords.length > 0 || existing.paidAmount <= 0 || importOnlyPaid
            ? linkedSplitsFromRecords
            : [
                {
                  id: `pay_existing_carried_${existing.id}`,
                  sourcePaymentId: `carried_${existing.id}`,
                  sourceLocked: true,
                  amount: Number(existing.paidAmount ?? 0),
                },
              ];
        setPaymentSplits(linkedSplits);
        initialSourceSplitsRef.current = Object.fromEntries(
          linkedSplitsFromRecords.map((split) => [split.sourcePaymentId!, split]),
        );
        const primaryPayment = linkedPayments[0];
        if (primaryPayment) {
          if (primaryPayment.accountId) setPurchaseAccountId(primaryPayment.accountId);
          setPurchasePaymentMode(primaryPayment.mode);
        } else {
          setPurchasePaymentMode(existing.purchasePaymentMode ?? "cash");
        }
        seededPaymentsForPurchaseRef.current = existing.id;
      }
    } else if (activeId) {
      setNumber(nextPurchaseNumber(allPurchases, activeId));
      setTotalOverride(null);
      setPaymentSplits([]);
      initialSourceSplitsRef.current = {};
      seededPaymentsForPurchaseRef.current = null;
    }
  }, [existing, hydrated, activeId, allPurchases, ensureLines, paymentRecords, paymentsHydrated]);

  const party = parties.find((p) => p.id === partyId);

  // Default account on new purchases only.
  useEffect(() => {
    if (existing) return;
    if (purchaseAccountId && paymentAccounts.some((a) => a.id === purchaseAccountId)) return;
    if (paymentAccounts[0]?.id) setPurchaseAccountId(paymentAccounts[0].id);
  }, [existing, purchasePaymentMode, paymentAccounts, purchaseAccountId]);

  const onPurchasePaymentModeChange = (next: PurchasePaymentMode) => {
    setPurchasePaymentMode(next);
    const opts =
      next === "cash"
        ? paymentPickerAccounts.filter((a) => a.type === "cash")
        : paymentPickerAccounts.filter((a) => a.type === "bank");
    const keepCurrent = !!purchaseAccountId && opts.some((a) => a.id === purchaseAccountId);
    if (!keepCurrent) setPurchaseAccountId(opts[0]?.id ?? "");
  };

  const totals = useMemo(
    () =>
      computeTotals({
        lines,
        overallDiscountKind,
        overallDiscountValue,
      }),
    [lines, overallDiscountKind, overallDiscountValue],
  );
  const preDiscountTotal = useMemo(
    () => Math.max(0, totals.taxableValue + totals.overallDiscountAmount),
    [totals.taxableValue, totals.overallDiscountAmount],
  );
  const effectiveTotal = useMemo(
    () => Math.max(0, totalOverride ?? totals.total),
    [totalOverride, totals.total],
  );
  const capturedAmount = useMemo(
    () => paymentSplits.reduce((sum, s) => sum + Math.max(0, s.amount || 0), 0),
    [paymentSplits],
  );
  const balanceAmount = Math.max(0, effectiveTotal - capturedAmount);

  // -------- Edit-lock -----------------------------------------------------
  const locked = mode === "edit" && existing ? !canEditPurchase(existing) : false;
  const lockedReason =
    existing?.status === "cancelled"
      ? "Cancelled purchases cannot be edited."
      : "Final purchases can only be edited within 24 hours of finalising.";

  // -------- Line helpers --------------------------------------------------
  const updateLine = (id: string, patch: Partial<PurchaseLine>) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (id: string) =>
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((l) => l.id !== id)));

  const applyItemToLine = (lineId: string, item: Item) =>
    updateLine(lineId, {
      itemId: item.id,
      name: item.name,
      unit: item.unit,
      // Use purchase price when available, else fall back to selling price.
      rate: item.purchasePrice ?? item.sellingPrice,
      taxPercent: item.taxPercent,
    });

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

  const updatePurchaseTotal = (nextTotal: number) => {
    const safeTarget = Math.max(0, Number.isFinite(nextTotal) ? nextTotal : 0);
    setTotalOverride(Number(safeTarget.toFixed(2)));
  };

  const updateCapturedAmount = (nextAmount: number) => {
    const safe = Math.max(0, Number.isFinite(nextAmount) ? nextAmount : 0);
    const bounded = Math.min(effectiveTotal, safe);
    setPaymentSplits((prev) => {
      if (prev.length === 0) return [{ id: `pay_manual_${Date.now()}`, amount: bounded }];
      if (prev.length === 1) return [{ ...prev[0], amount: bounded }];
      const sourceIndex = prev.findIndex((s) => !!s.sourcePaymentId && !s.sourceLocked);
      const indexToUpdate = sourceIndex >= 0 ? sourceIndex : 0;
      return prev.map((s, idx) => (idx === indexToUpdate ? { ...s, amount: bounded } : s));
    });
  };

  // -------- Validation ----------------------------------------------------
  const validate = (): string | null => {
    if (!activeId) return "Select an active business first";
    if (!partyId) return "Please select a party";
    if (!number.trim()) return "Purchase number is required";
    if (!purchaseCategory) return "Select purchase category";
    if (!purchasePaymentMode) return "Select payment type";
    if (!purchaseAccountId)
      return `Select a ${purchasePaymentMode === "cash" ? "cash" : "bank"} account`;
    if (
      allPurchases.some(
        (p) =>
          p.businessId === activeId &&
          p.id !== existing?.id &&
          !p.deleted &&
          p.number.toLowerCase() === number.trim().toLowerCase(),
      )
    ) {
      return `Purchase number ${number} already exists`;
    }
    if (!lines.length) return "Add at least one item";
    for (const l of lines) {
      if (!l.name.trim()) return "Each line needs an item name";
      if (!(l.qty > 0)) return `Quantity must be greater than 0 for ${l.name}`;
      if (l.qty > 1000) return `Quantity cannot exceed 1000 for ${l.name}`;
      if (l.rate < 0) return `Price cannot be negative for ${l.name}`;
    }
    if (capturedAmount - 0.001 > effectiveTotal) {
      return `Captured amount (${capturedAmount.toFixed(2)}) cannot exceed total (${effectiveTotal.toFixed(2)})`;
    }
    return null;
  };

  const buildPurchase = (status: Purchase["status"]): Purchase => {
    const isFinal = status === "final";
    const paidAmount = status === "final" ? capturedAmount : 0;
    return {
      id: existing?.id ?? `pur_${Date.now()}`,
      businessId: existing?.businessId ?? activeId!,
      number: number.trim(),
      date: date.toISOString(),
      dueDate: dueDate ? dueDate.toISOString() : undefined,
      partyId,
      partyName: party?.name ?? "",
      partyState: party?.state,
      businessState: activeBusiness?.state,
      lines,
      overallDiscountKind,
      overallDiscountValue,
      ...totals,
      taxableValue: effectiveTotal,
      total: effectiveTotal,
      paidAmount,
      status,
      proofDataUrl,
      proofName,
      deleted: existing?.deleted,
      notes: notes.trim() || undefined,
      terms: termsText.trim() || undefined,
      finalizedAt: isFinal
        ? (existing?.finalizedAt ?? new Date().toISOString())
        : existing?.finalizedAt,
      purchaseCategory,
      purchasePaymentMode,
    };
  };

  const syncAssetsForPurchaseCategory = async (purchase: Purchase) => {
    if (purchase.kind === "return") return;
    const sourceTag = `[AUTO_ASSET_SOURCE:${purchase.id}]`;
    const linkedAssets = items.filter(
      (it) => it.type === "product" && (it.description ?? "").includes(sourceTag),
    );

    // Purchases should not auto-create or sync assets anymore.
    for (const asset of linkedAssets) {
      await removeItem(asset.id);
    }
  };

  const handleSave = async (status: Purchase["status"]) => {
    if (locked) {
      toast.error(lockedReason);
      return;
    }
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    if (status === "final" && !proofDataUrl) {
      toast.error("Upload a bill / proof image before finalising");
      return;
    }
    setSubmitting(true);
    try {
      const draft = buildPurchase(status);
      const saved = await upsert(draft);
      const p = saved ?? draft;
      const selectedPaymentAccount = paymentAccounts.find((a) => a.id === purchaseAccountId);
      if (status === "final") {
        const sourceSplits = paymentSplits.filter((s) => !!s.sourcePaymentId && !s.sourceLocked);
        const sourceIds = sourceSplits.map((s) => s.sourcePaymentId!);
        const removedSourceIds = Object.keys(initialSourceSplitsRef.current).filter(
          (id) => !sourceIds.includes(id),
        );
        for (const sourceId of removedSourceIds) {
          await removePayment(sourceId);
        }
        const editableSource = sourceSplits[0]?.sourcePaymentId;
        const nextCapture = Math.max(0, p.paidAmount);
        if (editableSource) {
          if (nextCapture <= 0) {
            await removePayment(editableSource);
          } else {
            const original = initialSourceSplitsRef.current[editableSource];
            const sourcePayment = paymentRecords.find((payment) => payment.id === editableSource);
            const sourceAllocation = sourcePayment?.allocations.find(
              (alloc) =>
                allocationMatchesDocument(
                  alloc,
                  existing?.id ?? p.id,
                  existing?.number ?? p.number,
                ) || allocationMatchesDocument(alloc, p.id, p.number),
            );
            const allocationChanged =
              Number(original?.amount || 0) !== Number(nextCapture || 0) ||
              (sourceAllocation != null &&
                (sourceAllocation.docId !== p.id || sourceAllocation.docNumber !== p.number));
            const paymentPatch: Parameters<typeof updatePayment>[1] = {};
            const nextPartyId = p.partyId || "_advance";
            const nextNotes = `Auto payment from purchase ${p.number}`;
            if ((sourcePayment?.partyId ?? "_advance") !== nextPartyId) {
              paymentPatch.partyId = nextPartyId;
            }
            if (sourcePayment?.direction !== "out") paymentPatch.direction = "out";
            if (sourcePayment?.date !== p.date) paymentPatch.date = p.date;
            if (Number(sourcePayment?.amount ?? 0) !== Number(nextCapture || 0)) {
              paymentPatch.amount = nextCapture;
            }
            if (sourcePayment?.mode !== purchasePaymentMode) {
              paymentPatch.mode = purchasePaymentMode;
            }
            if ((sourcePayment?.accountId ?? "") !== (purchaseAccountId ?? "")) {
              paymentPatch.accountId = purchaseAccountId;
              paymentPatch.account = selectedPaymentAccount?.name;
            }
            if ((sourcePayment?.reference ?? "") !== p.number) paymentPatch.reference = p.number;
            if ((sourcePayment?.notes ?? "") !== nextNotes) paymentPatch.notes = nextNotes;
            if ((sourcePayment?.proofDataUrl ?? "") !== (proofDataUrl ?? "")) {
              paymentPatch.proofDataUrl = proofDataUrl;
            }
            if ((sourcePayment?.proofName ?? "") !== (proofName ?? "")) {
              paymentPatch.proofName = proofName;
            }
            if (allocationChanged) {
              paymentPatch.allocations = [
                { docId: p.id, docNumber: p.number, amount: nextCapture },
              ];
            }
            if (Object.keys(paymentPatch).length > 0) {
              await updatePayment(editableSource, paymentPatch);
            }
          }
          for (const extra of sourceSplits.slice(1)) {
            if (extra.sourcePaymentId) await removePayment(extra.sourcePaymentId);
          }
        } else if (nextCapture > 0) {
          await createPayment({
            businessId: p.businessId,
            partyId: p.partyId || "_advance",
            direction: "out",
            date: p.date,
            amount: nextCapture,
            mode: purchasePaymentMode,
            accountId: purchaseAccountId,
            account: selectedPaymentAccount?.name,
            reference: p.number,
            notes: `Auto payment from purchase ${p.number}`,
            proofDataUrl,
            proofName,
            allocations: [{ docId: p.id, docNumber: p.number, amount: nextCapture }],
          });
        }
      }
      if (status === "final") {
        await syncAssetsForPurchaseCategory(p);
      }
      toast.success(
        status === "final" ? `Purchase ${p.number} finalised` : `Draft ${p.number} saved`,
      );
      navigate(LIST_SEARCH);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save purchase";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const currency = activeBusiness?.currency ?? "INR";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background pb-32">
      <header className="sticky top-16 z-10 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Button asChild size="icon" variant="ghost" className="h-9 w-9">
              <Link {...LIST_SEARCH} aria-label="Back">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium uppercase tracking-widest text-muted-foreground sm:text-xs">
                {activeBusiness?.name ?? "Workspace"}
              </p>
              <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight sm:text-2xl">
                {mode === "edit" ? "Edit Purchase" : "New Purchase"}
                {locked && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    Locked
                  </span>
                )}
              </h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            <Button variant="ghost" onClick={() => navigate(LIST_SEARCH)}>
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

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        {locked && (
          <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning-foreground/80">
            <strong className="font-semibold">This purchase is locked.</strong> {lockedReason}
          </div>
        )}

        {/* 1. Party --------------------------------------------------------- */}
        <FormSection step={1} title="Party" description="Who are you buying from?">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label>Party *</Label>
              <PartyPicker
                parties={suppliers}
                value={partyId || null}
                onChange={setPartyId}
                disabled={locked}
              />
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

        {/* 2. Purchase meta ------------------------------------------------- */}
        <FormSection step={2} title="Purchase Details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
            <div>
              <Label htmlFor="number">Purchase number *</Label>
              <Input
                id="number"
                value={number}
                onChange={(e) => setNumber(e.target.value.toUpperCase())}
                placeholder="PUR-0001"
                className="font-mono"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Auto-generated. Edit if needed — duplicates are blocked.
              </p>
            </div>
            <div>
              <Label>Purchase date</Label>
              <DatePickerField
                value={date}
                onChange={(d) => d && setDate(d)}
                title="Purchase date"
              />
            </div>
            <div>
              <Label>Category *</Label>
              <Select
                value={purchaseCategory}
                onValueChange={(v) => setPurchaseCategory(v as PurchaseCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short-term">Short-term</SelectItem>
                  <SelectItem value="long-term">Long-term</SelectItem>
                </SelectContent>
              </Select>
              {purchaseCategory === "long-term" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Finalizing this purchase will also create asset records for each line.
                </p>
              )}
            </div>
            <div>
              <Label>Payment type *</Label>
              <Select
                value={purchasePaymentMode}
                onValueChange={(v) => onPurchasePaymentModeChange(v as PurchasePaymentMode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{purchasePaymentMode === "cash" ? "Cash account" : "Bank account"} *</Label>
              {paymentAccounts.length === 0 ? (
                <p className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  No {purchasePaymentMode === "cash" ? "cash" : "bank"} accounts yet. Add one in
                  Accounts first.
                </p>
              ) : (
                <Select value={purchaseAccountId} onValueChange={setPurchaseAccountId}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={`Select ${purchasePaymentMode === "cash" ? "cash" : "bank"} account`}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentAccounts.map((a) => (
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
              <Label>Due date (optional)</Label>
              <DatePickerField
                value={dueDate}
                onChange={setDueDate}
                placeholder="Not set"
                clearable
                title="Due date"
                buttonClassName="text-white hover:text-white"
              />
            </div>
          </div>
        </FormSection>

        {/* 3. Items -------------------------------------------------------- */}
        <FormSection
          step={3}
          title="Items"
          description="Each row becomes a line on the purchase bill."
        >
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Item</th>
                  <th className="px-3 py-2 text-left">Unit</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Unit price</th>
                  <th className="px-3 py-2 text-left" colSpan={2}>
                    Discount
                  </th>
                  <th className="px-3 py-2 text-right">Total Price</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lines.map((line) => {
                  const m = lineMath(line);
                  return (
                    <tr key={line.id} className="align-top">
                      <td className="min-w-[220px] px-2 py-2">
                        <ItemLinePicker
                          value={line.name}
                          items={items.filter((i) => i.type === "product")}
                          onSelect={(item) => applyItemToLine(line.id, item)}
                          onChangeName={(v) => updateLine(line.id, { name: v, itemId: undefined })}
                          onQuickAdd={() => setQuickItemForRow(line.id)}
                          locked={!!line.itemId}
                          inputPlaceholder="Search or type asset…"
                          searchPlaceholder="Search assets…"
                          emptyLabel="No assets match."
                          quickAddLabel="+ Quick add new asset"
                          priceKey="purchasePrice"
                          sheetTitle="Select asset"
                        />
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
                          max={1000}
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
                      <td className="w-20 px-1 py-2">
                        <Select
                          value={line.discountKind}
                          onValueChange={(v) =>
                            updateLine(line.id, { discountKind: v as DiscountKind })
                          }
                        >
                          <SelectTrigger className="h-9 px-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percent">%</SelectItem>
                            <SelectItem value="amount">₹</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="w-24 px-2 py-2">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.discountValue}
                          onChange={(e) =>
                            updateLine(line.id, { discountValue: Number(e.target.value) })
                          }
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
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={addLine} className="gap-2">
              <Plus className="h-4 w-4" />
              Add row
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setQuickAssetOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Quick add asset
            </Button>
          </div>
        </FormSection>

        {/* 4. Summary ----------------------------------------------------- */}
        <FormSection step={4} title="Summary" description="Review the bill total before saving.">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <Label className="mb-2 block">Overall discount</Label>
                <div className="flex gap-2">
                  <Select
                    value={overallDiscountKind}
                    onValueChange={(v) => setOverallDiscountKind(v as DiscountKind)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">%</SelectItem>
                      <SelectItem value="amount">₹</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.01"
                    value={overallDiscountValue}
                    onChange={(e) => setOverallDiscountValue(Number(e.target.value))}
                    className="text-right tabular-nums"
                  />
                </div>
              </div>
            </div>

            <dl className="space-y-2 rounded-xl border border-border bg-card p-4 text-sm">
              <Row label="Subtotal" value={formatCurrency(totals.subtotal, currency)} />
              {totals.itemDiscountTotal > 0 && (
                <Row
                  label="Line discounts"
                  value={`− ${formatCurrency(totals.itemDiscountTotal, currency)}`}
                  muted
                />
              )}
              {totals.overallDiscountAmount > 0 && (
                <Row
                  label="Overall discount"
                  value={`− ${formatCurrency(totals.overallDiscountAmount, currency)}`}
                  muted
                />
              )}
              <div className="space-y-1.5 rounded-md bg-muted/30 p-2">
                <Label htmlFor="purchaseTargetTotal" className="text-xs text-muted-foreground">
                  Final total (editable)
                </Label>
                <Input
                  id="purchaseTargetTotal"
                  type="number"
                  min={0}
                  step="0.01"
                  value={effectiveTotal}
                  onChange={(e) => updatePurchaseTotal(Number(e.target.value))}
                  className="h-9 text-right tabular-nums font-semibold"
                />
              </div>
              <div className="space-y-1.5 rounded-md bg-muted/30 p-2">
                <Label htmlFor="purchaseCapturedAmount" className="text-xs text-muted-foreground">
                  Captured amount
                </Label>
                <Input
                  id="purchaseCapturedAmount"
                  type="number"
                  min={0}
                  max={effectiveTotal}
                  step="0.01"
                  value={capturedAmount}
                  onChange={(e) => updateCapturedAmount(Number(e.target.value))}
                  className="h-9 text-right tabular-nums font-semibold"
                />
              </div>
              <div className="my-2 h-px bg-border" />
              <Row label="Total" value={formatCurrency(effectiveTotal, currency)} emphasis />
              <Row label="Captured" value={formatCurrency(capturedAmount, currency)} />
              <Row label="Balance" value={formatCurrency(balanceAmount, currency)} emphasis />
            </dl>
          </div>
        </FormSection>

        {/* 5. Notes & terms ------------------------------------------------- */}
        <FormSection
          step={5}
          title="Notes & Terms"
          description="Optional, shown on the printable bill."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes about this purchase…"
              />
            </div>
            <div>
              <Label htmlFor="termsText">Terms & conditions</Label>
              <Textarea
                id="termsText"
                rows={4}
                value={termsText}
                onChange={(e) => setTermsText(e.target.value)}
                placeholder="Agreed delivery / payment terms…"
              />
            </div>
          </div>
        </FormSection>

        {/* 6. Proof --------------------------------------------------------- */}
        <FormSection
          step={6}
          title="Bill / Proof"
          description="Upload one image and one supporting document for this purchase. Required to finalise."
        >
          <ProofUpload
            id="pur-proof"
            label="Bill attachments"
            required
            proofDataUrl={proofDataUrl}
            proofName={proofName}
            disabled={locked}
            onChange={(p) => {
              setProofDataUrl(p.proofDataUrl);
              setProofName(p.proofName);
            }}
          />
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
          <Button variant="ghost" onClick={() => navigate(LIST_SEARCH)}>
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
        priceLabel="Price"
        onCreated={(item) => {
          if (quickItemForRow) applyItemToLine(quickItemForRow, item);
          setQuickItemForRow(null);
        }}
      />
      <QuickAddItemDialog
        open={quickAssetOpen}
        onOpenChange={setQuickAssetOpen}
        defaultType="product"
        priceLabel="Price"
        onCreated={(item) => {
          const next = emptyLine();
          next.itemId = item.id;
          next.name = item.name;
          next.unit = item.unit;
          next.rate = item.purchasePrice ?? item.sellingPrice;
          next.taxPercent = item.taxPercent;
          setLines((prev) => [...prev, next]);
          setQuickAssetOpen(false);
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
