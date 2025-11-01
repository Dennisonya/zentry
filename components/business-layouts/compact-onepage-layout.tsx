"use client"

import { ClassicCardLayout } from "./classic-card-layout"
import type { Business } from "./classic-card-layout"
import type { Product } from "./classic-card-layout"

export function CompactOnepageLayout({ business, products }: { business: Business; products: Product[] }) {
  return <ClassicCardLayout business={business} products={products} />
}
