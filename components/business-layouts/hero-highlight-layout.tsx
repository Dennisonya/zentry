"use client"

import { ClassicCardLayout } from "./classic-card-layout"
import type { Business } from "../business-layouts"
import type { Product } from "../business-layouts"
import type { Service } from "./classic-card-layout"

export function HeroHighlightLayout({
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
