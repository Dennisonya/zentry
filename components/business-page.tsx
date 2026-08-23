"use client"

import { BlockRenderer } from "@/components/page-builder/block-renderer"
import { convertLayoutToSchema } from "@/lib/page-builder/layout-to-blocks"
import type { PageSchema } from "@/lib/page-builder/types"

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

/**
 * The public storefront and the design studio intentionally use the same
 * renderer. A published page_schema is therefore the live storefront. When
 * no schema exists yet, the classic Zentry block layout is generated from the
 * registry defaults, giving every business one stable starting design.
 */
export function BusinessPage({ business, products, services }: BusinessPageProps) {
  const schema = business.page_schema || convertLayoutToSchema()

  return (
    <BlockRenderer
      schema={schema}
      business={business}
      products={products}
      services={services}
    />
  )
}
