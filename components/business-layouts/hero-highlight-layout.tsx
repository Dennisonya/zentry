"use client"

import { ClassicCardLayout } from "./classic-card-layout"
import type { Business, Product } from "./classic-card-layout"

export function HeroHighlightLayout({ business, products }: { business: Business; products: Product[] }) {
  return <ClassicCardLayout business={business} products={products} />
}
