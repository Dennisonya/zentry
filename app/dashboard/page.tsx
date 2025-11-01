
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"
import { DashboardContent } from "@/components/dashboard-content"
import type { User } from "@supabase/supabase-js"

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<boolean>(true)
  const [user, setUser] = useState<User | null>(null)
  const [business, setBusiness] = useState<any | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [totalViews, setTotalViews] = useState<number>(0)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace("/auth/login")
        return
      }
      setUser(user)

      // Get user's business
      const { data: business } = await supabase.from("businesses").select("*").eq("user_id", user.id).single()
      if (!business) {
        router.replace("/onboarding")
        return
      }
      setBusiness(business)

      // Get products
      const { data: products } = await supabase
        .from("products")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false })
      setProducts(products || [])

      // Get orders
      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false })
        .limit(10)
      setOrders(orders || [])

      // Get analytics
      const { count: totalViews } = await supabase
        .from("page_views")
        .select("*", { count: "exact", head: true })
        .eq("business_id", business.id)
      setTotalViews(totalViews || 0)

      setLoading(false)
    }
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading dashboard...</div>
  }
  if (!user || !business) {
    return null
  }
  return (
    <DashboardContent
      business={business}
      products={products || []} 
      orders={orders || []}
      totalViews={totalViews||0}
    />
  )
}
