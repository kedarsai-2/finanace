import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePickerField } from "@/components/ui/date-picker-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PartyPicker } from "@/components/party/PartyPicker";

import { useBusinesses } from "@/hooks/useBusinesses";
import { useAccounts } from "@/hooks/useAccounts";
import { useExpenses } from "@/hooks/useExpenses";
import { useParties } from "@/hooks/useParties";
import { useItems } from "@/hooks/useItems";
import { useExpenseCategories } from "@/hooks/useExpenseCategories";
import { QuickAddPartyDialog } from "@/components/party/QuickAddPartyDialog";
import { QuickAddItemDialog } from "@/components/item/QuickAddItemDialog";
import { ItemLinePicker } from "@/components/item/ItemLinePicker";
import { ProofUpload } from "@/components/proof/ProofUpload";
import { ACCOUNT_TYPE_LABEL } from "@/types/account";
import { PAYMENT_MODE_LABEL, type PaymentMode } from "@/types/payment";
import { DEFAULT_EXPENSE_TYPES, type Expense, type ExpenseType } from "@/types/expense";
import type { Item } from "@/types/item";

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
  const { activeId, businesses } = useBusinesses();
  const businessIds = useMemo(() => businesses.map((b) => b.id), [businesses]);
  const { accounts } = useAccounts(null, businessIds);
  const safeAccounts = useMemo(() => accounts.filter((a) => !!a.id), [accounts]);
  const bankAccounts = useMemo(() => safeAccounts.filter((a) => a.type === "bank"), [safeAccounts]);
  const cashAccounts = useMemo(() => safeAccounts.filter((a) => a.type === "cash"), [safeAccounts]);
  const { parties } = useParties(activeId);
  const { categories } = useExpenseCategories(activeId);
  const { items } = useItems(activeId);
  const { add, upsert } = useExpenses(activeId);
  const catalogItems = useMemo(() => items.filter((i) => i.type === "product"), [items]);

  const supplierParties = parties;

  const [date, setDate] = useState<Date>(initial ? new Date(initial.date) : new Date());
  const [accountId, setAccountId] = useState<string>(initial?.accountId ?? "");
  const [type, setType] = useState<ExpenseType | "">(initial?.type ?? "");
  const [category, setCategory] = useState<string>(initial?.category ?? "");
  const [amount, setAmount] = useState<number>(initial?.amount ?? 0);
  const [mode, setMode] = useState<PaymentMode>(initial?.mode ?? "cash");
  const [partyId, setPartyId] = useState<string>(initial?.partyId ?? "");
  const [reference, setReference] = useState<string>(initial?.reference ?? "");
  const [notes, setNotes] = useState<string>(initial?.notes ?? "");
  const [proofDataUrl, setProofDataUrl] = useState<string | undefined>(initial?.proofDataUrl);
  const [proofName, setProofName] = useState<string | undefined>(initial?.proofName);
  const [itemName, setItemName] = useState(initial?.itemName ?? "");
  const [itemDescription, setItemDescription] = useState(initial?.itemDescription ?? "");
  const [orderNo, setOrderNo] = useState(initial?.orderNo ?? "");
  const [hsnSac, setHsnSac] = useState(initial?.hsnSac ?? "");
  const [quantity, setQuantity] = useState<number | "">(
    initial?.quantity != null ? initial.quantity : "",
  );
  const [unitPrice, setUnitPrice] = useState<number | "">(
    initial?.unitPrice != null ? initial.unitPrice : "",
  );
  const [taxPercent, setTaxPercent] = useState<number | "">(
    initial?.taxPercent != null ? initial.taxPercent : "",
  );
  const [showQuickParty, setShowQuickParty] = useState(false);
  const [showQuickItem, setShowQuickItem] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Skip the first run of the mode-change effect (initial mount).
  const modeEffectMountedRef = useRef(false);

  // Autofill last-used account on create
  useEffect(() => {
    if (initial || accountId) return;
    if (mode === "cash") {
      if (cashAccounts[0]?.id) setAccountId(cashAccounts[0].id);
      return;
    }
    const last = typeof window !== "undefined" ? localStorage.getItem(LAST_ACCOUNT_KEY) : null;
    const candidate = (last && bankAccounts.find((a) => a.id === last)?.id) || bankAccounts[0]?.id;
    if (candidate) setAccountId(candidate);
  }, [bankAccounts, cashAccounts, accountId, initial, mode]);

  // When mode changes (user action only, not initial mount), auto-select the appropriate account.
  useEffect(() => {
    if (!modeEffectMountedRef.current) {
      modeEffectMountedRef.current = true;
      return;
    }
    if (mode === "cash") {
      setAccountId(cashAccounts[0]?.id ?? "");
    } else if (bankAccounts[0]?.id) {
      setAccountId(bankAccounts[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Ensure a valid default expense type.
  useEffect(() => {
    if (type) return;
    setType("indirect");
  }, [type]);

  const applyCatalogItem = (item: Item) => {
    setItemName(item.name);
    const price = item.purchasePrice ?? item.sellingPrice;
    if (price > 0) setUnitPrice(price);
    if (item.taxPercent != null) setTaxPercent(item.taxPercent);
  };

  const buildItemPayload = (): Pick<
    Expense,
    | "orderNo"
    | "itemName"
    | "itemDescription"
    | "hsnSac"
    | "quantity"
    | "unitPrice"
    | "taxPercent"
    | "taxAmount"
    | "lineAmount"
  > => {
    const qty = quantity === "" ? undefined : Number(quantity);
    const unit = unitPrice === "" ? undefined : Number(unitPrice);
    const taxPct = taxPercent === "" ? undefined : Number(taxPercent);
    const name = itemName.trim();
    const lineBase =
      qty != null && unit != null && qty > 0 && unit >= 0 ? Math.round(qty * unit * 100) / 100 : undefined;
    const taxAmt =
      lineBase != null && taxPct != null && taxPct > 0
        ? Math.round(lineBase * (taxPct / 100) * 100) / 100
        : undefined;
    const lineAmt =
      lineBase != null ? Math.round((lineBase + (taxAmt ?? 0)) * 100) / 100 : undefined;
    return {
      orderNo: orderNo.trim() || undefined,
      itemName: name || undefined,
      itemDescription: itemDescription.trim() || undefined,
      hsnSac: hsnSac.trim() || undefined,
      quantity: qty != null && qty > 0 ? qty : undefined,
      unitPrice: unit != null && unit >= 0 ? unit : undefined,
      taxPercent: taxPct != null && taxPct >= 0 ? taxPct : undefined,
      taxAmount: taxAmt,
      lineAmount: lineAmt,
    };
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!activeId) return toast.error("Select a business first");
    if (!accountId) return toast.error(mode === "cash" ? "Select a cash account" : "Select a bank account");
    if (!(amount > 0)) return toast.error("Amount must be greater than 0");
    if (!type) return toast.error("Select expense type");
    const normalizedCategory = category.trim().toLowerCase();
    const isKnownCategory = categories.some(
      (c) => c.name.trim().toLowerCase() === normalizedCategory,
    );
    if (!normalizedCategory) return toast.error("Select expense category");
    if (!isKnownCategory) return toast.error("Select a valid expense category");
    if (mode !== "cash" && !proofDataUrl)
      return toast.error(`Upload a proof image for the ${PAYMENT_MODE_LABEL[mode]} expense`);

    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const exp: Expense = {
        id: initial?.id ?? `exp_${Date.now().toString(36)}`,
        businessId: initial?.businessId ?? activeId,
        accountId: accountId || undefined,
        date: date.toISOString(),
        amount,
        type,
        category: category.trim(),
        partyId: partyId || undefined,
        mode,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
        proofDataUrl,
        proofName,
        receivedPaidAmount: initial?.receivedPaidAmount,
        balanceDue: initial?.balanceDue,
        excludeFromLedger: initial?.excludeFromLedger,
        discountPercent: initial?.discountPercent,
        discountAmount: initial?.discountAmount,
        ...buildItemPayload(),
        createdAt: initial?.createdAt ?? now,
        updatedAt: initial ? now : undefined,
      };
      const saved = initial ? await upsert(exp) : await add(exp);
      if (typeof window !== "undefined") {
        if (mode !== "cash" && accountId) localStorage.setItem(LAST_ACCOUNT_KEY, accountId);
      }
      toast.success(initial ? "Expense updated" : "Expense recorded");
      onSaved?.(saved);
      if (!onSaved) navigate({ to: "/expenses" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save expense";
      toast.error(message);
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
            <DatePickerField
              value={date}
              onChange={(d) => d && setDate(d)}
              title="Expense date"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="exp-cat">
              Expense type <span className="text-destructive">*</span>
            </Label>
            <Select value={type} onValueChange={(v) => setType(v as ExpenseType)}>
              <SelectTrigger id="exp-cat">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_EXPENSE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t === "direct" ? "Direct" : "Indirect"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-3">
            <Label htmlFor="exp-category">
              Expense category <span className="text-destructive">*</span>
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="exp-category">
                <SelectValue
                  placeholder={
                    categories.length ? "Select a category" : "Create an expense category first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {category &&
                  !categories.some(
                    (c) => c.name.trim().toLowerCase() === category.trim().toLowerCase(),
                  ) && <SelectItem value={category}>{category} (legacy)</SelectItem>}
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
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger id="exp-acc">
                <SelectValue
                  placeholder={mode === "cash" ? "Select cash account" : "Select bank account"}
                />
              </SelectTrigger>
              <SelectContent>
                {(mode === "cash" ? cashAccounts : bankAccounts).map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} • {ACCOUNT_TYPE_LABEL[a.type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                <PartyPicker
                  id="exp-party"
                  parties={supplierParties}
                  value={partyId || null}
                  onChange={setPartyId}
                  allowEmpty
                  emptyOptionLabel="None"
                  placeholder="None"
                />
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

          <Section
            title="Item details (optional)"
            description="Line-level fields for reporting and the Items tab. Stored on the same expense record."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <Label htmlFor="exp-item">Item</Label>
                <ItemLinePicker
                  value={itemName}
                  items={catalogItems}
                  onSelect={applyCatalogItem}
                  onChangeName={setItemName}
                  onQuickAdd={() => setShowQuickItem(true)}
                  inputPlaceholder="Search or type item name"
                  searchPlaceholder="Search items…"
                  emptyLabel="No items match."
                  quickAddLabel="+ Quick add new item"
                  priceKey="purchasePrice"
                  sheetTitle="Select item"
                />
              </div>
              <div className="sm:col-span-3">
                <Label htmlFor="exp-order">Order no.</Label>
                <Input
                  id="exp-order"
                  value={orderNo}
                  onChange={(e) => setOrderNo(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="exp-hsn">HSN / SAC</Label>
                <Input
                  id="exp-hsn"
                  value={hsnSac}
                  onChange={(e) => setHsnSac(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="exp-qty">Quantity</Label>
                <Input
                  id="exp-qty"
                  type="number"
                  min={0}
                  step="0.01"
                  value={quantity === "" ? "" : quantity}
                  onChange={(e) =>
                    setQuantity(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="text-right tabular-nums"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="exp-unit-price">Unit price</Label>
                <Input
                  id="exp-unit-price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={unitPrice === "" ? "" : unitPrice}
                  onChange={(e) =>
                    setUnitPrice(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="text-right tabular-nums"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="exp-tax">Tax %</Label>
                <Input
                  id="exp-tax"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={taxPercent === "" ? "" : taxPercent}
                  onChange={(e) =>
                    setTaxPercent(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="text-right tabular-nums"
                />
              </div>
              <div className="sm:col-span-4">
                <Label htmlFor="exp-item-desc">Item description</Label>
                <Input
                  id="exp-item-desc"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="Optional"
                />
              </div>
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
            description="Attach one image and one document (bill, receipt, transfer proof). Required for non-cash modes."
          >
            <ProofUpload
              id="exp-proof"
              label="Attachments"
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
      <QuickAddItemDialog
        open={showQuickItem}
        onOpenChange={setShowQuickItem}
        defaultType="product"
        priceLabel="Unit price"
        defaultName={itemName}
        onCreated={(item) => {
          applyCatalogItem(item);
          setShowQuickItem(false);
        }}
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
