"use client"

import { ClassicCardLayout } from "./classic-card-layout"
import type { Business } from "./classic-card-layout"
import type { Product } from "./classic-card-layout"
import type { Service } from "./classic-card-layout"

export function BusinessCardLayout({
  business,
  products,
  services,
}: {
  business: Business
  products: Product[]
  services: Service[]
}) {
  return <ClassicCardLayout business={business} products={products} services={services} />
}
