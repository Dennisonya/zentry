import { z } from "zod"

/**
 * Shared form validation. Each form runs its values through one of these
 * schemas before writing to Supabase; the database has matching CHECK
 * constraints (scripts/025) so a bypassed form still can't store a negative
 * price or stock level.
 */

const trimmed = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`)
const required = (label: string, max: number) => trimmed(max).min(1, `${label} is required.`)
const optionalText = (max: number) =>
  trimmed(max)
    .optional()
    .transform((v) => (v ? v : null))

/** "12.50" → 12.5. Rejects negatives, more than 2 decimals and absurd values. */
export const moneyField = (label = "Price") =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .regex(/^\d+(\.\d{1,2})?$/, `${label} must be a number like 9.99, with no more than 2 decimals.`)
    .transform(Number)
    .refine((n) => n <= 1_000_000, `${label} looks too high.`)

/** Whole number ≥ min, from an <input type="number"> string. */
export const wholeNumberField = (label: string, { min = 0, max = 1_000_000 } = {}) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .regex(/^\d+$/, `${label} must be a whole number of ${min} or more.`)
    .transform(Number)
    .refine((n) => n >= min && n <= max, `${label} must be between ${min} and ${max}.`)

const optionalWholeNumber = (label: string, opts?: { min?: number; max?: number }) =>
  z.union([z.literal("").transform(() => null), wholeNumberField(label, opts)])

/** Accepts local or international formats; needs 7–15 digits. */
export const phoneField = (label = "Phone number") =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .regex(/^\+?[\d\s\-().]+$/, `${label} can only contain digits, spaces, +, -, ( and ).`)
    .refine((v) => {
      const digits = v.replace(/\D/g, "").length
      return digits >= 7 && digits <= 15
    }, `${label} should have 7 to 15 digits.`)

const optionalPhone = (label?: string) => z.union([z.literal("").transform(() => null), phoneField(label)])

const optionalEmail = z.union([
  z.literal("").transform(() => null),
  z.string().trim().email("Enter a valid email address.").max(254),
])

// ---------------------------------------------------------------- catalog

export const productSchema = z.object({
  name: required("Name", 120),
  description: optionalText(2000),
  price: moneyField(),
  category: optionalText(60),
})

export const serviceSchema = productSchema.extend({
  durationMinutes: optionalWholeNumber("Duration", { min: 1, max: 1440 }),
  location: optionalText(200),
})

export const stockSchema = z.object({
  stockQuantity: wholeNumberField("Stock quantity"),
  lowStockThreshold: z.union([z.literal("").transform(() => 5), wholeNumberField("Low stock level")]),
})

export const variantStockSchema = z.object({
  stockQuantity: wholeNumberField("Stock for every option"),
  lowStockThreshold: optionalWholeNumber("Low stock level"),
})

// ---------------------------------------------------------------- people

export const checkoutSchema = z.object({
  fullName: required("Name", 120),
  phone: phoneField(),
  address: required("Delivery address", 500),
  notes: optionalText(1000),
})

export const inquirySchema = z.object({
  name: required("Name", 120),
  whatsapp: phoneField("WhatsApp number"),
  message: optionalText(1000),
  location: optionalText(200),
  preferredDate: optionalText(100),
})

export const profileSchema = z.object({
  fullName: optionalText(120),
  phone: optionalPhone(),
  address: optionalText(500),
})

export const businessDetailsSchema = z.object({
  businessName: required("Business name", 120),
  phone: optionalPhone(),
  email: optionalEmail,
  whatsappNumber: optionalPhone("WhatsApp number"),
  instagramHandle: z
    .union([
      z.literal(""),
      z
        .string()
        .trim()
        .regex(/^@?[A-Za-z0-9._]{1,30}$/, "Instagram handle can only use letters, numbers, dots and underscores."),
    ])
    .transform((v) => (v ? v : null)),
  address: optionalText(500),
  description: optionalText(2000),
})

// ---------------------------------------------------------------- helpers

/** Runs a schema and returns either the parsed data or the first problem as a sentence. */
export function validate<S extends z.ZodTypeAny>(
  schema: S,
  values: unknown,
): { ok: true; data: z.output<S> } | { ok: false; error: string } {
  const result = schema.safeParse(values)
  if (result.success) return { ok: true, data: result.data }
  return { ok: false, error: result.error.issues[0]?.message ?? "Please check the form and try again." }
}
