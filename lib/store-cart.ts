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

export function addToStoreCart(
  businessId: string,
  product: Product,
  quantity = 1,
  variant?: { id: string; label: string } | null,
) {
  const items = readStoreCart(businessId)
  const variantId = variant?.id ?? null
  const existing = items.find((item) => sameLine(item, product.id, variantId))

  if (existing) {
    existing.quantity += quantity
  } else {
    items.push({
      productId: product.id,
      variantId,
      variantLabel: variant?.label,
      name: product.name,
      price: Number(product.price),
      imageUrl: product.image_url ?? null,
      quantity,
    })
  }

  writeStoreCart(businessId, items)
}

export function updateStoreCartQuantity(businessId: string, productId: string, quantity: number, variantId: string | null = null) {
  const items = readStoreCart(businessId)
  const next = items
    .map((item) => (sameLine(item, productId, variantId) ? { ...item, quantity } : item))
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
