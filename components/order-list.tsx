"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { CheckCircle, XCircle, CheckCheck, ChevronRight } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { OrderDetailModal, type Order } from "@/components/order-detail-modal"

interface OrderListProps {
  orders: Order[]
  businessId?: string
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  confirmed: "default",
  cancelled: "destructive",
  completed: "default",
}

const TABS = ["all", "pending", "confirmed", "completed", "cancelled"] as const
type TabType = typeof TABS[number]

export function OrderList({ orders: initialOrders, businessId }: OrderListProps) {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [activeTab, setActiveTab] = useState<TabType>("all")
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // ✅ Realtime sync
  useEffect(() => {
    if (!businessId) return
    const supabase = getSupabaseClient()

    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          const updatedOrder = payload.new as Order
          setOrders((prev) =>
            prev.map((order) =>
              order.id === updatedOrder.id ? updatedOrder : order
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [businessId])

  // ✅ Counts
  const counts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      confirmed: orders.filter((o) => o.status === "confirmed").length,
      completed: orders.filter((o) => o.status === "completed").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    }
  }, [orders])

  // ✅ Filtered orders
  const filteredOrders = useMemo(() => {
    if (activeTab === "all") return orders
    return orders.filter((o) => o.status === activeTab)
  }, [orders, activeTab])

  const updateStatus = async (e: React.MouseEvent, orderId: string, newStatus: string) => {
    e.stopPropagation()
    if (!businessId) return
    setLoadingId(orderId)

    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus } as unknown as never)
        .eq("id", orderId)

      if (error) throw error

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      )

      router.refresh()
    } catch {
      alert("Failed to update order.")
    } finally {
      setLoadingId(null)
    }
  }

  const handleRowClick = (order: Order) => {
    setSelectedOrder(order)
    setModalOpen(true)
  }

  const handleOrderUpdated = (updated: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
    setSelectedOrder(updated)
  }

  return (
    <>
      {/* 🔥 Tabs with counts */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-sm capitalize transition ${
              activeTab === tab
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {tab} ({counts[tab]})
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No {activeTab === "all" ? "" : activeTab} orders found.</p>
        </div>
      )}

      {/* Orders list */}
      <div className="space-y-2">
        {filteredOrders.map((order) => {
          const statusVariant = STATUS_VARIANTS[order.status] ?? "outline"
          const canApprove = order.status === "pending"
          const canCancel = !["cancelled", "completed"].includes(order.status)
          const canComplete = order.status === "confirmed"
          const items = Array.isArray(order.order_items) ? order.order_items : []

          return (
            <div
              key={order.id}
              onClick={() => handleRowClick(order)}
              className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/40 transition"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-sm truncate">{order.customer_name}</span>
                  <Badge
                    variant={statusVariant}
                    className={`capitalize text-xs ${
                      order.status === "completed" ? "bg-green-100 text-green-700" : ""
                    }`}
                  >
                    {order.status}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground truncate">
                  {items.map((i) => i.product_name).join(", ") || "No items"}
                </p>

                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(order.created_at))} ago
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  ${Number(order.total_amount).toFixed(2)}
                </span>

                {businessId && (
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    {canApprove && (
                      <Button size="sm" onClick={(e) => updateStatus(e, order.id, "confirmed")}>
                        <CheckCircle className="h-3 w-3 mr-1" /> Approve
                      </Button>
                    )}
                    {canComplete && (
                      <Button size="sm" variant="outline" onClick={(e) => updateStatus(e, order.id, "completed")}>
                        <CheckCheck className="h-3 w-3 mr-1" /> Done
                      </Button>
                    )}
                    {canCancel && (
                      <Button size="sm" variant="outline" onClick={(e) => updateStatus(e, order.id, "cancelled")}>
                        <XCircle className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}

                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          )
        })}
      </div>

      <OrderDetailModal
        order={selectedOrder}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onOrderUpdated={handleOrderUpdated}
      />
    </>
  )
}