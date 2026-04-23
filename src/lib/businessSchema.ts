import { z } from "zod";
import { GST_REGEX, PAN_REGEX, PINCODE_REGEX, MOBILE_REGEX } from "@/types/business";

const optStr = z.string().trim().max(200).optional().or(z.literal(""));

const addressSchema = z.object({
  line1: optStr,
  line2: optStr,
  city: z.string().trim().max(80).optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  pincode: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || PINCODE_REGEX.test(v), "Invalid pincode"),
});

export const businessFormSchema = z.object({
  name: z.string().trim().min(1, "Business name is required").max(120),
  ownerName: z.string().trim().max(120).optional().or(z.literal("")),
  mobile: z
    .string()
    .trim()
    .min(1, "Mobile number is required")
    .regex(MOBILE_REGEX, "Enter a valid 10-digit mobile number"),
  email: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || z.string().email().safeParse(v).success, "Invalid email address"),
  billingAddress: addressSchema,
  shippingSameAsBilling: z.boolean(),
  shippingAddress: addressSchema,
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
    .refine((v) => !v || PAN_REGEX.test(v.toUpperCase()), "Invalid PAN format (e.g. ABCDE1234F)"),
  logoUrl: z.string().optional(),
  currency: z.string().min(1, "Currency is required"),
  fyStartMonth: z.number().min(1).max(12),
});

export type BusinessFormValues = z.infer<typeof businessFormSchema>;

export const emptyToUndef = (v?: string) => {
  const t = v?.trim();
  return t ? t : undefined;
};
