import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
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
import { ProofUpload } from "@/components/proof/ProofUpload";

import { useBusinesses } from "@/hooks/useBusinesses";
import { useParties, formatCurrency } from "@/hooks/useParties";
import { useItems } from "@/hooks/useItems";
import { usePurchases } from "@/hooks/usePurchases";
import { cn } from "@/lib/utils";
import { computeTotals, lineMath, type DiscountKind } from "@/types/invoice";
import {
  nextPurchaseNumber,
  canEditPurchase,
  type Purchase,
  type PurchaseLine,
} from "@/types/purchase";
import type { Item } from "@/types/item";

interface Props {
  mode: "new" | "edit";
  purchaseId?: string;
}

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
  const { parties } = useParties(activeId);
  const { items } = useItems(activeId);
  const { allPurchases, upsert, hydrated, ensureLines } = usePurchases(activeId);
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
  const [notes, setNotes] = useState("");
  const [termsText, setTermsText] = useState("");
  const [proofDataUrl, setProofDataUrl] = useState<string | undefined>(undefined);
  const [proofName, setProofName] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const [partyOpen, setPartyOpen] = useState(false);
  const [quickPartyOpen, setQuickPartyOpen] = useState(false);
  const [quickItemForRow, setQuickItemForRow] = useState<string | null>(null);

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
      setNotes(existing.notes ?? "");
      setTermsText(existing.terms ?? "");
      setProofDataUrl(existing.proofDataUrl);
      setProofName(existing.proofName);
    } else if (activeId) {
      setNumber(nextPurchaseNumber(allPurchases, activeId));
    }
  }, [existing, hydrated, activeId, allPurchases, ensureLines]);

  const party = parties.find((p) => p.id === partyId);

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

  // -------- Validation ----------------------------------------------------
  const validate = (): string | null => {
    if (!activeId) return "Select an active business first";
    if (!partyId) return "Please select a supplier";
    if (!number.trim()) return "Purchase number is required";
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
      if (l.rate < 0) return `Price cannot be negative for ${l.name}`;
    }
    return null;
  };

  const buildPurchase = (status: Purchase["status"]): Purchase => {
    const isFinal = status === "final";
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
      paidAmount: existing?.paidAmount ?? 0,
      status,
      proofDataUrl,
      proofName,
      deleted: existing?.deleted,
      notes: notes.trim() || undefined,
      terms: termsText.trim() || undefined,
      finalizedAt: isFinal
        ? (existing?.finalizedAt ?? new Date().toISOString())
        : existing?.finalizedAt,
    };
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
      const p = buildPurchase(status);
      await upsert(p);
      toast.success(
        status === "final" ? `Purchase ${p.number} finalised` : `Draft ${p.number} saved`,
      );
      navigate(LIST_SEARCH);
    } finally {
      setSubmitting(false);
    }
  };

  const currency = activeBusiness?.currency ?? "INR";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background pb-32">
      <header className="sticky top-16 z-10 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <Button asChild size="icon" variant="ghost" className="h-9 w-9">
              <Link {...LIST_SEARCH} aria-label="Back">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {activeBusiness?.name ?? "Workspace"}
              </p>
              <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
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
          <div className="hidden items-center gap-2 sm:flex">
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

      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        {locked && (
          <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning-foreground/80">
            <strong className="font-semibold">This purchase is locked.</strong> {lockedReason}
          </div>
        )}

        {/* 1. Supplier ------------------------------------------------------ */}
        <FormSection step={1} title="Supplier" description="Who are you buying from?">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label>Supplier *</Label>
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
                    {party ? party.name : "Select supplier…"}
                    <SearchIcon className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search suppliers…" />
                    <CommandList>
                      <CommandEmpty>No suppliers found.</CommandEmpty>
                      <CommandGroup>
                        {suppliers.map((p) => (
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
              Add Supplier
            </Button>
          </div>
        </FormSection>

        {/* 2. Purchase meta ------------------------------------------------- */}
        <FormSection step={2} title="Purchase Details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
              <Label>Due date (optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-10 w-full justify-between font-normal",
                      !dueDate && "text-muted-foreground",
                    )}
                  >
                    {dueDate ? format(dueDate, "dd MMM yyyy") : "Not set"}
                    <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="flex items-center justify-between border-b border-border px-3 py-2">
                    <span className="text-xs text-muted-foreground">Pick a date</span>
                    {dueDate && (
                      <button
                        type="button"
                        onClick={() => setDueDate(undefined)}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(d) => setDueDate(d ?? undefined)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
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
                        <ItemPicker
                          value={line.name}
                          items={items}
                          onSelect={(item) => applyItemToLine(line.id, item)}
                          onChangeName={(v) => updateLine(line.id, { name: v, itemId: undefined })}
                          onQuickAdd={() => setQuickItemForRow(line.id)}
                          locked={!!line.itemId}
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
                    min={0}
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
              <div className="my-2 h-px bg-border" />
              <Row label="Total" value={formatCurrency(totals.total, currency)} emphasis />
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
          description="Upload a photo or scan of the supplier bill. Required to finalise the purchase."
        >
          <ProofUpload
            id="pur-proof"
            label="Bill image"
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
                      <span className="tabular-nums text-muted-foreground">
                        {it.purchasePrice ?? it.sellingPrice}
                      </span>
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
