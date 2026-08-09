"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, MapPin, MessageCircle, Instagram, ShoppingCart } from "lucide-react"

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
  whatsapp_number: string | null
  instagram_handle: string | null
  accent_color: string
  background_color: string
  text_color: string
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string | null
}

interface CompactOnePageLayoutProps {
  business: Business
  products: Product[]
  onOrderClick: (product: Product) => void
  onWhatsAppOrder: (product: Product) => void
}

export function CompactOnePageLayout({ business, products, onOrderClick, onWhatsAppOrder }: CompactOnePageLayoutProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: business.background_color, color: business.text_color }}>
      {/* Single Page Layout */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header Section */}
        <header className="text-center mb-12">
          {business.logo_url && (
            <div className="h-24 w-24 rounded-full overflow-hidden mx-auto mb-6">
              <img src={business.logo_url} alt={business.business_name} className="h-full w-full object-cover" />
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-bold mb-3">{business.business_name}</h1>
          <Badge variant="secondary" className="mb-4">
            {business.business_type}
          </Badge>
          {business.description && <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{business.description}</p>}
        </header>

        {/* About Section */}
        {(business.phone || business.email || business.address) && (
          <section id="contact" className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">Contact</h2>
            <div className="flex flex-col items-center gap-3">
              {business.phone && (
                <a href={`tel:${business.phone}`} className="flex items-center gap-2 text-sm hover:opacity-70">
                  <Phone className="h-4 w-4" />
                  {business.phone}
                </a>
              )}
              {business.email && (
                <a href={`mailto:${business.email}`} className="flex items-center gap-2 text-sm hover:opacity-70">
                  <Mail className="h-4 w-4" />
                  {business.email}
                </a>
              )}
              {business.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  {business.address}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Products Section */}
        <section id="products" className="mb-12">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No products yet</h2>
              <p className="text-muted-foreground">Check back soon for new items!</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-6 text-center">Our Products</h2>
              <div className="space-y-4">
                {products.map((product) => (
                  <Card key={product.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {product.image_url && (
                          <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              {product.category && (
                                <Badge variant="secondary" className="text-xs mb-1">
                                  {product.category}
                                </Badge>
                              )}
                              <h3 className="font-semibold text-lg">{product.name}</h3>
                            </div>
                            <span className="text-xl font-bold">${product.price.toFixed(2)}</span>
                          </div>
                          {product.description && <p className="text-sm text-muted-foreground mb-3">{product.description}</p>}
                          {business.whatsapp_number ? (
                            <Button size="sm" onClick={() => onWhatsAppOrder(product)} style={{ backgroundColor: business.accent_color }}>
                              Order Now
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => onOrderClick(product)} style={{ backgroundColor: business.accent_color }}>
                              Order Now
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Action Buttons */}
        {(business.whatsapp_number || business.instagram_handle) && (
          <section id="actions" className="text-center mb-12">
            <div className="flex flex-wrap justify-center gap-3">
              {business.whatsapp_number && (
                <Button size="lg" onClick={() => window.open(`https://wa.me/${business.whatsapp_number!.replace(/[^0-9]/g, "")}`, "_blank")} style={{ backgroundColor: business.accent_color }}>
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Contact on WhatsApp
                </Button>
              )}
              {business.instagram_handle && (
                <Button size="lg" variant="outline" onClick={() => window.open(`https://instagram.com/${business.instagram_handle}`, "_blank")}>
                  <Instagram className="h-5 w-5 mr-2" />
                  Follow on Instagram
                </Button>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Powered by <span className="font-semibold">Zentry</span>
          </p>
        </div>
      </footer>
    </div>
  )
}

