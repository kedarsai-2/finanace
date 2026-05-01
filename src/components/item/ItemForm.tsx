import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Info, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { FormSection } from "@/components/business/FormSection";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useItems } from "@/hooks/useItems";
import type { Item } from "@/types/item";
import { itemFormSchema, ITEM_UNITS, TAX_RATES, type ItemFormValues } from "@/lib/itemSchema";
import { emptyToUndef } from "@/lib/businessSchema";
import { cn } from "@/lib/utils";

interface Props {
  mode: "new" | "edit";
  itemId?: string;
  context?: "items" | "assets";
}

const TYPE_HINT: Record<ItemFormValues["type"], string> = {
  product: "Tracks stock when inventory features go live.",
  service: "Time- or task-based; no stock tracking.",
};

function forcedTypeForContext(context: Props["context"]): ItemFormValues["type"] {
  return context === "assets" ? "product" : "service";
}

function labelsForContext(context: Props["context"]) {
  return context === "assets"
    ? { singular: "Asset", plural: "Assets", nameLabel: "Asset name" }
    : { singular: "Item", plural: "Items", nameLabel: "Item name" };
}

const UNIT_LABEL: Record<(typeof ITEM_UNITS)[number], string> = {
  number: "Number (bhk)",
  pcs: "Pieces (pcs)",
  kg: "Kilograms (kg)",
  litre: "Litres (litre)",
  hour: "Hours (hour)",
};

