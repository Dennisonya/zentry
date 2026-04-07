"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { CheckCircle, XCircle, CheckCheck } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"

interface Order {
  id: string
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  total_amount: number
  status: string
  order_items: any
  created_at: string
}

interface OrderListProps {
  orders: Order[]
  businessId?: string
  onRecordsChange?: () => void
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending:   "secondary",
  confirmed: "default",
  cancelled: "destructive",
  completed: "default",
}

export function OrderList({ orders, businessId, onRecordsChange }: OrderListProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No orders yet. Share your page to start receiving orders!</p>
      </div>
    )
  }

  const updateStatus = async (orderId: string, newStatus: string) => {
    if (!businessId) return
    setLoading(orderId)
    try {
      const supabase = getSupabaseClient() as any
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus as "pending" | "confirmed" | "cancelled" | "completed" })
        .eq("id", orderId)
      if (error) throw error
      onRecordsChange?.()
      router.refresh()
    } catch (err) {
      console.error("Failed to update order:", err)
      alert("Failed to update order. Please try again.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const statusVariant = STATUS_VARIANTS[order.status] ?? "outline"
        const canApprove = order.status === "pending"
        const canCancel = !["cancelled", "completed"].includes(order.status)
        const canComplete = order.status === "confirmed"

        return (
          <div key={order.id} className="p-4 border rounded-lg space-y-2">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold">{order.customer_name}</h3>
                <p className="text-sm text-muted-foreground">{order.customer_phone || order.customer_email}</p>
              </div>
              <Badge variant={statusVariant} className="capitalize">{order.status}</Badge>
            </div>

            <div className="text-sm text-muted-foreground">
              {Array.isArray(order.order_items) &&
                order.order_items.map((item: any, idx: number) => (
                  <div key={idx}>
                    {item.product_name} — ${item.price?.toFixed(2)} × {item.quantity || 1}
                  </div>
                ))}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(order.created_at))} ago
              </span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">${Number(order.total_amount).toFixed(2)}</span>
                {businessId && (
                  <>
                    {canApprove && (
                      <Button
                        size="sm"
                        disabled={loading === order.id}
                        onClick={() => updateStatus(order.id, "confirmed")}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        Approve
                      </Button>
                    )}
                    {canComplete && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loading === order.id}
                        onClick={() => updateStatus(order.id, "completed")}
                        className="bg-transparent"
                      >
                        <CheckCheck className="h-3.5 w-3.5 mr-1" />
                        Complete
                      </Button>
                    )}
                    {canCancel && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loading === order.id}
                        onClick={() => updateStatus(order.id, "cancelled")}
                        className="bg-transparent text-destructive hover:text-destructive border-destructive/30 hover:border-destructive"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}