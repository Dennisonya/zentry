"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Eye, EyeOff } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"

interface Service {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string | null
  duration_minutes: number | null
  location: string | null
  is_available: boolean
}

interface ServiceListProps {
  services: Service[]
  businessId: string
}

export function ServiceList({ services, businessId }: ServiceListProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleDelete = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return

    setLoading(serviceId)
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.from("services").delete().eq("id", serviceId)
      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("[v0] Failed to delete service:", error)
      alert("Failed to delete service")
    } finally {
      setLoading(null)
    }
  }

  const handleToggleAvailability = async (serviceId: string, currentStatus: boolean) => {
    setLoading(serviceId)
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from("services")
        .update({ is_available: !currentStatus })
        .eq("id", serviceId)

      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("[v0] Failed to update service:", error)
      alert("Failed to update service")
    } finally {
      setLoading(null)
    }
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No services yet. Add your first service to get started!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {services.map((service) => (
        <div key={service.id} className="flex items-center gap-4 p-4 border rounded-lg">
          {service.image_url && (
            <div className="h-16 w-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
              <img
                src={service.image_url || "/placeholder.svg"}
                alt={service.name}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{service.name}</h3>
              {service.category && (
                <Badge variant="secondary" className="text-xs">
                  {service.category}
                </Badge>
              )}
              {!service.is_available && (
                <Badge variant="outline" className="text-xs">
                  Hidden
                </Badge>
              )}
            </div>

            {service.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">{service.description}</p>
            )}

            <div className="text-sm text-muted-foreground mt-1">
              {service.duration_minutes != null ? `${service.duration_minutes} min` : null}
              {service.duration_minutes != null && service.location ? " • " : null}
              {service.location ? service.location : null}
            </div>

            <p className="text-sm font-semibold mt-2">${service.price.toFixed(2)}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleAvailability(service.id, service.is_available)}
              disabled={loading === service.id}
            >
              {service.is_available ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(service.id)}
              disabled={loading === service.id}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

