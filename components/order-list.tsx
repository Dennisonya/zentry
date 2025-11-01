"use client"

import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

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
}

export function OrderList({ orders }: OrderListProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No orders yet. Share your page to start receiving orders!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="p-4 border rounded-lg">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold">{order.customer_name}</h3>
              <p className="text-sm text-muted-foreground">{order.customer_phone || order.customer_email}</p>
            </div>
            <Badge variant={order.status === "pending" ? "secondary" : "default"}>{order.status}</Badge>
          </div>
          <div className="text-sm text-muted-foreground mb-2">
            {Array.isArray(order.order_items) &&
              order.order_items.map((item: any, idx: number) => (
                <div key={idx}>
                  {item.product_name} - ${item.price.toFixed(2)}
                </div>
              ))}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{formatDistanceToNow(new Date(order.created_at))} ago</span>
            <span className="font-semibold">${order.total_amount.toFixed(2)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