export function ItemForm({ mode, itemId, context = "items" }: Props) {
  const navigate = useNavigate();
  const { businesses, activeId } = useBusinesses();
  const { allItems, upsert, hydrated } = useItems(activeId);
  const activeBusiness = businesses.find((b) => b.id === activeId);
  const forcedType = forcedTypeForContext(context);
  const labels = labelsForContext(context);

  const existing = useMemo(
    () => (itemId ? allItems.find((i) => i.id === itemId) : undefined),
    [itemId, allItems],
  );

  const [submitting, setSubmitting] = useState(false);

  const defaults: ItemFormValues = useMemo(() => {
    const unit = (ITEM_UNITS as readonly string[]).includes((existing?.unit ?? "").toLowerCase())
      ? (existing!.unit.toLowerCase() as ItemFormValues["unit"])
      : "pcs";
    const tax = (TAX_RATES as readonly number[]).includes(existing?.taxPercent ?? -1)
      ? (existing!.taxPercent as ItemFormValues["taxPercent"])
      : 18;
    return {
      name: existing?.name ?? "",
      type: forcedType,
      sku: existing?.sku ?? "",
      sellingPrice: existing?.sellingPrice ?? 0,
      purchasePrice: existing?.purchasePrice,
      taxPercent: tax,
      unit,
      openingStock: existing?.openingStock ?? (forcedType === "product" ? 1 : undefined),
      reorderLevel: existing?.reorderLevel,
      description: existing?.description ?? "",
      active: existing?.active ?? true,
    };
  }, [existing, forcedType]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: defaults,
    mode: "onBlur",
  });

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  const isService = watch("type") === "service";

  const errMsg = (msg?: string) =>
    msg ? <p className="mt-1 text-xs text-destructive">{msg}</p> : null;

  const cancelHref =
    context === "assets"
      ? ({ to: "/assets" as const } as const)
      : ({ to: "/items" as const, search: { q: "", type: "all" as const } } as const);

  const onSubmit = handleSubmit(
    async (values) => {
      if (!activeId) {
        toast.error("Select an active business first");
        return;
      }
      setSubmitting(true);
      try {
        const normalizedName = values.name.trim().toLowerCase();
        const duplicate = allItems.some(
          (it) =>
            !it.deleted &&
            it.businessId === activeId &&
            it.id !== existing?.id &&
            it.type === forcedType &&
            it.name.trim().toLowerCase() === normalizedName,
        );
        if (duplicate) {
          toast.error("Item already exists");
          setSubmitting(false);
          return;
        }
        const normalizedPurchasePrice =
          values.purchasePrice && values.purchasePrice > 0 ? values.purchasePrice : undefined;
        const effectiveSellingPrice =
          context === "assets"
            ? (normalizedPurchasePrice ?? values.sellingPrice)
            : values.sellingPrice;
        const effectivePurchasePrice =
          context === "assets"
            ? (normalizedPurchasePrice ?? values.sellingPrice)
            : normalizedPurchasePrice;
        const item: Item = {
          id: existing?.id ?? "",
          businessId: existing?.businessId ?? activeId,
          name: values.name.trim(),
          type: forcedType,
          sku: emptyToUndef(values.sku)?.toUpperCase(),
          sellingPrice: effectiveSellingPrice,
          purchasePrice: effectivePurchasePrice,
          taxPercent: values.taxPercent,
          unit: values.unit,
          openingStock:
            forcedType === "product"
              ? values.openingStock && values.openingStock > 0
                ? values.openingStock
                : 1
              : undefined,
          reorderLevel:
            forcedType === "product" && values.reorderLevel && values.reorderLevel > 0
              ? values.reorderLevel
              : undefined,
          description: emptyToUndef(values.description),
          active: values.active,
          deleted: existing?.deleted,
        };
        await upsert(item);
        toast.success(mode === "edit" ? `${labels.singular} updated` : `${labels.singular} added`);
        navigate(cancelHref);
      } catch {
        toast.error(`Could not save ${labels.singular.toLowerCase()}`);
      } finally {
        setSubmitting(false);
      }
    },
    () => toast.error("Please fix the highlighted fields"),
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background pb-16">
      <header className="sticky top-16 z-10 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Button asChild size="icon" variant="ghost" className="h-9 w-9">
              <Link {...cancelHref} aria-label="Back">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium uppercase tracking-widest text-muted-foreground sm:text-xs">
                {activeBusiness?.name ?? "Workspace"}
              </p>
              <h1 className="text-lg font-bold tracking-tight sm:text-2xl">
                {mode === "edit" ? `Edit ${labels.singular}` : `Add ${labels.singular}`}
              </h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            <Button variant="ghost" onClick={() => navigate(cancelHref)}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={submitting || !hydrated} className="gap-2">
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        </div>
      </header>

      <form className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-8" onSubmit={onSubmit}>
        <FormSection step={1} title="Basic Info" description="What are you selling?">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="name">{labels.nameLabel} *</Label>
              <Input
                id="name"
                placeholder='e.g. Steel Bracket 4"'
                aria-invalid={!!errors.name}
                {...register("name")}
                readOnly={mode === "edit"}
                className={cn(
                  errors.name && "border-destructive",
                  mode === "edit" && "cursor-not-allowed bg-muted/50 text-muted-foreground",
                )}
              />
              {mode === "edit" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {labels.singular} name cannot be changed after creation.
                </p>
              )}
              {errMsg(errors.name?.message)}
            </div>
            <div>
              <Label htmlFor="type">Type *</Label>
              <Input
                id="type"
                value={forcedType === "product" ? "Product" : "Service"}
                readOnly
                className="cursor-not-allowed bg-muted/50 text-muted-foreground"
              />
              <p className="mt-1 text-xs text-muted-foreground">{TYPE_HINT[forcedType]}</p>
            </div>
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                placeholder="e.g. SB-004"
                style={{ textTransform: "uppercase" }}
                {...register("sku")}
              />
            </div>
          </div>
        </FormSection>

        <FormSection step={2} title="Pricing">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="sellingPrice">
                {context === "assets" ? "Price *" : "Selling price *"}
              </Label>
              <Input
                id="sellingPrice"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                aria-invalid={!!errors.sellingPrice}
                {...register("sellingPrice", { valueAsNumber: true })}
                className={cn(errors.sellingPrice && "border-destructive")}
              />
              {errMsg(errors.sellingPrice?.message)}
            </div>
            {context !== "assets" && (
              <div>
                <Label htmlFor="purchasePrice">Purchase price</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  aria-invalid={!!errors.purchasePrice}
                  {...register("purchasePrice", {
                    setValueAs: (v) => (v === "" || v === null ? undefined : Number(v)),
                  })}
                  className={cn(errors.purchasePrice && "border-destructive")}
                />
                {errMsg(errors.purchasePrice?.message)}
              </div>
            )}
          </div>
        </FormSection>

        <FormSection step={3} title="Quantity" description="Stocking unit used for this item.">
          <div>
            <Label htmlFor="unit">Quantity unit</Label>
            <Controller
              control={control}
              name="unit"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="unit" className="sm:max-w-xs">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {UNIT_LABEL[u]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </FormSection>

        <FormSection
          step={4}
          title="Inventory"
          description="Future ready — fields are visible but optional."
        >
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              Inventory features are not active yet. Values you enter here will be preserved and
              used once stock tracking is enabled
              {isService ? " (services do not track stock)" : ""}.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="openingStock">Opening stock</Label>
              <Input
                id="openingStock"
                type="number"
                min={0}
                step="0.01"
                placeholder="0"
                disabled={isService}
                {...register("openingStock", {
                  setValueAs: (v) => (v === "" || v === null ? undefined : Number(v)),
                })}
              />
            </div>
            <div>
              <Label htmlFor="reorderLevel">Reorder level</Label>
              <Input
                id="reorderLevel"
                type="number"
                min={0}
                step="0.01"
                placeholder="0"
                disabled={isService}
                {...register("reorderLevel", {
                  setValueAs: (v) => (v === "" || v === null ? undefined : Number(v)),
                })}
              />
            </div>
          </div>
        </FormSection>

        <FormSection step={5} title="Additional Info">
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Notes shown on invoices and quotes…"
              {...register("description")}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">
                Inactive items are hidden from invoice selection.
              </p>
            </div>
            <Controller
              control={control}
              name="active"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>
        </FormSection>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:hidden">
          <Button type="button" variant="ghost" onClick={() => navigate(cancelHref)}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}
