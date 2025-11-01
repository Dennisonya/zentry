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
  hero_image_url: string | null
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string | null
}

interface HeroHighlightLayoutProps {
  business: Business
  products: Product[]
  onOrderClick: (product: Product) => void
  onWhatsAppOrder: (product: Product) => void
}

export function HeroHighlightLayout({ business, products, onOrderClick, onWhatsAppOrder }: HeroHighlightLayoutProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: business.background_color, color: business.text_color }}>
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden" style={{ backgroundColor: business.accent_color }}>
        {business.hero_image_url ? (
          <img src={business.hero_image_url} alt={business.business_name} className="absolute inset-0 w-full h-full object-cover opacity-50" />
        ) : null}
        <div className="relative z-10 text-center px-4">
          {business.logo_url && (
            <div className="h-32 w-32 rounded-full bg-white/10 flex items-center justify-center overflow-hidden mx-auto mb-6 backdrop-blur">
              <img src={business.logo_url} alt={business.business_name} className="h-full w-full object-cover" />
            </div>
          )}
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{business.business_name}</h1>
          <Badge variant="secondary" className="mb-4">
            {business.business_type}
          </Badge>
          {business.description && <p className="text-white/90 max-w-2xl mx-auto text-lg mb-6">{business.description}</p>}
          {business.whatsapp_number && (
            <Button size="lg" variant="secondary" onClick={() => window.open(`https://wa.me/${business.whatsapp_number!.replace(/[^0-9]/g, "")}`, "_blank")}>
              <MessageCircle className="h-5 w-5 mr-2" />
              Order on WhatsApp
            </Button>
          )}
        </div>
      </section>

      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
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
            {business.instagram_handle && (
              <Button variant="ghost" size="sm" onClick={() => window.open(`https://instagram.com/${business.instagram_handle}`, "_blank")}>
                <Instagram className="h-4 w-4 mr-2" />
                Instagram
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Products */}
      <div className="container mx-auto px-4 py-12">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No products yet</h2>
            <p className="text-muted-foreground">Check back soon for new items!</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-6 text-center">Our Products</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-shadow">
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
                    <h3 className="font-semibold mb-1 text-lg">{product.name}</h3>
                    {product.description && <p className="text-sm text-muted-foreground mb-3">{product.description}</p>}
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold">${product.price.toFixed(2)}</span>
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

