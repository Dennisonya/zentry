"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ShoppingCart, Check } from "lucide-react"
import { getContrastTextColor } from "@/lib/color-contrast"
import type { Product } from "@/components/business-layouts"
import { FavoriteButton } from "@/components/favorite-button"

function money(n: number) {
  const x = Number(n)
  return Number.isFinite(x) ? x.toFixed(2) : "0.00"
}

interface ProductCardProps {
  product: Product
  accentColor: string
  onAddToCart: (product: Product) => void
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

  const handleAdd = () => {
    onAddToCart(product)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1200)
  }

  const media = product.image_url && (
    <div className="flex aspect-square items-center justify-center overflow-hidden bg-muted">
      <img src={product.image_url} alt={product.name} className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" />
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
      </div>
      <CardContent className="p-4">
        {href ? (
          <Link href={href} className="hover:underline">
            <h3 className="mb-1 truncate text-sm font-medium">{product.name}</h3>
          </Link>
        ) : (
          <h3 className="mb-1 truncate text-sm font-medium">{product.name}</h3>
        )}
        <div className="flex items-center justify-between gap-3">
          <span className="text-base font-semibold">${money(product.price)}</span>
          {product.has_variants && href ? (
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
