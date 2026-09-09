import { z } from "zod"

// The schema is the contract for both validation and the design inspector.
// Keep editor-facing values serializable so they can live safely in page_schema.

export function countWords(value: string): number {
  return value.trim() === "" ? 0 : value.trim().split(/\s+/).length
}

/**
 * Per-field character and word limits, kept next to the schema so the
 * inspector's `maxLength` attributes and counters can import the exact same
 * numbers instead of a second, driftable copy.
 */
export const TEXT_LIMITS = {
  hero: { heading: { chars: 120, words: 15 }, description: { chars: 500 } },
  announcementBar: { text: { chars: 200 } },
  categories: { title: { chars: 80 } },
  popular: { title: { chars: 80 } },
  productGrid: { title: { chars: 80 } },
  serviceGrid: { title: { chars: 80 } },
  newArrivals: { title: { chars: 80 } },
  banner: { heading: { chars: 120 }, description: { chars: 300 }, ctaText: { chars: 40 } },
  about: { title: { chars: 80 }, body: { chars: 2000, words: 30 }, ctaText: { chars: 40 } },
  trust: { item: { chars: 60 } },
  contactInfo: { title: { chars: 80 } },
} as const

export const heroSettingsSchema = z.object({
  showLogo: z.boolean().default(true),
  showDescription: z.boolean().default(true),
  heroImageUrl: z.string().url().nullable().default(null),
  // Word count beyond TEXT_LIMITS.hero.heading.words is a soft, inspector-only
  // warning (not enforced here) so existing longer headings never get
  // rejected outright by this schema.
  heading: z.string().max(TEXT_LIMITS.hero.heading.chars).default(""),
  description: z.string().max(TEXT_LIMITS.hero.description.chars).default(""),
  contentAlignment: z.enum(["left", "center", "right"]).default("center"),
  contentVerticalAlignment: z.enum(["top", "center", "bottom"]).default("center"),
  // Controls the focal point of object-fit: cover without using fragile pixel positioning.
  imagePositionX: z.number().min(0).max(100).default(50),
  imagePositionY: z.number().min(0).max(100).default(50),
})

export const announcementBarSettingsSchema = z.object({
  text: z.string().min(1).max(TEXT_LIMITS.announcementBar.text.chars).default("Welcome! Check out what's new."),
  // Optional — full URL or a same-page anchor like "#storefront-products". Empty = not a link.
  link: z.string().max(300).default(""),
})

export const navbarSettingsSchema = z.object({
  showSearch: z.boolean().default(true),
  showCart: z.boolean().default(true),
})

export const categoriesSettingsSchema = z.object({
  title: z.string().max(TEXT_LIMITS.categories.title.chars).default("Shop by Category"),
  titleAlignment: z.enum(["left", "center", "right"]).default("left"),
})

export const popularSettingsSchema = z.object({
  title: z.string().max(TEXT_LIMITS.popular.title.chars).default("Popular Right Now"),
  productIds: z.array(z.string()).default([]),
  serviceIds: z.array(z.string()).default([]),
  maxItems: z.number().int().min(1).max(12).default(4),
  titleAlignment: z.enum(["left", "center", "right"]).default("left"),
})

export const productGridSettingsSchema = z.object({
  title: z.string().max(TEXT_LIMITS.productGrid.title.chars).default("Our Products"),
  groupByCategory: z.boolean().default(true),
  titleAlignment: z.enum(["left", "center", "right"]).default("center"),
})

export const serviceGridSettingsSchema = z.object({
  title: z.string().max(TEXT_LIMITS.serviceGrid.title.chars).default("Our Services"),
  titleAlignment: z.enum(["left", "center", "right"]).default("center"),
})

export const newArrivalsSettingsSchema = z.object({
  title: z.string().max(TEXT_LIMITS.newArrivals.title.chars).default("New Arrivals"),
  limit: z.number().int().min(1).max(24).default(8),
  titleAlignment: z.enum(["left", "center", "right"]).default("left"),
})

export const bannerSettingsSchema = z.object({
  heading: z.string().max(TEXT_LIMITS.banner.heading.chars).default("Your next favorite find"),
  description: z.string().max(TEXT_LIMITS.banner.description.chars).default(""),
  ctaText: z.string().max(TEXT_LIMITS.banner.ctaText.chars).default("Shop Now"),
  ctaLink: z.string().max(300).default("#storefront-products"),
  mediaUrl: z.string().nullable().default(null),
  mediaType: z.enum(["image", "video"]).default("image"),
})

export const aboutSettingsSchema = z.object({
  title: z.string().max(TEXT_LIMITS.about.title.chars).default("Made with intention."),
  // Word count beyond TEXT_LIMITS.about.body.words is a soft, inspector-only
  // warning (not enforced here) so existing longer stories never get
  // rejected outright by this schema.
  body: z.string().max(TEXT_LIMITS.about.body.chars).nullable().default(null),
  imageUrl: z.string().nullable().default(null),
  // Which side the image sits on — "center" hides the image and just centers the text.
  alignment: z.enum(["left", "center", "right"]).default("left"),
  ctaText: z.string().max(TEXT_LIMITS.about.ctaText.chars).default(""),
  ctaLink: z.string().max(300).default("#storefront-contact"),
})

export const trustSettingsSchema = z.object({
  // Empty means the render component fills in sensible defaults based on
  // whether the business sells products, services, or both.
  items: z.array(z.string().max(TEXT_LIMITS.trust.item.chars)).max(4).default([]),
})

export const footerSettingsSchema = z.object({
  showSocials: z.boolean().default(true),
})

export const contactInfoSettingsSchema = z.object({
  title: z.string().max(TEXT_LIMITS.contactInfo.title.chars).default("Get in Touch"),
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
  "new-arrivals": newArrivalsSettingsSchema,
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
  blockBaseSchema.extend({ type: z.literal("new-arrivals"), settings: newArrivalsSettingsSchema }),
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
