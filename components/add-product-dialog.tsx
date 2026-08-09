"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"

interface AddProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessId: string
}

export function AddProductDialog({ open, onOpenChange, businessId }: AddProductDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createType, setCreateType] = useState<"product" | "service" | null>(null)
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    imageUrl: "",
  })
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    imageUrl: "",
    durationMinutes: "",
    location: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = getSupabaseClient() as any

      if (!createType) {
        throw new Error("Please choose what you want to create.")
      }

      if (createType === "product") {
        const { error: insertError } = await supabase.from("products").insert({
          business_id: businessId,
          name: productForm.name,
          description: productForm.description || null,
          price: Number.parseFloat(productForm.price),
          category: productForm.category || null,
          image_url: productForm.imageUrl || null,
          is_available: true,
        })
        if (insertError) throw insertError
      } else {
        const duration =
          serviceForm.durationMinutes.trim() === "" ? null : Number.parseInt(serviceForm.durationMinutes, 10)
        const { error: insertError } = await supabase.from("services").insert({
          business_id: businessId,
          name: serviceForm.name,
          description: serviceForm.description || null,
          price: Number.parseFloat(serviceForm.price),
          category: serviceForm.category || null,
          image_url: serviceForm.imageUrl || null,
          duration_minutes: Number.isFinite(duration as any) ? duration : null,
          location: serviceForm.location || null,
          is_available: true,
        })
        if (insertError) throw insertError
      }

      setCreateType(null)
      setProductForm({ name: "", description: "", price: "", category: "", imageUrl: "" })
      setServiceForm({
        name: "",
        description: "",
        price: "",
        category: "",
        imageUrl: "",
        durationMinutes: "",
        location: "",
      })
      onOpenChange(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to add")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add</DialogTitle>
          <DialogDescription>
            {createType ? `Create a new ${createType}.` : "What do you want to create?"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!createType ? (
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="bg-transparent"
                onClick={() => setCreateType("product")}
                disabled={loading}
              >
                Product
              </Button>
              <Button
                type="button"
                variant="outline"
                className="bg-transparent"
                onClick={() => setCreateType("service")}
                disabled={loading}
              >
                Service
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                  Creating: <span className="font-medium text-foreground capitalize">{createType}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setError(null)
                    setCreateType(null)
                  }}
                  disabled={loading}
                >
                  Change
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  {createType === "product" ? "Product name" : "Service name"}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder={createType === "product" ? "e.g., Cappuccino" : "e.g., Haircut"}
                  value={createType === "product" ? productForm.name : serviceForm.name}
                  onChange={(e) =>
                    createType === "product"
                      ? setProductForm({ ...productForm, name: e.target.value })
                      : setServiceForm({ ...serviceForm, name: e.target.value })
                  }
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder={createType === "product" ? "Describe your product..." : "Describe your service..."}
                  value={createType === "product" ? productForm.description : serviceForm.description}
                  onChange={(e) =>
                    createType === "product"
                      ? setProductForm({ ...productForm, description: e.target.value })
                      : setServiceForm({ ...serviceForm, description: e.target.value })
                  }
                  disabled={loading}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">
                    Price <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="9.99"
                    value={createType === "product" ? productForm.price : serviceForm.price}
                    onChange={(e) =>
                      createType === "product"
                        ? setProductForm({ ...productForm, price: e.target.value })
                        : setServiceForm({ ...serviceForm, price: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="e.g., Drinks"
                    value={createType === "product" ? productForm.category : serviceForm.category}
                    onChange={(e) =>
                      createType === "product"
                        ? setProductForm({ ...productForm, category: e.target.value })
                        : setServiceForm({ ...serviceForm, category: e.target.value })
                    }
                    disabled={loading}
                  />
                </div>
              </div>

              {createType === "service" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="durationMinutes">Duration (minutes)</Label>
                    <Input
                      id="durationMinutes"
                      type="number"
                      min="0"
                      placeholder="60"
                      value={serviceForm.durationMinutes}
                      onChange={(e) => setServiceForm({ ...serviceForm, durationMinutes: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g., In-person"
                      value={serviceForm.location}
                      onChange={(e) => setServiceForm({ ...serviceForm, location: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={createType === "product" ? productForm.imageUrl : serviceForm.imageUrl}
                  onChange={(e) =>
                    createType === "product"
                      ? setProductForm({ ...productForm, imageUrl: e.target.value })
                      : setServiceForm({ ...serviceForm, imageUrl: e.target.value })
                  }
                  disabled={loading}
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="bg-transparent"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !createType}>
              {loading ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
