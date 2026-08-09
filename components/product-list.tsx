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

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string | null
  is_available: boolean
}

interface ProductListProps {
  products: Product[]
  businessId: string
}

export function ProductList({ products, businessId }: ProductListProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Product | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    imageUrl: "",
  })

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    setLoading(productId)
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.from("products").delete().eq("id", productId)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("[v0] Failed to delete product:", error)
      alert("Failed to delete product")
    } finally {
      setLoading(null)
    }
  }

  const handleToggleAvailability = async (productId: string, currentStatus: boolean) => {
    setLoading(productId)
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.from("products").update({ is_available: !currentStatus }).eq("id", productId)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("[v0] Failed to update product:", error)
      alert("Failed to update product")
    } finally {
      setLoading(null)
    }
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    setEditError(null)
    setEditForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      category: product.category || "",
      imageUrl: product.image_url || "",
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

      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from("products")
        .update({
          name: editForm.name.trim(),
          description: editForm.description.trim() || null,
          price,
          category: editForm.category.trim() || null,
          image_url: editForm.imageUrl.trim() || null,
        })
        .eq("id", editing.id)

      if (error) throw error
      setEditOpen(false)
      setEditing(null)
      router.refresh()
    } catch (e: any) {
      setEditError(e?.message || "Failed to update product")
    } finally {
      setLoading(null)
    }
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No products yet. Add your first product to get started!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {products.map((product) => (
        <div key={product.id} className="flex items-center gap-4 p-4 border rounded-lg">
          {product.image_url && (
            <div className="h-16 w-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
              <img
                src={product.image_url || "/placeholder.svg"}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{product.name}</h3>
              {product.category && (
                <Badge variant="secondary" className="text-xs">
                  {product.category}
                </Badge>
              )}
              {!product.is_available && (
                <Badge variant="outline" className="text-xs">
                  Hidden
                </Badge>
              )}
            </div>
            {product.description && <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>}
            <p className="text-sm font-semibold mt-1">${product.price.toFixed(2)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEdit(product)}
              disabled={loading === product.id}
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleAvailability(product.id, product.is_available)}
              disabled={loading === product.id}
            >
              {product.is_available ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(product.id)}
              disabled={loading === product.id}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit product</DialogTitle>
            <DialogDescription>Update details for this product.</DialogDescription>
          </DialogHeader>

          {editError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{editError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-product-name">Name</Label>
              <Input
                id="edit-product-name"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                disabled={!editing || loading === editing?.id}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-product-desc">Description</Label>
              <Textarea
                id="edit-product-desc"
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                disabled={!editing || loading === editing?.id}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-product-price">Price</Label>
                <Input
                  id="edit-product-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.price}
                  onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                  disabled={!editing || loading === editing?.id}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-product-category">Category</Label>
                <Input
                  id="edit-product-category"
                  value={editForm.category}
                  onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                  disabled={!editing || loading === editing?.id}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-product-image">Image URL</Label>
              <Input
                id="edit-product-image"
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
