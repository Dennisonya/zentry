"use client"

import { useCallback, useState } from "react"
import { ServiceInquiryDialog } from "@/components/service-inquiry-dialog"
import { blockRegistry } from "@/lib/page-builder/block-registry"
import { getFontStack } from "@/lib/storefront-fonts"
import type { PageSchema } from "@/lib/page-builder/types"
import type { Business, Product, Service } from "@/components/business-layouts"

interface BlockRendererProps {
  schema: PageSchema
  business: Business
  products: Product[]
  services: Service[]
  showHidden?: boolean
  /** Returns false when nothing was added (sold out, or all remaining stock is already in the cart). */
  onAddToCart: (product: Product) => boolean | void
  cartItemCount: number
  onCartOpen: () => void
}

export function BlockRenderer({
  schema,
  business,
  products,
  services,
  showHidden,
  onAddToCart,
  cartItemCount,
  onCartOpen,
}: BlockRendererProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [serviceInquiryOpen, setServiceInquiryOpen] = useState(false)
  const [search, setSearch] = useState("")

  const handleSearchChange = useCallback((value: string) => setSearch(value), [])

  // Only the catalog sections actually get filtered — a search for "wax"
  // shouldn't also hide the hero or footer, just narrow what's browsable.
  const filteredProducts = search.trim()
    ? products.filter((product) =>
        `${product.name} ${product.description ?? ""} ${product.category ?? ""}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      )
    : products

  const filteredServices = search.trim()
    ? services.filter((service) =>
        `${service.name} ${service.description ?? ""} ${service.category ?? ""}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      )
    : services

  const blocks = showHidden ? schema.blocks : schema.blocks.filter((b) => b.visible)

  return (
    // Font choice is applied once here, at the storefront root — every
    // block's text inherits it via normal CSS cascade, so individual
    // blocks never need to know about fonts at all.
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: getFontStack(business.font_family) }}>
      {blocks.map((block) => {
        const def = blockRegistry[block.type]
        if (!def) return null
        const Render = def.Render as any
        return (
          <div key={block.id} className={showHidden && !block.visible ? "opacity-40" : undefined}>
            <Render
              settings={block.settings}
              business={business}
              products={block.type === "product-grid" || block.type === "popular" ? filteredProducts : products}
              services={block.type === "service-grid" || block.type === "popular" ? filteredServices : services}
              onAddToCart={onAddToCart}
              onBookService={(service: Service) => {
                setSelectedService(service)
                setServiceInquiryOpen(true)
              }}
              cartItemCount={cartItemCount}
              onCartOpen={onCartOpen}
              onSearchChange={handleSearchChange}
            />
          </div>
        )
      })}

      <ServiceInquiryDialog
        open={serviceInquiryOpen}
        onOpenChange={setServiceInquiryOpen}
        businessId={business.id}
        businessName={business.business_name}
        serviceId={selectedService?.id ?? null}
        serviceName={selectedService?.name ?? null}
        whatsappNumber={business.whatsapp_number}
        instagramHandle={business.instagram_handle}
      />
    </div>
  )
}
