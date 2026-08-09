"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabase"
import { OrderList } from "@/components/order-list"
import { DashboardSubpageLayout } from "@/components/dashboard-subpage-layout"
import type { Business, Order } from "@/components/dashboard-content"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function isServiceBookingLike(order: Order) {
  const items = Array.isArray(order.order_items) ? order.order_items : []
  const first = items[0] ?? null
  return !!first?.service_inquiry
}

export default function DashboardOrdersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [orders, setOrders] = useState<Order[]>([])

  const refetchOrders = useCallback(async (businessId: string) => {
    const supabase = getSupabaseClient()
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
    const rows = ((data as Order[]) || []).filter((o) => !isServiceBookingLike(o))
    setOrders(rows)
  }, [])

  useEffect(() => {
    const run = async () => {
      const supabase = getSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.replace("/auth/login")
        return
      }
      setUser(user)
      const { data: bizRow } = await supabase.from("businesses").select("*").eq("user_id", user.id).single()
      if (!bizRow) {
        router.replace("/onboarding")
        return
      }
      const biz = bizRow as Business
      setBusiness(biz)
      await refetchOrders(biz.id)
      setLoading(false)
    }
    run()
  }, [router, refetchOrders])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        Loading orders...
      </div>
    )
  }
  if (!user || !business) return null

  return (
    <DashboardSubpageLayout
      title="Orders"
      description="View and manage customer product orders."
    >
      <Card>
        <CardHeader>
          <CardTitle>All orders</CardTitle>
          <CardDescription>Approve, complete, or cancel orders from your storefront</CardDescription>
        </CardHeader>
        <CardContent>
          <OrderList
            orders={orders}
            businessId={business.id}
            onRecordsChange={() => refetchOrders(business.id)}
          />
        </CardContent>
      </Card>
    </DashboardSubpageLayout>
  )
}
