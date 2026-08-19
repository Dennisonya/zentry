import { z } from "zod"

// One schema per block type. This is the contract: anything written to
// page_schema / page_schema_draft — by the builder UI, or by hand while
// testing — should validate against these before being trusted.

export const heroSettingsSchema = z.object({
  showLogo: z.boolean().default(true),
  showDescription: z.boolean().default(true),
  /** Overrides business.hero_image_url when set; falls back to it when null. */
  heroImageUrl: z.string().url().nullable().default(null),
})

export const productGridSettingsSchema = z.object({
  title: z.string().min(1).max(80).default("Our Products"),
  groupByCategory: z.boolean().default(true),
})

export const serviceGridSettingsSchema = z.object({
  title: z.string().min(1).max(80).default("Our Services"),
})

export const aboutSettingsSchema = z.object({
  title: z.string().min(1).max(80).default("About Us"),
  /** Custom body text; falls back to business.description when null. */
  body: z.string().max(2000).nullable().default(null),
})

export const contactInfoSettingsSchema = z.object({
  title: z.string().min(1).max(80).default("Get in Touch"),
  showPhone: z.boolean().default(true),
  showEmail: z.boolean().default(true),
  showAddress: z.boolean().default(true),
  showWhatsapp: z.boolean().default(true),
  showInstagram: z.boolean().default(true),
})

export const blockSettingsSchemas = {
  hero: heroSettingsSchema,
  "product-grid": productGridSettingsSchema,
  "service-grid": serviceGridSettingsSchema,
  about: aboutSettingsSchema,
  "contact-info": contactInfoSettingsSchema,
} as const

const blockBaseSchema = z.object({
  id: z.string().min(1),
  visible: z.boolean(),
})

export const blockSchema = z.discriminatedUnion("type", [
  blockBaseSchema.extend({ type: z.literal("hero"), settings: heroSettingsSchema }),
  blockBaseSchema.extend({ type: z.literal("product-grid"), settings: productGridSettingsSchema }),
  blockBaseSchema.extend({ type: z.literal("service-grid"), settings: serviceGridSettingsSchema }),
  blockBaseSchema.extend({ type: z.literal("about"), settings: aboutSettingsSchema }),
  blockBaseSchema.extend({ type: z.literal("contact-info"), settings: contactInfoSettingsSchema }),
])

export const pageSchemaSchema = z.object({
  schemaVersion: z.literal(1),
  blocks: z.array(blockSchema),
})
