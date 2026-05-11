import { z } from "zod";

export const TAX_RATES = [0, 5, 12, 18, 28] as const;
export const ITEM_UNITS = ["number", "pcs", "kg", "litre", "hour"] as const;
export type ItemUnit = (typeof ITEM_UNITS)[number];

export const itemFormSchema = z.object({
  name: z.string().trim().min(1, "Item name is required").max(500, "Max 500 characters"),
  type: z.enum(["product", "service"]),
  sku: z.string().trim().max(60).optional().or(z.literal("")),
  sellingPrice: z.number().min(0, "Selling price cannot be negative"),
  purchasePrice: z.number().min(0, "Purchase price cannot be negative").optional(),
  taxPercent: z
    .number()
    .refine((v) => (TAX_RATES as readonly number[]).includes(v), "Select a valid tax rate"),
  unit: z.enum(ITEM_UNITS),
  openingStock: z.number().min(0).max(1000, "Opening stock cannot exceed 1000").optional(),
  reorderLevel: z.number().min(0).max(1000, "Reorder level cannot exceed 1000").optional(),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  active: z.boolean(),
});

export type ItemFormValues = z.infer<typeof itemFormSchema>;
