"use client"

import { BusinessPageWithLayout } from "./business-layouts"
import { type LayoutStyle } from "@/lib/layouts"
import { BlockRenderer } from "@/components/page-builder/block-renderer"
import { isPageSchema } from "@/lib/page-builder/types"
import { hasFeature } from "@/lib/plan-access"

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

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string | null
}

export interface Service {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string | null
  duration_minutes: number | null
  location: string | null
}

interface BusinessPageProps {
  business: Business
  products: Product[]
  services: Service[]
}

export function BusinessPage({ business, products, services }: BusinessPageProps) {
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
  )
}
