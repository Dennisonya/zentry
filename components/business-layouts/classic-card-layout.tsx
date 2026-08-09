"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, MapPin, MessageCircle, Instagram, ShoppingCart, Calendar } from "lucide-react"
import { EnhancedOrderDialog } from "@/components/enhanced-order-dialog"
import { ServiceInquiryDialog } from "@/components/service-inquiry-dialog"

export type Business = {
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
  accent_color?: string | null
  whatsapp_number: string | null
  instagram_handle: string | null
  hero_image_url: string | null
}

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  original_price?: number | null
  promotion_badge?: string | null
  image_url: string | null
  category: string | null
}

export interface Service {
  id: string
  name: string
  description: string | null
  price: number
  original_price?: number | null
  promotion_badge?: string | null
  image_url: string | null
  category: string | null
  duration_minutes: number | null
  location: string | null
}

export interface ClassicCardLayoutProps {
  business: Business
  products: Product[]
  services: Service[]
}

function money(n: number) {
  const x = Number(n)
  return Number.isFinite(x) ? x.toFixed(2) : "0.00"
}

export function ClassicCardLayout({ business, products, services }: ClassicCardLayoutProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [serviceInquiryOpen, setServiceInquiryOpen] = useState(false)
  const accentColor = business.accent_color || business.theme_color

  const handleOrderClick = (product: Product) => {
    setSelectedProduct(product)
    setOrderDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden rounded-b-3xl shadow-md">
        {business.hero_image_url ? (
          <img
            src={business.hero_image_url}
            alt="Hero"
            className="absolute inset-0 w-full h-full object-cover brightness-75"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: accentColor }}
          />
        )}
        <div className="relative z-10 text-center px-4">
          <div className="flex justify-center mb-4">
            {business.logo_url && (
              <div className="h-24 w-24 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center overflow-hidden shadow-lg">
                <img src={business.logo_url} alt={business.business_name} className="h-full w-full object-cover" />
              </div>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-md">
            {business.business_name}
          </h1>
          <Badge className="bg-white/20 text-white backdrop-blur-sm mb-4">
            {business.business_type}
          </Badge>
          {business.description && (
            <p className="text-white/90 max-w-xl mx-auto text-lg">
              {business.description}
            </p>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <div className="container mx-auto px-4 py-6 flex flex-wrap justify-center gap-6 text-sm">
        {business.phone && (
          <a href={`tel:${business.phone}`} className="flex items-center gap-2 hover:text-primary">
            <Phone className="h-4 w-4" /> {business.phone}
          </a>
        )}
        {business.email && (
          <a href={`mailto:${business.email}`} className="flex items-center gap-2 hover:text-primary">
            <Mail className="h-4 w-4" /> {business.email}
          </a>
        )}
        {business.address && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" /> {business.address}
          </div>
        )}
      </div>

      {/* Social Actions */}
      <div className="flex justify-center gap-4 pb-10">
        {business.whatsapp_number && (
          <Button
            onClick={() =>
              window.open(`https://wa.me/${business.whatsapp_number!.replace(/[^0-9]/g, "")}`, "_blank")
            }
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
          </Button>
        )}
        {business.instagram_handle && (
          <Button
            onClick={() => window.open(`https://instagram.com/${business.instagram_handle}`, "_blank")}
            className="bg-pink-600 hover:bg-pink-700 text-white"
          >
            <Instagram className="h-4 w-4 mr-2" /> Instagram
          </Button>
        )}
      </div>

      {/* Products + Services */}
      <div className="container mx-auto px-4 py-12 space-y-16">
        <div>
          <h2 className="text-3xl font-bold text-center mb-10">Our Products</h2>
          {products.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-6">No products yet — check back soon!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                >
                  {product.image_url && (
                    <div className="aspect-square overflow-hidden bg-muted">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {product.promotion_badge ? (
                          <Badge className="bg-green-600 hover:bg-green-600 text-white">
                            {product.promotion_badge}
                          </Badge>
                        ) : null}
                        <span className="text-lg font-bold">${money(product.price)}</span>
                        {product.original_price != null && Number(product.original_price) > Number(product.price) ? (
                          <span className="text-sm text-muted-foreground line-through">${money(Number(product.original_price))}</span>
                        ) : null}
                      </div>
                      <Button size="sm" onClick={() => handleOrderClick(product)}>
                        Order
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-3xl font-bold text-center mb-10">Our Services</h2>
          {services.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-6">No services listed yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => (
                <Card key={service.id} className="overflow-hidden hover:shadow-xl transition-all">
                  {service.image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={service.image_url}
                        alt={service.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
                    {service.description && (
                      <p className="text-muted-foreground text-sm mb-3">{service.description}</p>
                    )}
                    <div className="text-sm text-muted-foreground space-y-1 mb-3">
                      {service.duration_minutes != null && (
                        <p>
                          <span className="font-medium text-foreground">{service.duration_minutes} min</span>
                        </p>
                      )}
                      {service.location && <p>{service.location}</p>}
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {service.promotion_badge ? (
                          <Badge className="bg-green-600 hover:bg-green-600 text-white">
                            {service.promotion_badge}
                          </Badge>
                        ) : null}
                        <span className="text-lg font-bold">${money(service.price)}</span>
                        {service.original_price != null && Number(service.original_price) > Number(service.price) ? (
                          <span className="text-sm text-muted-foreground line-through">${money(Number(service.original_price))}</span>
                        ) : null}
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedService(service)
                        setServiceInquiryOpen(true)
                      }}
                      style={{ backgroundColor: accentColor }}
                      className="text-white w-full"
                    >
                      Book Service
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {selectedProduct && (
        <EnhancedOrderDialog
          open={orderDialogOpen}
          onOpenChange={setOrderDialogOpen}
          product={selectedProduct}
          businessId={business.id}
          businessName={business.business_name}
          whatsappNumber={business.whatsapp_number}
          instagramHandle={business.instagram_handle}
        />
      )}

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

      {/* Footer */}
      <footer className="border-t bg-muted/20 mt-20">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} <span className="font-semibold">Zentry</span> — All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
