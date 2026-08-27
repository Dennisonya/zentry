"use client"

import { useState } from "react"
import { ServiceInquiryDialog } from "@/components/service-inquiry-dialog"
import { blockRegistry } from "@/lib/page-builder/block-registry"
import type { PageSchema } from "@/lib/page-builder/types"
import type { Business, Product, Service } from "@/components/business-layouts"

interface BlockRendererProps {
  schema: PageSchema
  business: Business
  products: Product[]
  services: Service[]
  showHidden?: boolean
  onAddToCart: (product: Product) => void
}

export function BlockRenderer({
  schema,
  business,
  products,
  services,
  showHidden,
  onAddToCart,
}: BlockRendererProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [serviceInquiryOpen, setServiceInquiryOpen] = useState(false)

  const blocks = showHidden ? schema.blocks : schema.blocks.filter((b) => b.visible)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {blocks.map((block) => {
        const def = blockRegistry[block.type]
        if (!def) return null
        const Render = def.Render as any
        return (
          <div key={block.id} className={showHidden && !block.visible ? "opacity-40" : undefined}>
            <Render
              settings={block.settings}
              business={business}
              products={products}
              services={services}
              onAddToCart={onAddToCart}
              onBookService={(service: Service) => {
                setSelectedService(service)
                setServiceInquiryOpen(true)
              }}
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

      <footer className="mt-20 border-t bg-muted/20">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} <span className="font-semibold">Zentry</span> — All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
