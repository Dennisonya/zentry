import { z } from "zod"

// The schema is the contract for both validation and the design inspector.
// Keep editor-facing values serializable so they can live safely in page_schema.

export const heroSettingsSchema = z.object({
  showLogo: z.boolean().default(true),
  showDescription: z.boolean().default(true),
  heroImageUrl: z.string().url().nullable().default(null),
  heading: z.string().max(120).default(""),
  description: z.string().max(500).default(""),
  contentAlignment: z.enum(["left", "center", "right"]).default("center"),
  contentVerticalAlignment: z.enum(["top", "center", "bottom"]).default("center"),
})

export const productGridSettingsSchema = z.object({
  title: z.string().max(80).default("Our Products"),
  groupByCategory: z.boolean().default(true),
  titleAlignment: z.enum(["left", "center", "right"]).default("center"),
})

export const serviceGridSettingsSchema = z.object({
  title: z.string().max(80).default("Our Services"),
  titleAlignment: z.enum(["left", "center", "right"]).default("center"),
})

export const aboutSettingsSchema = z.object({
  title: z.string().max(80).default("About Us"),
  body: z.string().max(2000).nullable().default(null),
  alignment: z.enum(["left", "center", "right"]).default("center"),
})

export const contactInfoSettingsSchema = z.object({
  title: z.string().max(80).default("Get in Touch"),
  showPhone: z.boolean().default(true),
  showEmail: z.boolean().default(true),
  showAddress: z.boolean().default(true),
  showWhatsapp: z.boolean().default(true),
  showInstagram: z.boolean().default(true),
  alignment: z.enum(["left", "center", "right"]).default("center"),
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
