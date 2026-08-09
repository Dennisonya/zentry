"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabase"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { InventoryContent } from "@/components/dashboard/inventory/inventory-content"
import type { Business, Product } from "@/components/dashboard-content"

function DashboardInventoryPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [products, setProducts] = useState<Product[]>([])

  const refetchProducts = useCallback(async (businessId: string) => {
    const supabase = getSupabaseClient()
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
    setProducts((data as Product[]) || [])
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.replace("/auth/login")
        return
      }
      setUser(user)

      const { data: businessRow } = await supabase
        .from("businesses")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()

      if (!businessRow) {
        router.replace("/onboarding")
        return
      }
      const biz = businessRow as Business
      setBusiness(biz)
      await refetchProducts(biz.id)
      setLoading(false)
    }
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading inventory...</div>
  }
  if (!user || !business) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <DashboardSidebar />
      <div className="flex-1 min-w-0">
        <InventoryContent
          business={business}
          products={products}
          onProductsChange={() => refetchProducts(business.id)}
          autoOpenAdd={searchParams.get("new") === "1"}
        />
      </div>
    </div>
  )
}

export default function DashboardInventoryPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading inventory...</div>}>
      <DashboardInventoryPageInner />
    </Suspense>
  )
}
