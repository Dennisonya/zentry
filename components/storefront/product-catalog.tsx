"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Search, ShoppingBag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/storefront/product-card"
import { getStorefrontStock } from "@/lib/product-categories"
import { StoreCartDrawer } from "@/components/storefront/store-cart-drawer"
import {
  addToStoreCart,
  readStoreCart,
  removeFromStoreCart,
  updateStoreCartQuantity,
  clearStoreCart,
  type StoreCartItem,
  toastNoMoreStock,
} from "@/lib/store-cart"
import { getContrastTextColor } from "@/lib/color-contrast"
import type { Business, Product } from "@/components/business-layouts"

interface ProductCatalogProps {
  business: Business
  products: Product[]
}

export function ProductCatalog({ business, products }: ProductCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [cartItems, setCartItems] = useState<StoreCartItem[]>([])
  const accentColor = business.accent_color || business.theme_color

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

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter((c): c is string => Boolean(c?.trim())))).sort(),
    [products],
  )

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return products.filter((product) => {
      const matchesSearch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        (product.description ?? "").toLowerCase().includes(q) ||
        (product.category ?? "").toLowerCase().includes(q)
      const matchesCategory = selectedCategory === null || product.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, selectedCategory])

  const handleAddToCart = (product: Product) => {
    const added = addToStoreCart(business.id, product, 1, null, getStorefrontStock(product).remaining)
    if (added === 0) toastNoMoreStock(product.name, getStorefrontStock(product).remaining)
    syncCart()
    return added > 0
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href={`/${business.slug}`} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> {business.business_name}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">All Products</h1>
        <p className="mt-2 text-muted-foreground">Browse everything {business.business_name} has to offer.</p>

        <div className="mt-6 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {categories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              style={selectedCategory === null ? { backgroundColor: accentColor, color: getContrastTextColor(accentColor), borderColor: accentColor } : undefined}
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant="outline"
                size="sm"
                className="rounded-full"
                style={selectedCategory === category ? { backgroundColor: accentColor, color: getContrastTextColor(accentColor), borderColor: accentColor } : undefined}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        )}

        <p className="mt-6 text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "product" : "products"}
        </p>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No products found.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} accentColor={accentColor} onAddToCart={handleAddToCart} businessSlug={business.slug} />
            ))}
          </div>
        )}
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
