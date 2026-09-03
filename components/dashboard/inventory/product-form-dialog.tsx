"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { CategoryField } from "@/components/dashboard/inventory/category-field"
import type { Product } from "@/components/dashboard-content"

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessId: string
  existingCategories: string[]
  /** When editing, pass the product to prefill. Omit/null to create a new product. */
  product?: Product | null
  onSaved?: () => void
}

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  category: "",
  imageUrl: "",
  trackInventory: false,
  stockQuantity: "",
  lowStockThreshold: "5",
}

export function ProductFormDialog({
  open,
  onOpenChange,
  businessId,
  existingCategories,
  product,
  onSaved,
}: ProductFormDialogProps) {
  const isEditing = !!product
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (!open) return
    if (product) {
      setForm({
        name: product.name,
        description: product.description ?? "",
        price: String(product.price ?? ""),
        category: product.category ?? "",
        imageUrl: product.image_url ?? "",
        trackInventory: !!product.track_inventory,
        stockQuantity: product.stock_quantity != null ? String(product.stock_quantity) : "",
        lowStockThreshold: product.low_stock_threshold != null ? String(product.low_stock_threshold) : "5",
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setError(null)
  }, [open, product])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (form.trackInventory && form.stockQuantity.trim() === "") {
      setError("Enter a starting stock quantity, or turn off stock tracking.")
      return
    }

    setLoading(true)
    try {
      const supabase = getSupabaseClient() as any

      const payload = {
        name: form.name,
        description: form.description || null,
        price: Number.parseFloat(form.price),
        category: form.category.trim() || null,
        image_url: form.imageUrl || null,
        track_inventory: form.trackInventory,
        stock_quantity: form.trackInventory ? Number.parseInt(form.stockQuantity, 10) : null,
        low_stock_threshold: form.trackInventory
          ? Number.parseInt(form.lowStockThreshold || "5", 10)
          : null,
      }

      if (isEditing && product) {
        const { error: updateError } = await supabase.from("products").update(payload).eq("id", product.id)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from("products").insert({
          ...payload,
          business_id: businessId,
          is_available: true,
        })
        if (insertError) throw insertError
      }

      onOpenChange(false)
      onSaved?.()
    } catch (err: any) {
      setError(err.message || "Failed to save product")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Product" : "Add Product"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the details for this product." : "Add a new product to your inventory."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">
              Product name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Adidas Samba"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="A little about this product..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                placeholder="49.99"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <CategoryField
              value={form.category}
              onChange={(v) => setForm({ ...form, category: v })}
              existingCategories={existingCategories}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="rounded-lg border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="trackInventory" className="cursor-pointer">
                  Track stock for this product
                </Label>
                <p className="text-xs text-muted-foreground">
                  Get low-stock alerts and manage stock from Inventory.
                </p>
              </div>
              <Switch
                id="trackInventory"
                checked={form.trackInventory}
                onCheckedChange={(checked) => setForm({ ...form, trackInventory: checked })}
                disabled={loading}
              />
            </div>

            {form.trackInventory && (
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">
                    In stock <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    min="0"
                    placeholder="50"
                    value={form.stockQuantity}
                    onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                    disabled={loading}
                    required={form.trackInventory}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold">Low stock at</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    min="0"
                    placeholder="5"
                    value={form.lowStockThreshold}
                    onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="bg-transparent">
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
