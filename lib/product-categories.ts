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

export interface ProductVariant {
  id: string
  size: string | null
  color: string | null
  stock_quantity: number
  low_stock_threshold: number | null
}

/** Same low/out/in-stock logic as `getStockStatus`, applied to one variant row. */
export function getVariantStockStatus(
  variant: Pick<ProductVariant, "stock_quantity" | "low_stock_threshold">,
  productLowStockThreshold: number | null,
): Exclude<StockStatus, "not-tracked"> {
  if (variant.stock_quantity <= 0) return "out"
  const threshold = variant.low_stock_threshold ?? productLowStockThreshold ?? 5
  if (variant.stock_quantity <= threshold) return "low"
  return "in-stock"
}

/**
 * Rolls up every variant's status into one badge for a product card: "out"
 * only when every variant is out, "low" when any variant is low or out
 * (there's still something to warn about), "in-stock" otherwise.
 */
export function getProductStockSummary(
  variants: ProductVariant[],
  productLowStockThreshold: number | null,
): StockStatus {
  if (variants.length === 0) return "not-tracked"
  const statuses = variants.map((v) => getVariantStockStatus(v, productLowStockThreshold))
  if (statuses.every((s) => s === "out")) return "out"
  if (statuses.some((s) => s === "out" || s === "low")) return "low"
  return "in-stock"
}

/**
 * Stock as a storefront shopper sees it, for any product row: its status and
 * how many can still be bought (null when the product doesn't track stock).
 * Variant products need their `product_variants` rows loaded; without them
 * the product is treated as not tracked here and the detail page decides.
 */
export function getStorefrontStock(product: {
  has_variants?: boolean | null
  track_inventory?: boolean | null
  stock_quantity?: number | null
  low_stock_threshold?: number | null
  product_variants?: Pick<ProductVariant, "stock_quantity" | "low_stock_threshold">[] | null
}): { status: StockStatus; remaining: number | null } {
  if (product.has_variants) {
    const variants = product.product_variants ?? []
    if (variants.length === 0) return { status: "not-tracked", remaining: null }
    const status = getProductStockSummary(variants as ProductVariant[], product.low_stock_threshold ?? null)
    const remaining = variants.reduce((sum, v) => sum + Math.max(0, v.stock_quantity), 0)
    return { status, remaining }
  }
  const status = getStockStatus({
    track_inventory: !!product.track_inventory,
    stock_quantity: product.stock_quantity ?? null,
    low_stock_threshold: product.low_stock_threshold ?? null,
  })
  return { status, remaining: status === "not-tracked" ? null : Math.max(0, product.stock_quantity ?? 0) }
}

/** A short "White / Large" style label for a variant, for cart lines and pickers. */
export function variantLabel(variant: { size?: string | null; color?: string | null }): string {
  return [variant.color, variant.size].filter(Boolean).join(" / ")
}
