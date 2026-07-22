"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, MapPin, MessageCircle, Instagram, ShoppingCart } from "lucide-react"
import { EnhancedOrderDialog } from "@/components/enhanced-order-dialog"
import { ServiceInquiryDialog } from "@/components/service-inquiry-dialog"
import { useState } from "react"

interface Business {
  id: string
  business_name: string
  business_type: string
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

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  original_price?: number | null
  promotion_badge?: string | null
  image_url: string | null
  category: string | null
}

interface Service {
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

interface ModernSplitLayoutProps {
  business: Business
  products: Product[]
  services: Service[]
}

function money(n: number) {
  const x = Number(n)
  return Number.isFinite(x) ? x.toFixed(2) : "0.00"
}

export function ModernSplitLayout({ business, products, services }: ModernSplitLayoutProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [serviceInquiryOpen, setServiceInquiryOpen] = useState(false)

  const handleOrderClick = (product: Product) => {
    setSelectedProduct(product)
    setOrderDialogOpen(true)
  }

  const handleWhatsAppOrder = (product: Product) => {
    if (!business.whatsapp_number) return

    const message = encodeURIComponent(
      `Hi! I'm interested in ordering:\n\n${product.name}\nPrice: $${money(product.price)}\n\nFrom: ${business.business_name}`,
    )
    const whatsappUrl = `https://wa.me/${business.whatsapp_number.replace(/[^0-9]/g, "")}?text=${message}`
    window.open(whatsappUrl, "_blank")
  }

  const accentColor = business.accent_color || business.theme_color

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Left Sidebar */}
      <div className="md:w-1/3 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b md:border-r md:border-b-0">
        <div className="sticky top-0 p-8">
          {business.logo_url && (
            <div className="h-24 w-24 rounded-2xl overflow-hidden mb-6 shadow-lg">
              <img src={business.logo_url || "/placeholder.svg"} alt={business.business_name} className="h-full w-full object-cover" />
            </div>
          )}
          <h1 className="text-3xl font-bold mb-2">{business.business_name}</h1>
          <Badge variant="outline" className="mb-4">{business.business_type}</Badge>
          {business.description && <p className="text-muted-foreground mb-6">{business.description}</p>}

          {/* Contact Info */}
          <div className="space-y-3 mb-6">
            {business.phone && (
              <a href={`tel:${business.phone}`} className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                <Phone className="h-4 w-4" />
                {business.phone}
              </a>
            )}
            {business.email && (
              <a href={`mailto:${business.email}`} className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                <Mail className="h-4 w-4" />
                {business.email}
              </a>
            )}
            {business.address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>{business.address}</span>
              </div>
            )}
          </div>

          {/* Social Buttons */}
          <div className="flex flex-col gap-2">
            {business.whatsapp_number && (
              <Button onClick={() => window.open(`https://wa.me/${business.whatsapp_number!.replace(/[^0-9]/g, "")}`, "_blank")} className="w-full" style={{ backgroundColor: accentColor }}>
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
            )}
            {business.instagram_handle && (
              <Button variant="outline" onClick={() => window.open(`https://instagram.com/${business.instagram_handle}`, "_blank")} className="w-full">
                <Instagram className="h-4 w-4 mr-2" />
                Instagram
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Right Content */}
      <div className="md:w-2/3 flex-1">
        <div className="p-8">
          {products.length === 0 && services.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No offerings yet</h2>
              <p className="text-muted-foreground">Check back soon for new items!</p>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-bold mb-8">Menu / Products & Services</h2>

              {products.length > 0 && (
                <div className="mb-10">
                  <h3 className="text-2xl font-semibold mb-4">Products</h3>
                  <div className="grid sm:grid-cols-2 gap-6">
                    {products.map((product) => (
                      <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-all">
                        {product.image_url && (
                          <div className="aspect-video overflow-hidden bg-muted">
                            <img
                              src={product.image_url || "/placeholder.svg"}
                              alt={product.name}
                              className="h-full w-full object-cover hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <CardContent className="p-6">
                          {product.category && (
                            <Badge variant="secondary" className="mb-2">
                              {product.category}
                            </Badge>
                          )}
                          {product.promotion_badge ? (
                            <Badge className="mb-2 ml-2 bg-green-600 hover:bg-green-600 text-white">
                              {product.promotion_badge}
                            </Badge>
                          ) : null}
                          <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                          {product.description && <p className="text-muted-foreground mb-4">{product.description}</p>}
                          <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold" style={{ color: accentColor }}>
                                ${money(product.price)}
                              </span>
                              {product.original_price != null && Number(product.original_price) > Number(product.price) ? (
                                <span className="text-sm text-muted-foreground line-through">
                                  ${money(Number(product.original_price))}
                                </span>
                              ) : null}
                            </div>
                            {business.whatsapp_number ? (
                              <Button
                                size="sm"
                                onClick={() => handleWhatsAppOrder(product)}
                                style={{ backgroundColor: accentColor }}
                              >
                                Order
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleOrderClick(product)}
                                style={{ backgroundColor: accentColor }}
                              >
                                Order
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {services.length > 0 && (
                <div>
                  <h3 className="text-2xl font-semibold mb-4">Services</h3>
                  <div className="grid sm:grid-cols-2 gap-6">
                    {services.map((service) => (
                      <Card key={service.id} className="overflow-hidden hover:shadow-xl transition-all">
                        {service.image_url && (
                          <div className="aspect-video overflow-hidden bg-muted">
                            <img
                              src={service.image_url || "/placeholder.svg"}
                              alt={service.name}
                              className="h-full w-full object-cover hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <CardContent className="p-6">
                          {service.category && (
                            <Badge variant="secondary" className="mb-2">
                              {service.category}
                            </Badge>
                          )}
                          {service.promotion_badge ? (
                            <Badge className="mb-2 ml-2 bg-green-600 hover:bg-green-600 text-white">
                              {service.promotion_badge}
                            </Badge>
                          ) : null}
                          <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                          {service.description && <p className="text-muted-foreground mb-4">{service.description}</p>}
                          <div className="text-sm text-muted-foreground mb-4">
                            {service.duration_minutes != null ? `${service.duration_minutes} min` : null}
                            {service.duration_minutes != null && service.location ? " • " : null}
                            {service.location ? service.location : null}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold" style={{ color: accentColor }}>
                                ${money(service.price)}
                              </span>
                              {service.original_price != null && Number(service.original_price) > Number(service.price) ? (
                                <span className="text-sm text-muted-foreground line-through">
                                  ${money(Number(service.original_price))}
                                </span>
                              ) : null}
                            </div>
                            <Button
                              size="sm"
                              style={{ backgroundColor: accentColor }}
                              onClick={() => {
                                setSelectedService(service)
                                setServiceInquiryOpen(true)
                              }}
                            >
                              Book
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t p-8 text-center text-sm text-muted-foreground">
          <p>Powered by <span className="font-semibold">Zentry</span></p>
        </footer>
      </div>

      {/* Floating Order Button for Mobile */}
      {business.whatsapp_number && (
        <div className="fixed bottom-6 right-6 md:hidden">
          <Button size="lg" className="rounded-full shadow-2xl" style={{ backgroundColor: accentColor }}>
            <MessageCircle className="h-5 w-5 mr-2" />
            Order Now
          </Button>
        </div>
      )}

      {/* Order Dialog */}
      {selectedProduct && (
        <EnhancedOrderDialog
          open={orderDialogOpen}
          onOpenChange={setOrderDialogOpen}
          product={selectedProduct}
          businessId={business.id}
          businessName={business.business_name}
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
    </div>
  )
}

