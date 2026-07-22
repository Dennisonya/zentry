"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Eye, EyeOff, Pencil, AlertCircle } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  const [editOpen, setEditOpen] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Service | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    imageUrl: "",
    durationMinutes: "",
    location: "",
  })

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

  const openEdit = (service: Service) => {
    setEditing(service)
    setEditError(null)
    setEditForm({
      name: service.name,
      description: service.description || "",
      price: String(service.price),
      category: service.category || "",
      imageUrl: service.image_url || "",
      durationMinutes: service.duration_minutes != null ? String(service.duration_minutes) : "",
      location: service.location || "",
    })
    setEditOpen(true)
  }

  const handleEditSave = async () => {
    if (!editing) return
    setEditError(null)
    setLoading(editing.id)
    try {
      const price = Number.parseFloat(editForm.price)
      if (!Number.isFinite(price) || price < 0) {
        setEditError("Price must be a valid non-negative number.")
        return
      }
      if (!editForm.name.trim()) {
        setEditError("Name is required.")
        return
      }
      const duration =
        editForm.durationMinutes.trim() === "" ? null : Number.parseInt(editForm.durationMinutes, 10)
      if (duration != null && (!Number.isFinite(duration) || duration < 0)) {
        setEditError("Duration must be a valid non-negative number.")
        return
      }

      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from("services")
        .update({
          name: editForm.name.trim(),
          description: editForm.description.trim() || null,
          price,
          category: editForm.category.trim() || null,
          image_url: editForm.imageUrl.trim() || null,
          duration_minutes: duration,
          location: editForm.location.trim() || null,
        })
        .eq("id", editing.id)

      if (error) throw error
      setEditOpen(false)
      setEditing(null)
      router.refresh()
    } catch (e: any) {
      setEditError(e?.message || "Failed to update service")
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
              onClick={() => openEdit(service)}
              disabled={loading === service.id}
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit service</DialogTitle>
            <DialogDescription>Update details for this service.</DialogDescription>
          </DialogHeader>

          {editError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{editError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-service-name">Name</Label>
              <Input
                id="edit-service-name"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                disabled={!editing || loading === editing?.id}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-service-desc">Description</Label>
              <Textarea
                id="edit-service-desc"
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                disabled={!editing || loading === editing?.id}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-service-price">Price</Label>
                <Input
                  id="edit-service-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.price}
                  onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                  disabled={!editing || loading === editing?.id}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-service-category">Category</Label>
                <Input
                  id="edit-service-category"
                  value={editForm.category}
                  onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                  disabled={!editing || loading === editing?.id}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-service-duration">Duration (minutes)</Label>
                <Input
                  id="edit-service-duration"
                  type="number"
                  min="0"
                  value={editForm.durationMinutes}
                  onChange={(e) => setEditForm((f) => ({ ...f, durationMinutes: e.target.value }))} 
                  disabled={!editing || loading === editing?.id}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-service-location">Location</Label>
                <Input
                  id="edit-service-location"
                  value={editForm.location}
                  onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))} 
                  disabled={!editing || loading === editing?.id}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-service-image">Image URL</Label>
              <Input
                id="edit-service-image"
                type="url"
                value={editForm.imageUrl}
                onChange={(e) => setEditForm((f) => ({ ...f, imageUrl: e.target.value }))} 
                disabled={!editing || loading === editing?.id}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="bg-transparent"
              onClick={() => setEditOpen(false)}
              disabled={!editing || loading === editing?.id}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleEditSave} disabled={!editing || loading === editing?.id}>
              {editing && loading === editing.id ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

