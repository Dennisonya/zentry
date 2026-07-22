"use client"

import { BusinessPageWithLayout } from "./business-layouts"
import { type LayoutStyle } from "@/lib/layouts"

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
  hero_image_url?: string | null
  dark_mode_enabled?: boolean
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
  return (
    <BusinessPageWithLayout
      business={business as Business}
      products={products as Product[]}
      services={services as Service[]}
      layoutStyle={business.layout_style}
    />
  )
}
