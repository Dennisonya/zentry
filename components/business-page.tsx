"use client"

<<<<<<< HEAD
import { BusinessPageWithLayout } from "./business-layouts"
import { type LayoutStyle } from "@/lib/layouts"
import { BlockRenderer } from "@/components/page-builder/block-renderer"
import { isPageSchema } from "@/lib/page-builder/types"
import { hasFeature } from "@/lib/plan-access"
=======
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
>>>>>>> 447dd1603412727f3d023f52cafc26f2dfa59e51

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
  layout_style?: LayoutStyle
  accent_color?: string | null
  hero_image_url: string | null
  dark_mode_enabled?: boolean
  subscription_plan?: string | null
  subscription_status?: string | null
  page_schema?: unknown
}

interface BusinessPageProps {
  business: Business
  products: Product[]
  services: Service[]
}

export function BusinessPage({ business, products, services }: BusinessPageProps) {
<<<<<<< HEAD
  // A Pro business with a published custom design renders through the
  // block builder instead of a stock template. The Pro check here is
  // defense in depth — migration 011's downgrade trigger already nulls
  // page_schema when a business leaves Pro, but a stale client-side
  // schema should never render even if that somehow lagged.
  if (business.page_schema && isPageSchema(business.page_schema) && hasFeature(business, "customStoreDesign")) {
    return (
      <BlockRenderer schema={business.page_schema} business={business as any} products={products} services={services} />
    )
  }

  return (
    <BusinessPageWithLayout
      business={business as Business}
      products={products as Product[]}
      services={services as Service[]}
      layoutStyle={business.layout_style}
    />
=======
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
>>>>>>> 447dd1603412727f3d023f52cafc26f2dfa59e51
  )
}
