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

interface ClassicCardLayoutProps {
  business: Business
  products: Product[]
  onOrderClick: (product: Product) => void
  onWhatsAppOrder: (product: Product) => void
}

export function ClassicCardLayout({ business, products, onOrderClick, onWhatsAppOrder }: ClassicCardLayoutProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: business.background_color, color: business.text_color }}>
      {/* Header */}
      <header className="border-b" style={{ backgroundColor: business.theme_color || business.accent_color, color: "#ffffff" }}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {business.logo_url && (
              <div className="h-20 w-20 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
                <img src={business.logo_url} alt={business.business_name} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{business.business_name}</h1>
              <Badge variant="secondary" className="mb-3">
                {business.business_type}
              </Badge>
              {business.description && <p className="text-white/90 max-w-2xl">{business.description}</p>}
            </div>
          </div>
        </div>
      </header>

      {/* Contact Info */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-4">
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
        </div>
      </div>

      {/* Social Actions */}
      {(business.whatsapp_number || business.instagram_handle) && (
        <div className="border-b" style={{ backgroundColor: business.background_color }}>
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-wrap gap-3">
              {business.whatsapp_number && (
                <Button variant="outline" size="sm" onClick={() => window.open(`https://wa.me/${business.whatsapp_number!.replace(/[^0-9]/g, "")}`, "_blank")} className="bg-transparent">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact on WhatsApp
                </Button>
              )}
              {business.instagram_handle && (
                <Button variant="outline" size="sm" onClick={() => window.open(`https://instagram.com/${business.instagram_handle}`, "_blank")} className="bg-transparent">
                  <Instagram className="h-4 w-4 mr-2" />
                  Follow on Instagram
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-12">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No products yet</h2>
            <p className="text-muted-foreground">Check back soon for new items!</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-6">Our Products</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {product.image_url && (
                    <div className="aspect-square overflow-hidden bg-muted">
                      <img src={product.image_url} alt={product.name} className="h-full w-full object-cover hover:scale-105 transition-transform" />
                    </div>
                  )}
                  <CardContent className="p-4">
                    {product.category && (
                      <Badge variant="secondary" className="mb-2 text-xs">
                        {product.category}
                      </Badge>
                    )}
                    <h3 className="font-semibold mb-1">{product.name}</h3>
                    {product.description && <p className="text-sm text-muted-foreground mb-3">{product.description}</p>}
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>
            Powered by <span className="font-semibold">Zentry</span>
          </p>
        </div>
      </footer>
    </div>
  )
}

