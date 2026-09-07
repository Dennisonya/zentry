import type { z } from "zod"
import type {
  heroSettingsSchema,
  announcementBarSettingsSchema,
  navbarSettingsSchema,
  popularSettingsSchema,
  categoriesSettingsSchema,
  productGridSettingsSchema,
  serviceGridSettingsSchema,
  bannerSettingsSchema,
  aboutSettingsSchema,
  trustSettingsSchema,
  footerSettingsSchema,
  contactInfoSettingsSchema,
} from "@/lib/page-builder/block-schemas"

export type BlockType =
  | "announcement-bar"
  | "navbar"
  | "hero"
  | "popular"
  | "categories"
  | "product-grid"
  | "service-grid"
  | "banner"
  | "about"
  | "trust"
  | "footer"
  | "contact-info"

export type BlockSettingsMap = {
  "announcement-bar": z.infer<typeof announcementBarSettingsSchema>
  navbar: z.infer<typeof navbarSettingsSchema>
  hero: z.infer<typeof heroSettingsSchema>
  popular: z.infer<typeof popularSettingsSchema>
  categories: z.infer<typeof categoriesSettingsSchema>
  "product-grid": z.infer<typeof productGridSettingsSchema>
  "service-grid": z.infer<typeof serviceGridSettingsSchema>
  banner: z.infer<typeof bannerSettingsSchema>
  about: z.infer<typeof aboutSettingsSchema>
  trust: z.infer<typeof trustSettingsSchema>
  footer: z.infer<typeof footerSettingsSchema>
  "contact-info": z.infer<typeof contactInfoSettingsSchema>
}

interface BlockBase {
  /** Stable id, generated once when the block is added — used for React keys and drag-reordering. */
  id: string
  visible: boolean
}

/** Discriminated union — `block.type` narrows `block.settings` automatically. */
export type Block = {
  [K in BlockType]: BlockBase & { type: K; settings: BlockSettingsMap[K] }
}[BlockType]

export interface PageSchema {
  schemaVersion: 1
  blocks: Block[]
}

export function isPageSchema(value: unknown): value is PageSchema {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>
  return v.schemaVersion === 1 && Array.isArray(v.blocks)
}
