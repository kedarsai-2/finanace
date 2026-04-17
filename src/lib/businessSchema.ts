import { z } from "zod";
import {
  GST_REGEX,
  PAN_REGEX,
  PINCODE_REGEX,
  MOBILE_REGEX,
  INDIAN_STATES,
} from "@/types/business";

const optionalString = (max = 200) =>
  z.string().trim().max(max).optional().or(z.literal("")).transform((v) => v || undefined);

const addressSchema = z.object({
  line1: optionalString(200),
  line2: optionalString(200),
  city: optionalString(80),
  state: z.enum(INDIAN_STATES).optional().or(z.literal("")).transform((v) => v || undefined),
  pincode: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined)
    .refine((v) => !v || PINCODE_REGEX.test(v), "Invalid pincode"),
});

export const businessFormSchema = z
  .object({
    name: z.string().trim().min(1, "Business name is required").max(120),
    ownerName: optionalString(120),
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
      .transform((v) => v || undefined)
      .refine(
        (v) => !v || z.string().email().safeParse(v).success,
        "Invalid email address",
      ),
    billingAddress: addressSchema,
    shippingSameAsBilling: z.boolean(),
    shippingAddress: addressSchema,
    gstNumber: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .transform((v) => (v ? v.toUpperCase() : undefined))
      .refine((v) => !v || GST_REGEX.test(v), "Invalid GST format (e.g. 29ABCDE1234F2Z5)"),
    panNumber: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .transform((v) => (v ? v.toUpperCase() : undefined))
      .refine((v) => !v || PAN_REGEX.test(v), "Invalid PAN format (e.g. ABCDE1234F)"),
    logoUrl: z.string().optional(),
    currency: z.string().min(1, "Currency is required"),
    fyStartMonth: z.number().min(1).max(12),
  });

export type BusinessFormValues = z.infer<typeof businessFormSchema>;
