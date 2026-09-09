"use client"

import { useEffect, useMemo, useState } from "react"
import { BlockRenderer } from "@/components/page-builder/block-renderer"
import { convertLayoutToSchema } from "@/lib/page-builder/layout-to-blocks"
import { StoreCartDrawer } from "@/components/storefront/store-cart-drawer"
import { getGoogleFontUrl } from "@/lib/storefront-fonts"
import {
  addToStoreCart,
  readStoreCart,
  removeFromStoreCart,
  updateStoreCartQuantity,
  clearStoreCart,
  type StoreCartItem,
} from "@/lib/store-cart"
import type { PageSchema } from "@/lib/page-builder/types"
import type { Product, Service } from "@/components/business-layouts"
import type { LayoutStyle } from "@/lib/layouts"

export interface Business {
  id: string
  slug: string
  business_name: string
  business_type: string
  business_type_mode?: string
  phone: string | null
  email: string | null
  address: string | null
  description: string | null
  logo_url: string | null
  theme_color: string
  whatsapp_number: string | null
  instagram_handle: string | null
  layout_style?: LayoutStyle
  accent_color?: string | null
  hero_image_url: string | null
  dark_mode_enabled?: boolean
  subscription_plan?: string | null
  subscription_status?: string | null
  page_schema?: unknown
  font_family?: string | null
}

interface BusinessPageProps {
  business: Business
  products: Product[]
  services: Service[]
}

export function BusinessPage({ business, products, services }: BusinessPageProps) {
  const schema = (business.page_schema as PageSchema | null) || convertLayoutToSchema()
  const [cartOpen, setCartOpen] = useState(false)
  const [cartItems, setCartItems] = useState<StoreCartItem[]>([])

  const syncCart = () => setCartItems(readStoreCart(business.id))

  useEffect(() => {
    syncCart()

    const handleCartUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ businessId?: string }>
      if (!customEvent.detail?.businessId || customEvent.detail.businessId === business.id) syncCart()
    }

    window.addEventListener("zentry:cart-updated", handleCartUpdate)
    return () => window.removeEventListener("zentry:cart-updated", handleCartUpdate)
  }, [business.id])

  // Loads the chosen Google Font's stylesheet once. block-renderer.tsx
  // applies the matching CSS font-family — this just makes sure the
  // actual font file is available for the browser to use.
  useEffect(() => {
    const href = getGoogleFontUrl(business.font_family)
    if (!href) return
    const existing = document.querySelector(`link[data-storefront-font="${business.font_family}"]`)
    if (existing) return
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = href
    link.setAttribute("data-storefront-font", business.font_family || "")
    document.head.appendChild(link)
  }, [business.font_family])

  const addProduct = (product: Product) => {
    addToStoreCart(business.id, product)
    syncCart()
  }

  const changeQuantity = (productId: string, quantity: number, variantId: string | null = null) => {
    updateStoreCartQuantity(business.id, productId, quantity, variantId)
    syncCart()
  }

  const removeProduct = (productId: string, variantId: string | null = null) => {
    removeFromStoreCart(business.id, productId, variantId)
    syncCart()
  }

  const clearCart = () => {
    clearStoreCart(business.id)
    syncCart()
  }

  const cartItemCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems])

  return (
    <>
      <BlockRenderer
        schema={schema}
        business={business}
        products={products}
        services={services}
        onAddToCart={addProduct}
        cartItemCount={cartItemCount}
        onCartOpen={() => setCartOpen(true)}
      />

      <StoreCartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        businessId={business.id}
        businessName={business.business_name}
        whatsappNumber={business.whatsapp_number}
        items={cartItems}
        onQuantityChange={changeQuantity}
        onRemove={removeProduct}
        onClear={clearCart}
      />
    </>
  )
}
