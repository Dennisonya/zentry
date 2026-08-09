"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, Phone, Instagram, MessageCircle } from "lucide-react"
import Link from "next/link"

interface Business {
  id: string
  business_name: string
  slug: string
  business_type: string
  description: string | null
  logo_url: string | null
  address: string | null
  phone: string | null
  theme_color: string
  whatsapp_number: string | null
  instagram_handle: string | null
}

interface MarketplaceContentProps {
  businesses: Business[]
}

export function MarketplaceContent({ businesses }: MarketplaceContentProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(businesses.map((b) => b.business_type))
    return Array.from(cats).sort()
  }, [businesses])

  // Filter businesses
  const filteredBusinesses = useMemo(() => {
    return businesses.filter((business) => {
      const matchesSearch =
        searchQuery === "" ||
        business.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        business.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        business.business_type.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = selectedCategory === null || business.business_type === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [businesses, searchQuery, selectedCategory])
  console.log("filteredBusinesses", filteredBusinesses)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-lg sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
            >
              Zentry
            </Link>
            <nav className="flex gap-4">
              <Link href="/auth/sign-up">
                <Button variant="outline" className="rounded-full bg-transparent">
                  List Your Business
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Discover Local Businesses
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse through our collection of amazing local businesses and find exactly what you need
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search businesses, products, or services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 rounded-full border-2 focus:border-purple-500 bg-white/80 backdrop-blur"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            className="rounded-full"
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {filteredBusinesses.length} {filteredBusinesses.length === 1 ? "business" : "businesses"}
          </p>
        </div>

        {/* Business Grid */}
        {filteredBusinesses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">No businesses found matching your criteria</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBusinesses.map((business) => (
              <Link key={business.id} href={`/${business.slug}`}>
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur border-2 hover:border-purple-200 rounded-2xl h-full">
                  {/* Business Header with Theme Color */}
                  <div
                    className="h-32 relative"
                    style={{
                      background: `linear-gradient(135deg, ${business.theme_color} 0%, ${business.theme_color}dd 100%)`,
                    }}
                  >
                    {business.logo_url && (
                      <div className="absolute -bottom-8 left-6">
                        <div className="h-16 w-16 rounded-xl bg-white shadow-lg flex items-center justify-center overflow-hidden border-4 border-white">
                          <img
                            src={business.logo_url || "/placeholder.svg"}
                            alt={business.business_name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-6 pt-12">
                    <Badge variant="secondary" className="mb-3 rounded-full">
                      {business.business_type}
                    </Badge>
                    <h3 className="text-xl font-bold mb-2">{business.business_name}</h3>
                    {business.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{business.description}</p>
                    )}

                    {/* Contact Info */}
                    <div className="space-y-2 text-sm">
                      {business.address && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-1">{business.address}</span>
                        </div>
                      )}
                      {business.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{business.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Social Links */}
                    <div className="flex gap-2 mt-4">
                      {business.whatsapp_number && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <MessageCircle className="h-3 w-3" />
                          <span>WhatsApp</span>
                        </div>
                      )}
                      {business.instagram_handle && (
                        <div className="flex items-center gap-1 text-xs text-pink-600">
                          <Instagram className="h-3 w-3" />
                          <span>Instagram</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur mt-20">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 <span className="font-semibold">Zentry</span>. Empowering local businesses.
          </p>
        </div>
      </footer>
    </div>
  )
}
