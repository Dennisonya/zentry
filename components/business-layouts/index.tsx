import { ClassicCardLayout } from "./classic-card-layout"
import { ModernSplitLayout } from "./modern-split-layout"
import { HeroHighlightLayout } from "./hero-highlight-layout"
import { GridGalleryLayout } from "./grid-gallery-layout"
import { CompactOnepageLayout } from "./compact-onepage-layout"
import { NeonDarkLayout } from "./neon-dark-layout"
import { SocialCardLayout } from "./social-card-layout"
import { BusinessCardLayout } from "./business-card-layout"


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
  accent_color?: string | null
  whatsapp_number: string | null
  instagram_handle: string | null
  hero_image_url: string | null
  font_family?: string | null
}

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string | null
  created_at?: string | null
  has_variants?: boolean
  track_inventory?: boolean | null
  stock_quantity?: number | null
  low_stock_threshold?: number | null
  /** Loaded by storefront pages so cards can show variant stock. */
  product_variants?: { stock_quantity: number; low_stock_threshold: number | null }[] | null
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

const layoutComponents = {
  "classic-card": ClassicCardLayout,
  "modern-split": ModernSplitLayout,
  "hero-highlight": HeroHighlightLayout,
  "grid-gallery": GridGalleryLayout,
  "compact-onepage": CompactOnepageLayout,
  "neon-dark": NeonDarkLayout,
  "social-card": SocialCardLayout,
  "business-card": BusinessCardLayout,
  "editorial": EditorialStorefrontLayout,
} as const

interface BusinessPageWithLayoutProps {
  business: Business
  products: Product[]
  services: Service[]
  layoutStyle?: LayoutStyle
}

export function BusinessPageWithLayout({
  business,
  products,
  services,
  layoutStyle = "classic-card",
}: BusinessPageWithLayoutProps) {
  const LayoutComponent = layoutComponents[layoutStyle] || ClassicCardLayout
  return <LayoutComponent business={business} products={products} services={services} />
}
