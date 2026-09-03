"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Minus,
  AlertTriangle,
  RotateCcw,
  ArrowLeft,
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { distinctCategories, getStockStatus, type StockStatus } from "@/lib/product-categories"
import type { Business, Product } from "@/components/dashboard-content"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MobileDashboardNav } from "@/components/dashboard/dashboard-sidebar"
import { ProductFormDialog } from "@/components/dashboard/inventory/product-form-dialog"

interface InventoryContentProps {
  business: Business
  products: Product[]
  onProductsChange: () => void
  autoOpenAdd?: boolean
}

type StatusFilter = "all" | "active" | "inactive"
type StockFilter = "all" | "low" | "out" | "not-tracked"

const STOCK_BADGE: Record<StockStatus, { label: string; className: string }> = {
  "in-stock": { label: "In stock", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" },
  low: { label: "Low stock", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" },
  out: { label: "Out of stock", className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400" },
  "not-tracked": { label: "Not tracked", className: "bg-muted text-muted-foreground" },
}

export function InventoryContent({ business, products, onProductsChange, autoOpenAdd }: InventoryContentProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [stockFilter, setStockFilter] = useState<StockFilter>("all")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")

  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [pendingStockId, setPendingStockId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const categories = useMemo(() => distinctCategories(products), [products])

  useEffect(() => {
    if (autoOpenAdd) {
      setEditingProduct(null)
      setFormOpen(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenAdd])

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (search.trim() && !p.name.toLowerCase().includes(search.trim().toLowerCase())) return false
      if (statusFilter === "active" && !p.is_available) return false
      if (statusFilter === "inactive" && p.is_available) return false
      if (categoryFilter !== "all" && (p.category || "Other") !== categoryFilter) return false

      const status = getStockStatus(p)
      if (stockFilter === "low" && status !== "low") return false
      if (stockFilter === "out" && status !== "out") return false
      if (stockFilter === "not-tracked" && status !== "not-tracked") return false

      const min = Number.parseFloat(minPrice)
      const max = Number.parseFloat(maxPrice)
      if (!Number.isNaN(min) && Number(p.price) < min) return false
      if (!Number.isNaN(max) && Number(p.price) > max) return false

      return true
    })
  }, [products, search, statusFilter, categoryFilter, stockFilter, minPrice, maxPrice])

  const resetFilters = () => {
    setSearch("")
    setStatusFilter("all")
    setCategoryFilter("all")
    setStockFilter("all")
    setMinPrice("")
    setMaxPrice("")
  }

  const handleOpenAdd = () => {
    setEditingProduct(null)
    setFormOpen(true)
  }

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product)
    setFormOpen(true)
  }

  const handleToggleAvailability = async (product: Product) => {
    const supabase = getSupabaseClient() as any
    await supabase.from("products").update({ is_available: !product.is_available }).eq("id", product.id)
    onProductsChange()
  }

  const handleDelete = async (productId: string) => {
    if (!confirm("Delete this product? This can't be undone.")) return
    setPendingDeleteId(productId)
    try {
      const supabase = getSupabaseClient() as any
      await supabase.from("products").delete().eq("id", productId)
      onProductsChange()
    } finally {
      setPendingDeleteId(null)
    }
  }

  const adjustStock = async (product: Product, delta: number) => {
    if (!product.track_inventory || product.stock_quantity === null) return
    const next = Math.max(0, product.stock_quantity + delta)
    setPendingStockId(product.id)
    try {
      const supabase = getSupabaseClient() as any
      await supabase.from("products").update({ stock_quantity: next }).eq("id", product.id)
      onProductsChange()
    } finally {
      setPendingStockId(null)
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <MobileDashboardNav />
          <div>
            <Link
              href="/dashboard"
              className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
            </Link>
            <h1 className="text-2xl font-bold">Inventory</h1>
            <p className="text-sm text-muted-foreground">
              {products.length} product{products.length !== 1 ? "s" : ""} · manage stock, pricing, and categories
            </p>
          </div>
        </div>
        <Button onClick={handleOpenAdd} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Add Product
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Filters */}
        <Card className="h-fit lg:sticky lg:top-6">
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All products</SelectItem>
                  <SelectItem value="active">Visible on storefront</SelectItem>
                  <SelectItem value="inactive">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                  <SelectItem value="Other">Other (uncategorized)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Stock alert</Label>
              <Select value={stockFilter} onValueChange={(v) => setStockFilter(v as StockFilter)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stock</SelectItem>
                  <SelectItem value="low">Low stock</SelectItem>
                  <SelectItem value="out">Out of stock</SelectItem>
                  <SelectItem value="not-tracked">Not tracked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Price range</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <Input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>

            <Button variant="outline" className="w-full bg-transparent" onClick={resetFilters}>
              <RotateCcw className="h-4 w-4 mr-2" /> Reset filters
            </Button>
          </CardContent>
        </Card>

        {/* Product list */}
        <div className="space-y-3">
          {products.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <p className="text-muted-foreground">No products yet — add your first one to get started.</p>
                <Button onClick={handleOpenAdd}>
                  <Plus className="h-4 w-4 mr-2" /> Add Product
                </Button>
              </CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                No products match these filters.
              </CardContent>
            </Card>
          ) : (
            filtered.map((product) => {
              const status = getStockStatus(product)
              const badge = STOCK_BADGE[status]
              return (
                <Card key={product.id} className={!product.is_available ? "opacity-60" : ""}>
                  <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                    <div className="flex flex-1 items-center gap-4 min-w-0">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-semibold">{product.name}</p>
                          {!product.is_available && (
                            <Badge variant="secondary" className="shrink-0">
                              Hidden
                            </Badge>
                          )}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          <span>{product.category || "Other"}</span>
                          <span>·</span>
                          <Badge className={`border-transparent ${badge.className}`}>{badge.label}</Badge>
                          {status !== "not-tracked" && (
                            <span>
                              {product.stock_quantity} in stock
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      {product.track_inventory && product.stock_quantity !== null && (
                        <div className="flex items-center gap-1 rounded-md border">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={pendingStockId === product.id || product.stock_quantity <= 0}
                            onClick={() => adjustStock(product, -1)}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium tabular-nums">
                            {product.stock_quantity}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={pendingStockId === product.id}
                            onClick={() => adjustStock(product, 1)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}

                      <div className="text-right">
                        <p className="font-semibold">${Number(product.price).toFixed(2)}</p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEdit(product)}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleAvailability(product)}>
                            {product.is_available ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" /> Hide from storefront
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" /> Show on storefront
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            disabled={pendingDeleteId === product.id}
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                  {status === "out" && product.is_available && (
                    <div className="flex items-center gap-2 border-t bg-red-50 px-4 py-2 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-400">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      Out of stock and still visible on your storefront. Hide it from the menu above if you don't
                      want customers to order it.
                    </div>
                  )}
                </Card>
              )
            })
          )}
        </div>
      </div>

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        businessId={business.id}
        existingCategories={categories}
        product={editingProduct}
        onSaved={() => {
          router.refresh()
          onProductsChange()
        }}
      />
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>
}
