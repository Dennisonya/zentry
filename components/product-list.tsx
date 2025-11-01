"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Eye, EyeOff } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"

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
    </div>
  )
}
