"use client"

import { useCallback, useState } from "react"
import { ServiceInquiryDialog } from "@/components/service-inquiry-dialog"
import { blockRegistry } from "@/lib/page-builder/block-registry"
import { StorefrontChrome } from "@/components/storefront/storefront-chrome"
import type { PageSchema } from "@/lib/page-builder/types"
import type { Business, Product, Service } from "@/components/business-layouts"

interface BlockRendererProps {
  schema: PageSchema
  business: Business
  products: Product[]
  services: Service[]
  showHidden?: boolean
  onAddToCart: (product: Product) => void
  onCartOpen?: () => void
}

export function BlockRenderer({ schema, business, products, services, showHidden, onAddToCart, onCartOpen }: BlockRendererProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [serviceInquiryOpen, setServiceInquiryOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filteredProducts = search.trim()
    ? products.filter((product) => `${product.name} ${product.description ?? ""} ${product.category ?? ""}`.toLowerCase().includes(search.trim().toLowerCase()))
    : products

  const filteredServices = search.trim()
    ? services.filter((service) => `${service.name} ${service.description ?? ""} ${service.category ?? ""}`.toLowerCase().includes(search.trim().toLowerCase()))
    : services

  const handleSearch = useCallback((value: string) => setSearch(value), [])
  const blocks = showHidden ? schema.blocks : schema.blocks.filter((b) => b.visible)

  return (
    <StorefrontChrome
      business={business}
      products={products}
      services={services}
      onCartOpen={onCartOpen ?? (() => {})}
      onSearchChange={handleSearch}
    >
      <div className="min-h-screen">
        {blocks.map((block) => {
          const def = blockRegistry[block.type]
          if (!def) return null
          const Render = def.Render as any
          return (
            <div key={block.id} className={showHidden && !block.visible ? "opacity-40" : undefined}>
              <Render
                settings={block.settings}
                business={business}
                products={block.type === "product-grid" ? filteredProducts : products}
                services={block.type === "service-grid" ? filteredServices : services}
                onAddToCart={onAddToCart}
                onBookService={(service: Service) => { setSelectedService(service); setServiceInquiryOpen(true) }}
              />
            </div>
          )
        })}
      </div>

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
    </StorefrontChrome>
  )
}
