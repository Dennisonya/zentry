"use client"

import { useEffect, useState } from "react"
import { BlockRenderer } from "@/components/page-builder/block-renderer"
import { convertLayoutToSchema } from "@/lib/page-builder/layout-to-blocks"
import { StoreCartDrawer } from "@/components/storefront/store-cart-drawer"
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

export interface Business {
  id: string
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
  accent_color?: string | null
  hero_image_url?: string | null
  page_schema?: PageSchema | null
}

interface BusinessPageProps {
  business: Business
  products: Product[]
  services: Service[]
}

export function BusinessPage({ business, products, services }: BusinessPageProps) {
  const schema = business.page_schema || convertLayoutToSchema()
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

  const addProduct = (product: Product) => {
    addToStoreCart(business.id, product)
    syncCart()
  }

  const changeQuantity = (productId: string, quantity: number) => {
    updateStoreCartQuantity(business.id, productId, quantity)
    syncCart()
  }

  const removeProduct = (productId: string) => {
    removeFromStoreCart(business.id, productId)
    syncCart()
  }

  const clearCart = () => {
    clearStoreCart(business.id)
    syncCart()
  }

  return (
    <>
      <BlockRenderer
        schema={schema}
        business={business}
        products={products}
        services={services}
        onAddToCart={addProduct}
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
