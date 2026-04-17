import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useBusinesses } from "@/hooks/useBusinesses";
import { useItems } from "@/hooks/useItems";
import { ITEM_UNITS, TAX_RATES } from "@/lib/itemSchema";
import type { Item, ItemType } from "@/types/item";
import { cn } from "@/lib/utils";

const quickSchema = z.object({
  name: z.string().trim().min(1, "Item name is required").max(120),
  sellingPrice: z.number().min(0, "Selling price cannot be negative"),
  taxPercent: z.number().refine(
    (v) => (TAX_RATES as readonly number[]).includes(v),
    "Select a valid tax rate",
  ),
  unit: z.enum(ITEM_UNITS),
});

type QuickValues = z.infer<typeof quickSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Default item type — useful when called from a Purchase screen. */
  defaultType?: ItemType;
  /** Pre-fill the name from the current invoice search box. */
  defaultName?: string;
  /** Called with the saved item so the parent can auto-add it to the line. */
  onCreated?: (item: Item) => void;
}

const UNIT_LABEL: Record<(typeof ITEM_UNITS)[number], string> = {
  pcs: "Pieces (pcs)",
  kg: "Kilograms (kg)",
  litre: "Litres (litre)",
  hour: "Hours (hour)",
};

export function QuickAddItemDialog({
  open,
  onOpenChange,
  defaultType = "product",
  defaultName = "",
  onCreated,
}: Props) {
  const { activeId } = useBusinesses();
  const { upsert } = useItems();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<QuickValues>({
    resolver: zodResolver(quickSchema),
    defaultValues: {
      name: defaultName,
      sellingPrice: 0,
      taxPercent: 18,
      unit: "pcs",
    },
    mode: "onBlur",
  });

  // Reset whenever the dialog opens so prior state never leaks across uses.
  useEffect(() => {
    if (open) {
      reset({
        name: defaultName,
        sellingPrice: 0,
        taxPercent: 18,
        unit: "pcs",
      });
    }
  }, [open, defaultName, reset]);

  const errMsg = (msg?: string) =>
    msg ? <p className="mt-1 text-xs text-destructive">{msg}</p> : null;

  const onSubmit = handleSubmit(
    (values) => {
      if (!activeId) {
        toast.error("Select an active business first");
        return;
      }
      setSubmitting(true);
      try {
        const item: Item = {
          id: `i_${Date.now()}`,
          businessId: activeId,
          name: values.name.trim(),
          type: defaultType,
          sellingPrice: values.sellingPrice,
          taxPercent: values.taxPercent,
          unit: values.unit,
          active: true,
        };
        upsert(item);
        toast.success(`${item.name} added`);
        onCreated?.(item);
        onOpenChange(false);
      } catch {
        toast.error("Could not save item");
      } finally {
        setSubmitting(false);
      }
    },
    () => toast.error("Please fix the highlighted fields"),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
              <Plus className="h-3.5 w-3.5" />
            </span>
            Quick Add Item
          </DialogTitle>
          <DialogDescription>
            Create a {defaultType} on the fly and add it to this line.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="qa-name">Item name *</Label>
            <Input
              id="qa-name"
              autoFocus
              placeholder="e.g. Steel Bracket 4&quot;"
              aria-invalid={!!errors.name}
              {...register("name")}
              className={cn(errors.name && "border-destructive")}
            />
            {errMsg(errors.name?.message)}
          </div>

          <div>
            <Label htmlFor="qa-price">Selling price *</Label>
            <Input
              id="qa-price"
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="qa-tax">Tax rate</Label>
              <Controller
                control={control}
                name="taxPercent"
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger id="qa-tax">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TAX_RATES.map((r) => (
                        <SelectItem key={r} value={String(r)}>
                          {r}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label htmlFor="qa-unit">Unit</Label>
              <Controller
                control={control}
                name="unit"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="qa-unit">
                      <SelectValue />
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
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save & Add to List
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
