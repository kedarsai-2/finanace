import { z } from "zod";
import { GST_REGEX, PAN_REGEX, PINCODE_REGEX, MOBILE_REGEX } from "@/types/business";

export const partyFormSchema = z.object({
  name: z.string().trim().min(1, "Party name is required").max(120),
  type: z.enum(["customer", "supplier", "both"]),
  mobile: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || MOBILE_REGEX.test(v), "Enter a valid 10-digit mobile number"),
  email: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || z.string().email().safeParse(v).success,
      "Invalid email address",
    ),
  address: z.object({
    line1: z.string().trim().max(200).optional().or(z.literal("")),
    city: z.string().trim().max(80).optional().or(z.literal("")),
    state: z.string().optional().or(z.literal("")),
    pincode: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .refine((v) => !v || PINCODE_REGEX.test(v), "Invalid pincode"),
  }),
  gstNumber: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || GST_REGEX.test(v.toUpperCase()),
      "Invalid GST format (e.g. 29ABCDE1234F2Z5)",
    ),
  panNumber: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || PAN_REGEX.test(v.toUpperCase()),
      "Invalid PAN format (e.g. ABCDE1234F)",
    ),
  creditLimit: z.number().min(0, "Cannot be negative").optional(),
  paymentTermsDays: z.number().int().min(0).max(365).optional(),
  openingAmount: z.number().min(0, "Cannot be negative"),
  balanceSide: z.enum(["receivable", "payable"]),
});

export type PartyFormValues = z.infer<typeof partyFormSchema>;
