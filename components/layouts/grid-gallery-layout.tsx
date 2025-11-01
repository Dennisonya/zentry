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

interface GridGalleryLayoutProps {
  business: Business
  products: Product[]
  onOrderClick: (product: Product) => void
  onWhatsAppOrder: (product: Product) => void
}

export function GridGalleryLayout({ business, products, onOrderClick, onWhatsAppOrder }: GridGalleryLayoutProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: business.background_color, color: business.text_color }}>
      {/* Minimal Header */}
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {business.logo_url && (
                <div className="h-12 w-12 rounded-lg overflow-hidden">
                  <img src={business.logo_url} alt={business.business_name} className="h-full w-full object-cover" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold">{business.business_name}</h1>
                <Badge variant="secondary" className="text-xs">
                  {business.business_type}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {business.whatsapp_number && (
                <Button variant="ghost" size="sm" onClick={() => window.open(`https://wa.me/${business.whatsapp_number!.replace(/[^0-9]/g, "")}`, "_blank")}>
                  <MessageCircle className="h-4 w-4" />
                </Button>
              )}
              {business.instagram_handle && (
                <Button variant="ghost" size="sm" onClick={() => window.open(`https://instagram.com/${business.instagram_handle}`, "_blank")}>
                  <Instagram className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Products Grid - Masonry Style */}
      <div className="container mx-auto px-4 py-8">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No products yet</h2>
            <p className="text-muted-foreground">Check back soon for new items!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-2xl transition-all cursor-pointer group">
                {product.image_url ? (
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img src={product.image_url} alt={product.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="aspect-square bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
                    <ShoppingCart className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
                <CardContent className="p-3 bg-background/50 backdrop-blur-sm">
                  <h3 className="font-semibold text-sm mb-1">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold" style={{ color: business.accent_color }}>
                      ${product.price.toFixed(2)}
                    </span>
                    {business.whatsapp_number ? (
                      <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => onWhatsAppOrder(product)}>
                        Order
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => onOrderClick(product)}>
                        Order
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-6">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          {business.phone && (
            <a href={`tel:${business.phone}`} className="inline-flex items-center gap-1 hover:opacity-70 mr-4">
              <Phone className="h-3 w-3" />
              {business.phone}
            </a>
          )}
          {business.email && (
            <a href={`mailto:${business.email}`} className="inline-flex items-center gap-1 hover:opacity-70">
              <Mail className="h-3 w-3" />
              {business.email}
            </a>
          )}
          <p className="mt-2">
            Powered by <span className="font-semibold">Zentry</span>
          </p>
        </div>
      </footer>
    </div>
  )
}

