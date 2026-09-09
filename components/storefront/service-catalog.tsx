"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CalendarDays, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ServiceInquiryDialog } from "@/components/service-inquiry-dialog"
import { getContrastTextColor } from "@/lib/color-contrast"
import type { Business, Service } from "@/components/business-layouts"

function money(n: number) {
  const x = Number(n)
  return Number.isFinite(x) ? x.toFixed(2) : "0.00"
}

interface ServiceCatalogProps {
  business: Business
  services: Service[]
}

export function ServiceCatalog({ business, services }: ServiceCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const accentColor = business.accent_color || business.theme_color

  const categories = useMemo(
    () => Array.from(new Set(services.map((s) => s.category).filter((c): c is string => Boolean(c?.trim())))).sort(),
    [services],
  )

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return services.filter((service) => {
      const matchesSearch =
        !q ||
        service.name.toLowerCase().includes(q) ||
        (service.description ?? "").toLowerCase().includes(q) ||
        (service.category ?? "").toLowerCase().includes(q)
      const matchesCategory = selectedCategory === null || service.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [services, searchQuery, selectedCategory])

  const openInquiry = (service: Service) => {
    setSelectedService(service)
    setInquiryOpen(true)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href={`/${business.slug}`} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> {business.business_name}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">All Services</h1>
        <p className="mt-2 text-muted-foreground">Browse everything {business.business_name} offers.</p>

        <div className="mt-6 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {categories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              style={selectedCategory === null ? { backgroundColor: accentColor, color: getContrastTextColor(accentColor), borderColor: accentColor } : undefined}
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant="outline"
                size="sm"
                className="rounded-full"
                style={selectedCategory === category ? { backgroundColor: accentColor, color: getContrastTextColor(accentColor), borderColor: accentColor } : undefined}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        )}

        <p className="mt-6 text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "service" : "services"}
        </p>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarDays className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No services found.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((service) => (
              <Card key={service.id} className="group overflow-hidden border-border/60 shadow-none transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                {service.image_url ? (
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={service.image_url} alt={service.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  </div>
                ) : (
                  <div className="grid aspect-[4/3] place-items-center bg-muted">
                    <CalendarDays className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-semibold">{service.name}</h3>
                    <span className="text-sm font-semibold">${money(service.price)}</span>
                  </div>
                  {service.description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{service.description}</p>}
                  {service.duration_minutes != null && <p className="mt-3 text-xs text-muted-foreground">{service.duration_minutes} min</p>}
                  <Button
                    onClick={() => openInquiry(service)}
                    style={{ backgroundColor: accentColor, color: getContrastTextColor(accentColor) }}
                    className="mt-5 w-full rounded-full"
                  >
                    Book service
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ServiceInquiryDialog
        open={inquiryOpen}
        onOpenChange={setInquiryOpen}
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
