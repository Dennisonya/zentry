"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
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
import { AlertCircle, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { CategoryField } from "@/components/dashboard/inventory/category-field"
import type { Product } from "@/components/dashboard-content"

interface VariantRow {
  size: string
  color: string
  stockQuantity: string
  lowStockThreshold: string
}

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
  hasVariants: false,
}

const EMPTY_VARIANT: VariantRow = { size: "", color: "", stockQuantity: "", lowStockThreshold: "" }

/** Multi-image uploader for the product gallery — same Supabase Storage bucket the design studio uses for image fields. */
function GalleryUploader({
  images,
  onChange,
}: {
  images: string[]
  onChange: (images: string[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = async (files: FileList) => {
    setError(null)
    const list = Array.from(files)
    for (const file of list) {
      if (!file.type.startsWith("image/")) {
        setError("Please choose image files only.")
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Each image must be 5MB or smaller.")
        continue
      }
    }

    setUploading(true)
    try {
      const supabase = getSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const uploaded: string[] = []
      for (const file of list) {
        if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) continue
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
        const path = `${user.id}/products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage.from("business-logos").upload(path, file, {
          contentType: file.type,
          cacheControl: "3600",
        })
        if (uploadError) throw uploadError
        const {
          data: { publicUrl },
        } = supabase.storage.from("business-logos").getPublicUrl(path)
        uploaded.push(publicUrl)
      }
      onChange([...images, ...uploaded])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label>Photos</Label>
      <p className="text-xs text-muted-foreground">The first photo is used as the main image everywhere on your storefront.</p>
      <div className="grid grid-cols-3 gap-2">
        {images.map((url, i) => (
          <div key={url + i} className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
            <img src={url} alt="" className="h-full w-full object-cover" />
            {i === 0 && <span className="absolute left-1 top-1 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-medium">Main</span>}
            <button
              type="button"
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-foreground hover:bg-background"
              aria-label="Remove photo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground hover:border-primary hover:text-primary"
        >
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
          <span className="text-xs">Add</span>
        </button>
      </div>
      <Input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void upload(e.target.files)
          e.target.value = ""
        }}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
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
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [images, setImages] = useState<string[]>([])
  const [variants, setVariants] = useState<VariantRow[]>([{ ...EMPTY_VARIANT }])

  useEffect(() => {
    if (!open) return
    setError(null)

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
        hasVariants: !!product.has_variants,
      })

      setLoadingDetails(true)
      const supabase = getSupabaseClient() as any
      Promise.all([
        supabase.from("product_images").select("url").eq("product_id", product.id).order("position", { ascending: true }),
        supabase.from("product_variants").select("size, color, stock_quantity, low_stock_threshold").eq("product_id", product.id),
      ])
        .then(([imagesRes, variantsRes]) => {
          setImages((imagesRes.data || []).map((row: { url: string }) => row.url))
          const rows = (variantsRes.data || []).map((v: any) => ({
            size: v.size ?? "",
            color: v.color ?? "",
            stockQuantity: String(v.stock_quantity ?? 0),
            lowStockThreshold: v.low_stock_threshold != null ? String(v.low_stock_threshold) : "",
          }))
          setVariants(rows.length > 0 ? rows : [{ ...EMPTY_VARIANT }])
        })
        .finally(() => setLoadingDetails(false))
    } else {
      setForm(EMPTY_FORM)
      setImages([])
      setVariants([{ ...EMPTY_VARIANT }])
    }
  }, [open, product])

  const updateVariant = (index: number, patch: Partial<VariantRow>) => {
    setVariants((current) => current.map((v, i) => (i === index ? { ...v, ...patch } : v)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.hasVariants && form.trackInventory && form.stockQuantity.trim() === "") {
      setError("Enter a starting stock quantity, or turn off stock tracking.")
      return
    }

    const cleanVariants = form.hasVariants
      ? variants.filter((v) => v.size.trim() || v.color.trim())
      : []

    if (form.hasVariants) {
      if (cleanVariants.length === 0) {
        setError("Add at least one size or color option, or turn off variants.")
        return
      }
      if (cleanVariants.some((v) => v.stockQuantity.trim() === "")) {
        setError("Enter a stock quantity for every size/color option.")
        return
      }
    }

    setLoading(true)
    try {
      const supabase = getSupabaseClient() as any

      const payload = {
        name: form.name,
        description: form.description || null,
        price: Number.parseFloat(form.price),
        category: form.category.trim() || null,
        image_url: images[0] || form.imageUrl || null,
        has_variants: form.hasVariants,
        track_inventory: form.hasVariants ? false : form.trackInventory,
        stock_quantity: form.hasVariants ? null : form.trackInventory ? Number.parseInt(form.stockQuantity, 10) : null,
        low_stock_threshold: form.hasVariants
          ? null
          : form.trackInventory
            ? Number.parseInt(form.lowStockThreshold || "5", 10)
            : null,
      }

      let productId: string
      if (isEditing && product) {
        const { error: updateError } = await supabase.from("products").update(payload).eq("id", product.id)
        if (updateError) throw updateError
        productId = product.id
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("products")
          .insert({ ...payload, business_id: businessId, is_available: true })
          .select("id")
          .single()
        if (insertError) throw insertError
        productId = inserted.id
      }

      // Gallery: replace-all is simplest and safe here — one owner edits a
      // product's photos at a time, so there's no concurrent-write risk to
      // guard against.
      await supabase.from("product_images").delete().eq("product_id", productId)
      if (images.length > 0) {
        await supabase.from("product_images").insert(images.map((url, i) => ({ product_id: productId, url, position: i })))
      }

      await supabase.from("product_variants").delete().eq("product_id", productId)
      if (form.hasVariants && cleanVariants.length > 0) {
        await supabase.from("product_variants").insert(
          cleanVariants.map((v) => ({
            product_id: productId,
            size: v.size.trim() || null,
            color: v.color.trim() || null,
            stock_quantity: Number.parseInt(v.stockQuantity || "0", 10),
            low_stock_threshold: v.lowStockThreshold.trim() ? Number.parseInt(v.lowStockThreshold, 10) : null,
          })),
        )
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
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
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

          <GalleryUploader images={images} onChange={setImages} />

          <div className="rounded-lg border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="hasVariants" className="cursor-pointer">
                  This product comes in sizes or colors
                </Label>
                <p className="text-xs text-muted-foreground">
                  Track stock separately for each size/color combination and get notified when one runs low.
                </p>
              </div>
              <Switch
                id="hasVariants"
                checked={form.hasVariants}
                onCheckedChange={(checked) => setForm({ ...form, hasVariants: checked })}
                disabled={loading || loadingDetails}
              />
            </div>

            {form.hasVariants && (
              <div className="space-y-3 pt-1">
                {loadingDetails ? (
                  <p className="text-xs text-muted-foreground">Loading options...</p>
                ) : (
                  <>
                    {variants.map((variant, i) => (
                      <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-end gap-2">
                        <div className="space-y-1">
                          {i === 0 && <Label className="text-xs">Size</Label>}
                          <Input placeholder="e.g., 45" value={variant.size} onChange={(e) => updateVariant(i, { size: e.target.value })} disabled={loading} />
                        </div>
                        <div className="space-y-1">
                          {i === 0 && <Label className="text-xs">Color</Label>}
                          <Input placeholder="e.g., White" value={variant.color} onChange={(e) => updateVariant(i, { color: e.target.value })} disabled={loading} />
                        </div>
                        <div className="space-y-1">
                          {i === 0 && <Label className="text-xs">In stock</Label>}
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={variant.stockQuantity}
                            onChange={(e) => updateVariant(i, { stockQuantity: e.target.value })}
                            disabled={loading}
                          />
                        </div>
                        <div className="space-y-1">
                          {i === 0 && <Label className="text-xs">Low at</Label>}
                          <Input
                            type="number"
                            min="0"
                            placeholder="5"
                            value={variant.lowStockThreshold}
                            onChange={(e) => updateVariant(i, { lowStockThreshold: e.target.value })}
                            disabled={loading}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={loading || variants.length === 1}
                          onClick={() => setVariants((current) => current.filter((_, idx) => idx !== i))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setVariants((current) => [...current, { ...EMPTY_VARIANT }])}
                      disabled={loading}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add option
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Leave size or color blank if this product only varies by one of them (e.g. color only).
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {!form.hasVariants && (
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
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="bg-transparent">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || loadingDetails}>
              {loading ? "Saving..." : isEditing ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
