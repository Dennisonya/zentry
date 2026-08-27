import type { Product } from "@/components/business-page"

export interface StoreCartItem {
  productId: string
  name: string
  price: number
  imageUrl: string | null
  quantity: number
}

const STORAGE_PREFIX = "zentry:store-cart:"

function storageKey(businessId: string) {
  return `${STORAGE_PREFIX}${businessId}`
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

export function addToStoreCart(businessId: string, product: Product, quantity = 1) {
  const items = readStoreCart(businessId)
  const existing = items.find((item) => item.productId === product.id)

  if (existing) {
    existing.quantity += quantity
  } else {
    items.push({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      imageUrl: product.image_url ?? null,
      quantity,
    })
  }

  writeStoreCart(businessId, items)
}

export function updateStoreCartQuantity(businessId: string, productId: string, quantity: number) {
  const items = readStoreCart(businessId)
  const next = items
    .map((item) => (item.productId === productId ? { ...item, quantity } : item))
    .filter((item) => item.quantity > 0)
  writeStoreCart(businessId, next)
}

export function removeFromStoreCart(businessId: string, productId: string) {
  writeStoreCart(
    businessId,
    readStoreCart(businessId).filter((item) => item.productId !== productId),
  )
}

export function clearStoreCart(businessId: string) {
  writeStoreCart(businessId, [])
}
