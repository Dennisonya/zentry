"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"
import { DashboardContent } from "@/components/dashboard-content"
import type { Business as DashboardBusiness } from "@/components/dashboard-content"
import type { User } from "@supabase/supabase-js"

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<boolean>(true)
  const [user, setUser] = useState<User | null>(null)
  const [business, setBusiness] = useState<DashboardBusiness | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
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

      const { data: businessRow } = await supabase.from("businesses").select("*").eq("user_id", user.id).maybeSingle()
      if (!businessRow) {
        // Personal accounts land on /account; only force onboarding for business-default users
        const { data: profile } = await supabase
          .from("profiles")
          .select("default_view")
          .eq("id", user.id)
          .maybeSingle()
        if ((profile as { default_view?: string } | null)?.default_view === "personal") {
          router.replace("/account")
        } else {
          router.replace("/onboarding")
        }
        return
      }
      const biz = businessRow as DashboardBusiness
      setBusiness(biz)

      // Get products / services
      const { data: products } = await supabase
        .from("products")
        .select("*")
        .eq("business_id", biz.id)
        .order("created_at", { ascending: false })
      setProducts(products || [])

      const { data: services } = await supabase
        .from("services")
        .select("*")
        .eq("business_id", biz.id)
        .order("created_at", { ascending: false })
      setServices(services || [])

      // Get orders / bookings — no limit so all are visible
      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .eq("business_id", biz.id)
        .order("created_at", { ascending: false })
      setOrders(orders || [])

      const { data: bookings } = await supabase
        .from("bookings")
        .select("*")
        .eq("business_id", biz.id)
        .order("created_at", { ascending: false })
      setBookings(bookings || [])

      // Get analytics
      const { count: totalViews } = await supabase
        .from("page_views")
        .select("*", { count: "exact", head: true })
        .eq("business_id", biz.id)
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
      services={services || []}
      orders={orders || []}
      bookings={bookings || []}
      totalViews={totalViews || 0}
    />
  )
}
