
"use client"

import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"
import { AnalyticsContent } from "@/components/analytics-content"
import { subDays } from "date-fns"

export default function AnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<boolean>(true)
  const [user, setUser] = useState<User | null>(null)
  const [business, setBusiness] = useState<any | null>(null)
  const [pageViews, setPageViews] = useState<any[]>([])
  const [totalViews, setTotalViews] = useState<number>(0)
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])


  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace("/auth/login")
        return
      }
      setUser(user)

      const { data: business } = await supabase.from("businesses").select("*").eq("user_id", user.id).single()
      if (!business) {
        router.replace("/onboarding")
        return
      }
      setBusiness(business)

      const thirtyDaysAgo = subDays(new Date(), 30)
      const { data: pageViews } = await supabase
        .from("page_views")
        .select("*")
        .eq("business_id", business.id)
        .gte("viewed_at", thirtyDaysAgo.toISOString())
        .order("viewed_at", { ascending: true })
      setPageViews(pageViews || [])

      const { count: totalViews } = await supabase
        .from("page_views")
        .select("*", { count: "exact", head: true })
        .eq("business_id", business.id)
      setTotalViews(totalViews || 0)

      const { data: products } = await supabase.from("products").select("*").eq("business_id", business.id)
      setProducts(products || [])

      const { data: orders } = await supabase.from("orders").select("*").eq("business_id", business.id)
      setOrders(orders || [])

      setLoading(false)
    }
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading analytics...</div>
  }
  if (!user || !business) {
    return null
  }
  return (
    <AnalyticsContent
      business={business}
      pageViews={pageViews}
      totalViews={totalViews}
      products={products}
      orders={orders}
    />
  )
}
