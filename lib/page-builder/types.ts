import type { z } from "zod"
import type {
  heroSettingsSchema,
  productGridSettingsSchema,
  serviceGridSettingsSchema,
  aboutSettingsSchema,
  contactInfoSettingsSchema,
} from "@/lib/page-builder/block-schemas"

export type BlockType = "hero" | "product-grid" | "service-grid" | "about" | "contact-info"

export type BlockSettingsMap = {
  hero: z.infer<typeof heroSettingsSchema>
  "product-grid": z.infer<typeof productGridSettingsSchema>
  "service-grid": z.infer<typeof serviceGridSettingsSchema>
  about: z.infer<typeof aboutSettingsSchema>
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
