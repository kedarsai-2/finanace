import { z } from "zod";

export const TAX_RATES = [0, 5, 12, 18, 28] as const;
export const ITEM_UNITS = ["number", "pcs", "kg", "litre", "hour"] as const;
export type ItemUnit = (typeof ITEM_UNITS)[number];

export const itemFormSchema = z.object({
  name: z.string().trim().min(1, "Item name is required").max(120),
  type: z.enum(["product", "service"]),
  sku: z.string().trim().max(60).optional().or(z.literal("")),
  sellingPrice: z.number().min(0, "Selling price cannot be negative"),
  purchasePrice: z.number().min(0, "Purchase price cannot be negative").optional(),
  taxPercent: z.number().refine(
    (v) => (TAX_RATES as readonly number[]).includes(v),
    "Select a valid tax rate",
  ),
  unit: z.enum(ITEM_UNITS),
  openingStock: z.number().min(0).optional(),
  reorderLevel: z.number().min(0).optional(),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  active: z.boolean(),
});

export type ItemFormValues = z.infer<typeof itemFormSchema>;
