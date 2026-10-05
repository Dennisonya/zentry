"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StoreCartDrawer } from "@/components/storefront/store-cart-drawer"
import {
  addToStoreCart,
  readStoreCart,
  removeFromStoreCart,
  updateStoreCartQuantity,
  clearStoreCart,
  type StoreCartItem,
} from "@/lib/store-cart"
import { getContrastTextColor } from "@/lib/color-contrast"
import { getStockStatus, getVariantStockStatus, variantLabel, type ProductVariant } from "@/lib/product-categories"
import type { Business, Product } from "@/components/business-layouts"
import { FavoriteButton } from "@/components/favorite-button"
import { StoreImage } from "@/components/store-image"

interface ProductImageRow {
  id: string
  url: string
  position: number
}

interface FullProduct extends Product {
  has_variants?: boolean
  track_inventory?: boolean
  stock_quantity?: number | null
  low_stock_threshold?: number | null
}

interface ProductDetailProps {
  business: Business
  product: FullProduct
  images: ProductImageRow[]
  variants: ProductVariant[]
}

function money(n: number) {
  const x = Number(n)
  return Number.isFinite(x) ? x.toFixed(2) : "0.00"
}

const stockBadge: Record<string, { label: string; className: string }> = {
  out: { label: "Out of stock", className: "bg-destructive/10 text-destructive" },
  low: { label: "Low stock", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  "in-stock": { label: "In stock", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
}

export function ProductDetail({ business, product, images, variants }: ProductDetailProps) {
  const accentColor = business.accent_color || business.theme_color
  const gallery = images.length > 0 ? images.map((i) => i.url) : product.image_url ? [product.image_url] : []
  const [activeImage, setActiveImage] = useState(0)

  const sizes = useMemo(() => Array.from(new Set(variants.map((v) => v.size).filter(Boolean))) as string[], [variants])
  const colors = useMemo(() => Array.from(new Set(variants.map((v) => v.color).filter(Boolean))) as string[], [variants])

  const [selectedSize, setSelectedSize] = useState<string | null>(sizes[0] ?? null)
  const [selectedColor, setSelectedColor] = useState<string | null>(colors[0] ?? null)

  const selectedVariant = useMemo(() => {
    if (!product.has_variants) return null
    return (
      variants.find(
        (v) => (sizes.length === 0 || v.size === selectedSize) && (colors.length === 0 || v.color === selectedColor),
      ) ?? null
    )
  }, [variants, selectedSize, selectedColor, sizes.length, colors.length, product.has_variants])

  const stockStatus = product.has_variants
    ? selectedVariant
      ? getVariantStockStatus(selectedVariant, product.low_stock_threshold ?? null)
      : null
    : getStockStatus({
        track_inventory: !!product.track_inventory,
        stock_quantity: product.stock_quantity ?? null,
        low_stock_threshold: product.low_stock_threshold ?? null,
      })

  const canAdd = product.has_variants ? !!selectedVariant && stockStatus !== "out" : stockStatus !== "out"

  const [added, setAdded] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [cartItems, setCartItems] = useState<StoreCartItem[]>([])

  const syncCart = () => setCartItems(readStoreCart(business.id))

  useEffect(() => {
    syncCart()
    const handleCartUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ businessId?: string }>).detail
      if (!detail?.businessId || detail.businessId === business.id) syncCart()
    }
    window.addEventListener("zentry:cart-updated", handleCartUpdate)
    return () => window.removeEventListener("zentry:cart-updated", handleCartUpdate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business.id])

  const handleAdd = () => {
    if (!canAdd) return
    if (product.has_variants && selectedVariant) {
      addToStoreCart(business.id, product, 1, { id: selectedVariant.id, label: variantLabel(selectedVariant) })
    } else {
      addToStoreCart(business.id, product, 1)
    }
    syncCart()
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1200)
  }

  const badge = stockStatus && stockStatus !== "not-tracked" ? stockBadge[stockStatus] : null

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href={`/${business.slug}/products`} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> All products
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-8 sm:px-6 md:grid-cols-2 lg:px-8">
        <div>
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border bg-muted">
            {gallery.length > 0 ? (
              <StoreImage src={gallery[activeImage]} alt={product.name} sizes="(min-width: 768px) 50vw, 100vw" priority className="object-contain" />
            ) : (
              <ShoppingCart className="h-16 w-16 text-muted-foreground/40" />
            )}
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {gallery.map((url, i) => (
                <button
                  key={url + i}
                  onClick={() => setActiveImage(i)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${i === activeImage ? "" : "border-transparent opacity-70 hover:opacity-100"}`}
                  style={i === activeImage ? { borderColor: accentColor } : undefined}
                  aria-label={`View image ${i + 1}`}
                >
                  <StoreImage src={url} alt="" sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.category && <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{product.category}</p>}
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{product.name}</h1>
          <p className="mt-3 text-2xl font-semibold">${money(product.price)}</p>
          {product.description && <p className="mt-4 text-sm leading-6 text-muted-foreground">{product.description}</p>}

          {sizes.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium">Size</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
                    style={selectedSize === size ? { borderColor: accentColor, backgroundColor: accentColor, color: getContrastTextColor(accentColor) } : undefined}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {colors.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium">Color</p>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
                    style={selectedColor === color ? { borderColor: accentColor, backgroundColor: accentColor, color: getContrastTextColor(accentColor) } : undefined}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {badge && (
            <span className={`mt-6 inline-block rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
              {badge.label}
              {stockStatus === "low" && selectedVariant ? ` — only ${selectedVariant.stock_quantity} left` : ""}
              {stockStatus === "low" && !product.has_variants && product.stock_quantity != null ? ` — only ${product.stock_quantity} left` : ""}
            </span>
          )}

          {product.has_variants && (sizes.length > 0 || colors.length > 0) && !selectedVariant && (
            <p className="mt-4 text-sm text-muted-foreground">That combination isn't available.</p>
          )}

          <div className="mt-6 flex items-center gap-3">
          <Button
            size="lg"
            className="flex-1 rounded-full sm:flex-none"
            style={{ backgroundColor: accentColor, color: getContrastTextColor(accentColor) }}
            onClick={handleAdd}
            disabled={!canAdd}
          >
            {added ? <Check className="mr-2 h-4 w-4" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
            {added ? "Added" : canAdd ? "Add to cart" : "Unavailable"}
          </Button>
          <FavoriteButton kind="product" id={product.id} name={product.name} className="h-11 w-11 shrink-0 border" />
          </div>
        </div>
      </div>

      <StoreCartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        businessId={business.id}
        businessName={business.business_name}
        whatsappNumber={business.whatsapp_number}
        items={cartItems}
        onQuantityChange={(productId, quantity, variantId) => {
          updateStoreCartQuantity(business.id, productId, quantity, variantId)
          syncCart()
        }}
        onRemove={(productId, variantId) => {
          removeFromStoreCart(business.id, productId, variantId)
          syncCart()
        }}
        onClear={() => {
          clearStoreCart(business.id)
          syncCart()
        }}
      />
    </div>
  )
}
