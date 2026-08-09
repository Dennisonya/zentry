export const UNCATEGORIZED_LABEL = "Other"

export interface CategorizedItem {
  category: string | null
}

export interface ProductCategoryGroup<T> {
  category: string
  items: T[]
}

/**
 * Groups a list of products (or services) by their `category` field.
 * Items with no category (null/empty/whitespace) are bucketed under
 * UNCATEGORIZED_LABEL, which always sorts last. Named categories sort
 * alphabetically. Used by both the Inventory page and the storefront
 * layouts so grouping stays consistent everywhere.
 */
export function groupByCategory<T extends CategorizedItem>(items: T[]): ProductCategoryGroup<T>[] {
  const groups = new Map<string, T[]>()

  for (const item of items) {
    const raw = item.category?.trim()
    const key = raw && raw.length > 0 ? raw : UNCATEGORIZED_LABEL
    const existing = groups.get(key)
    if (existing) {
      existing.push(item)
    } else {
      groups.set(key, [item])
    }
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => {
      if (a === UNCATEGORIZED_LABEL) return 1
      if (b === UNCATEGORIZED_LABEL) return -1
      return a.localeCompare(b)
    })
    .map(([category, items]) => ({ category, items }))
}

/** Distinct, sorted list of categories currently in use — for autocomplete. */
export function distinctCategories<T extends CategorizedItem>(items: T[]): string[] {
  const set = new Set<string>()
  for (const item of items) {
    const raw = item.category?.trim()
    if (raw) set.add(raw)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}

export type StockStatus = "not-tracked" | "in-stock" | "low" | "out"

export function getStockStatus(product: {
  track_inventory: boolean
  stock_quantity: number | null
  low_stock_threshold: number | null
}): StockStatus {
  if (!product.track_inventory || product.stock_quantity === null || product.stock_quantity === undefined) {
    return "not-tracked"
  }
  if (product.stock_quantity <= 0) return "out"
  if (product.stock_quantity <= (product.low_stock_threshold ?? 5)) return "low"
  return "in-stock"
}
