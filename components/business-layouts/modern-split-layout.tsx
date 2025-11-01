"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, MapPin, MessageCircle, Instagram, ShoppingCart } from "lucide-react"
import { OrderDialog } from "@/components/order-dialog"
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
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string | null
}

interface ModernSplitLayoutProps {
  business: Business
  products: Product[]
}

export function ModernSplitLayout({ business, products }: ModernSplitLayoutProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)

  const handleOrderClick = (product: Product) => {
    setSelectedProduct(product)
    setOrderDialogOpen(true)
  }

  const handleWhatsAppOrder = (product: Product) => {
    if (!business.whatsapp_number) return

    const message = encodeURIComponent(
      `Hi! I'm interested in ordering:\n\n${product.name}\nPrice: $${product.price.toFixed(2)}\n\nFrom: ${business.business_name}`,
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
          {products.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No products yet</h2>
              <p className="text-muted-foreground">Check back soon for new items!</p>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-bold mb-8">Menu / Products</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-all">
                    {product.image_url && (
                      <div className="aspect-video overflow-hidden bg-muted">
                        <img src={product.image_url || "/placeholder.svg"} alt={product.name} className="h-full w-full object-cover hover:scale-110 transition-transform duration-300" />
                      </div>
                    )}
                    <CardContent className="p-6">
                      {product.category && (
                        <Badge variant="secondary" className="mb-2">
                          {product.category}
                        </Badge>
                      )}
                      <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                      {product.description && <p className="text-muted-foreground mb-4">{product.description}</p>}
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold" style={{ color: accentColor }}>
                          ${product.price.toFixed(2)}
                        </span>
                        {business.whatsapp_number ? (
                          <Button size="sm" onClick={() => handleWhatsAppOrder(product)} style={{ backgroundColor: accentColor }}>
                            Order
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => handleOrderClick(product)} style={{ backgroundColor: accentColor }}>
                            Order
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
        <OrderDialog
          open={orderDialogOpen}
          onOpenChange={setOrderDialogOpen}
          product={selectedProduct}
          businessId={business.id}
          businessName={business.business_name}
        />
      )}
    </div>
  )
}

