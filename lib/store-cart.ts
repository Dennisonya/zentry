import { toast } from "sonner"
import type { Product } from "@/components/business-layouts"

export interface StoreCartItem {
  productId: string
  /** null for a product with no size/color variants. */
  variantId: string | null
  /** Display-only, e.g. "White / 45" — not used for matching. */
  variantLabel?: string
  name: string
  price: number
  imageUrl: string | null
  quantity: number
  /** Stock left when the item was added; null when the product doesn't track
   *  stock. The database re-checks at checkout, this just stops the cart
   *  from offering more than exists. */
  maxQuantity?: number | null
}

const STORAGE_PREFIX = "zentry:store-cart:"

function storageKey(businessId: string) {
  return `${STORAGE_PREFIX}${businessId}`
}

/** Two lines are "the same" only if both the product and the chosen variant match. */
function sameLine(item: StoreCartItem, productId: string, variantId: string | null) {
  return item.productId === productId && (item.variantId ?? null) === (variantId ?? null)
}

export function readStoreCart(businessId: string): StoreCartItem[] {
  if (typeof window === "undefined") return []

  try {
    const raw = window.localStorage.getItem(storageKey(businessId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter(
      (item): item is StoreCartItem =>
        item &&
        typeof item.productId === "string" &&
        typeof item.name === "string" &&
        typeof item.price === "number" &&
        typeof item.quantity === "number" &&
        item.quantity > 0,
    )
  } catch {
    return []
  }
}

function writeStoreCart(businessId: string, items: StoreCartItem[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(storageKey(businessId), JSON.stringify(items))
  window.dispatchEvent(new CustomEvent("zentry:cart-updated", { detail: { businessId } }))
}

/**
 * Adds to the cart without going past `maxQuantity` (the stock left, or null
 * when untracked). Returns how many were actually added — 0 means the item is
 * sold out or the cart already holds all that's left.
 */
export function addToStoreCart(
  businessId: string,
  product: Product,
  quantity = 1,
  variant?: { id: string; label: string } | null,
  maxQuantity: number | null = null,
): number {
  const items = readStoreCart(businessId)
  const variantId = variant?.id ?? null
  const existing = items.find((item) => sameLine(item, product.id, variantId))
  const inCart = existing?.quantity ?? 0
  const room = maxQuantity == null ? quantity : Math.max(0, Math.min(quantity, maxQuantity - inCart))
  if (room <= 0) return 0

  if (existing) {
    existing.quantity += room
    existing.maxQuantity = maxQuantity
  } else {
    items.push({
      productId: product.id,
      variantId,
      variantLabel: variant?.label,
      name: product.name,
      price: Number(product.price),
      imageUrl: product.image_url ?? null,
      quantity: room,
      maxQuantity,
    })
  }

  writeStoreCart(businessId, items)
  return room
}

export function updateStoreCartQuantity(businessId: string, productId: string, quantity: number, variantId: string | null = null) {
  const items = readStoreCart(businessId)
  const next = items
    .map((item) =>
      sameLine(item, productId, variantId)
        ? { ...item, quantity: item.maxQuantity == null ? quantity : Math.min(quantity, item.maxQuantity) }
        : item,
    )
    .filter((item) => item.quantity > 0)
  writeStoreCart(businessId, next)
}

export function removeFromStoreCart(businessId: string, productId: string, variantId: string | null = null) {
  writeStoreCart(
    businessId,
    readStoreCart(businessId).filter((item) => !sameLine(item, productId, variantId)),
  )
}

export function clearStoreCart(businessId: string) {
  writeStoreCart(businessId, [])
}

/** The message shown when add-to-cart hits the stock limit. */
export function toastNoMoreStock(name: string, remaining: number | null) {
  if (!remaining) toast.error(`${name} is sold out.`)
  else toast.error(`Only ${remaining} of ${name} available`, { description: "They're all in your cart already." })
}
