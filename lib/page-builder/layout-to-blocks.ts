import { blockRegistry, BLOCK_TYPES } from "@/lib/page-builder/block-registry"
import { generateBlockId } from "@/lib/page-builder/generate-id"
import type { PageSchema } from "@/lib/page-builder/types"


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
      id: generateBlockId(),
      type,
      visible: true,
      settings: blockRegistry[type].defaultSettings,
    })) as PageSchema["blocks"],
  }
}
