"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ShoppingCart, Check } from "lucide-react"
import { getContrastTextColor } from "@/lib/color-contrast"
import type { Product } from "@/components/business-layouts"
import { FavoriteButton } from "@/components/favorite-button"
import { StoreImage } from "@/components/store-image"
import { getStorefrontStock } from "@/lib/product-categories"

function money(n: number) {
  const x = Number(n)
  return Number.isFinite(x) ? x.toFixed(2) : "0.00"
}

interface ProductCardProps {
  product: Product
  accentColor: string
  /** Returns false when nothing was added (sold out or cart already holds all stock). */
  onAddToCart: (product: Product) => boolean | void
  /** Slug of the business the product belongs to — builds the detail-page
   *  link. Required for a variant product, since it can't be added to the
   *  cart without picking a size/color first. */
  businessSlug?: string
}

/**
 * The single product-card look used across the storefront (product grid,
 * catalog page, new arrivals) — kept here once so a redesign only needs to
 * happen in one place.
 *
 * A product with size/color variants links to its detail page to pick a
 * variant instead of adding straight to the cart, since there's no single
 * "the product" stock/price to add without knowing which one.
 */
export function ProductCard({ product, accentColor, onAddToCart, businessSlug }: ProductCardProps) {
  const [added, setAdded] = useState(false)
  const href = businessSlug ? `/${businessSlug}/products/${product.id}` : undefined

  const stock = getStorefrontStock(product)
  const soldOut = stock.status === "out"

  const handleAdd = () => {
    if (soldOut || onAddToCart(product) === false) return
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1200)
  }

  const media = product.image_url && (
    <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-muted">
      <StoreImage src={product.image_url} alt={product.name} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" className={`object-contain transition-transform duration-300 group-hover:scale-105 ${soldOut ? "opacity-50 grayscale" : ""}`} />
    </div>
  )

  return (
    <Card className="group overflow-hidden border-border/60 shadow-none transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative">
        {href ? <Link href={href}>{media}</Link> : media}
        <FavoriteButton
          kind="product"
          id={product.id}
          name={product.name}
          className="absolute right-2 top-2 h-8 w-8 bg-background/85 shadow-sm backdrop-blur hover:bg-background"
          iconClassName="h-4 w-4"
        />
        {product.image_url && <StockBadge status={stock.status} remaining={stock.remaining} hasVariants={!!product.has_variants} />}
      </div>
      <CardContent className="p-4">
        {!product.image_url && (
          <StockBadge status={stock.status} remaining={stock.remaining} hasVariants={!!product.has_variants} inline />
        )}
        {href ? (
          <Link href={href} className="hover:underline">
            <h3 className="mb-1 truncate text-sm font-medium">{product.name}</h3>
          </Link>
        ) : (
          <h3 className="mb-1 truncate text-sm font-medium">{product.name}</h3>
        )}
        <div className="flex items-center justify-between gap-3">
          <span className="text-base font-semibold">${money(product.price)}</span>
          {soldOut ? (
            <Button size="sm" variant="outline" className="h-9 shrink-0 rounded-full" disabled>
              Sold out
            </Button>
          ) : product.has_variants && href ? (
            <Button asChild size="sm" variant="outline" className="h-9 shrink-0 rounded-full">
              <Link href={href}>Select</Link>
            </Button>
          ) : (
            <Button
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full"
              style={{ backgroundColor: accentColor, color: getContrastTextColor(accentColor) }}
              onClick={handleAdd}
              aria-label={added ? "Added to cart" : "Add to cart"}
            >
              {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/** "Sold out" / "Only 3 left" pill over the card image; nothing when stock is fine or untracked. */
export function StockBadge({
  status,
  remaining,
  hasVariants = false,
  inline = false,
}: {
  status: string
  remaining: number | null
  hasVariants?: boolean
  /** In the text flow instead of floating over an image. */
  inline?: boolean
}) {
  if (status !== "out" && status !== "low") return null
  const label =
    status === "out" ? "Sold out" : hasVariants || remaining == null ? "Low stock" : `Only ${remaining} left`
  return (
    <span
      className={`pointer-events-none rounded-full px-2.5 py-1 ${inline ? "mb-2 inline-block" : "absolute left-2 top-2"} text-xs font-medium shadow-sm ${
        status === "out" ? "bg-foreground text-background" : "bg-amber-500 text-white"
      }`}
    >
      {label}
    </span>
  )
}
