import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays } from "lucide-react"
import type { BlockRenderProps } from "@/lib/page-builder/block-registry"

function money(n: number) {
  const x = Number(n)
  return Number.isFinite(x) ? x.toFixed(2) : "0.00"
}

export function ServiceGridBlock({ services, settings, onBookService }: BlockRenderProps<"service-grid">) {
  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-center mb-10">{settings.title}</h2>
      {services.length === 0 ? (
        <div className="text-center py-12">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No services listed yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <Card key={service.id} className="overflow-hidden hover:shadow-xl transition-all">
              {service.image_url && (
                <div className="aspect-video overflow-hidden">
                  <img src={service.image_url} alt={service.name} className="object-cover w-full h-full" />
                </div>
              )}
              <CardContent className="p-5">
                <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
                {service.description && <p className="text-muted-foreground text-sm mb-3">{service.description}</p>}
                {service.duration_minutes != null && (
                  <p className="text-sm text-muted-foreground mb-3">{service.duration_minutes} min</p>
                )}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold">${money(service.price)}</span>
                </div>
                <Button onClick={() => onBookService(service)} className="w-full">
                  Book Service
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
