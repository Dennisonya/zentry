import { blockRegistry, BLOCK_TYPES } from "@/lib/page-builder/block-registry"
import type { PageSchema } from "@/lib/page-builder/types"

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2, 10)
}

/**
 * Converts a business's current stock template into an equivalent starter
 * block list, so opening the builder for the first time shows something
 * that already resembles the real site instead of a blank page. Every
 * block starts with its registry default settings — those defaults are
 * already designed to fall back to the business's real data (hero image,
 * description, etc.) when nothing's been customized yet.
 */
export function convertLayoutToSchema(): PageSchema {
  return {
    schemaVersion: 1,
    blocks: BLOCK_TYPES.map((type) => ({
      id: generateId(),
      type,
      visible: true,
      settings: blockRegistry[type].defaultSettings,
    })) as PageSchema["blocks"],
  }
}
