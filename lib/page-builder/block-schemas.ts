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
  // Controls the focal point of object-fit: cover without using fragile pixel positioning.
  imagePositionX: z.number().min(0).max(100).default(50),
  imagePositionY: z.number().min(0).max(100).default(50),
})

export const announcementBarSettingsSchema = z.object({
  text: z.string().min(1).max(200).default("Welcome! Check out what's new."),
  // Optional — full URL or a same-page anchor like "#storefront-products". Empty = not a link.
  link: z.string().max(300).default(""),
})

export const navbarSettingsSchema = z.object({
  showSearch: z.boolean().default(true),
  showCart: z.boolean().default(true),
})

export const categoriesSettingsSchema = z.object({
  title: z.string().max(80).default("Shop by Category"),
})

export const popularSettingsSchema = z.object({
  title: z.string().max(80).default("Popular Right Now"),
  productIds: z.array(z.string()).default([]),
  serviceIds: z.array(z.string()).default([]),
  maxItems: z.number().int().min(1).max(12).default(4),
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

export const bannerSettingsSchema = z.object({
  heading: z.string().max(120).default("Your next favorite find"),
  description: z.string().max(300).default(""),
  ctaText: z.string().max(40).default("Shop Now"),
  ctaLink: z.string().max(300).default("#storefront-products"),
  mediaUrl: z.string().nullable().default(null),
  mediaType: z.enum(["image", "video"]).default("image"),
})

export const aboutSettingsSchema = z.object({
  title: z.string().max(80).default("Made with intention."),
  body: z.string().max(2000).nullable().default(null),
  imageUrl: z.string().nullable().default(null),
  // Which side the image sits on — "center" hides the image and just centers the text.
  alignment: z.enum(["left", "center", "right"]).default("left"),
  ctaText: z.string().max(40).default(""),
  ctaLink: z.string().max(300).default("#storefront-contact"),
})

export const trustSettingsSchema = z.object({
  // Empty means the render component fills in sensible defaults based on
  // whether the business sells products, services, or both.
  items: z.array(z.string().max(60)).max(4).default([]),
})

export const footerSettingsSchema = z.object({
  showSocials: z.boolean().default(true),
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
  "announcement-bar": announcementBarSettingsSchema,
  navbar: navbarSettingsSchema,
  hero: heroSettingsSchema,
  popular: popularSettingsSchema,
  categories: categoriesSettingsSchema,
  "product-grid": productGridSettingsSchema,
  "service-grid": serviceGridSettingsSchema,
  banner: bannerSettingsSchema,
  about: aboutSettingsSchema,
  trust: trustSettingsSchema,
  footer: footerSettingsSchema,
  "contact-info": contactInfoSettingsSchema,
} as const

const blockBaseSchema = z.object({
  id: z.string().min(1),
  visible: z.boolean(),
})

export const blockSchema = z.discriminatedUnion("type", [
  blockBaseSchema.extend({ type: z.literal("announcement-bar"), settings: announcementBarSettingsSchema }),
  blockBaseSchema.extend({ type: z.literal("navbar"), settings: navbarSettingsSchema }),
  blockBaseSchema.extend({ type: z.literal("hero"), settings: heroSettingsSchema }),
  blockBaseSchema.extend({ type: z.literal("popular"), settings: popularSettingsSchema }),
  blockBaseSchema.extend({ type: z.literal("categories"), settings: categoriesSettingsSchema }),
  blockBaseSchema.extend({ type: z.literal("product-grid"), settings: productGridSettingsSchema }),
  blockBaseSchema.extend({ type: z.literal("service-grid"), settings: serviceGridSettingsSchema }),
  blockBaseSchema.extend({ type: z.literal("banner"), settings: bannerSettingsSchema }),
  blockBaseSchema.extend({ type: z.literal("about"), settings: aboutSettingsSchema }),
  blockBaseSchema.extend({ type: z.literal("trust"), settings: trustSettingsSchema }),
  blockBaseSchema.extend({ type: z.literal("footer"), settings: footerSettingsSchema }),
  blockBaseSchema.extend({ type: z.literal("contact-info"), settings: contactInfoSettingsSchema }),
])

export const pageSchemaSchema = z.object({
  schemaVersion: z.literal(1),
  blocks: z.array(blockSchema),
})
