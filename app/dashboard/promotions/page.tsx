"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabase"
import { DashboardSubpageLayout } from "@/components/dashboard-subpage-layout"
import { PromotionsManager } from "@/components/promotions-manager"
import type { Business } from "@/components/dashboard-content"

export default function DashboardPromotionsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)

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
      setBusiness(bizRow as Business)
      setLoading(false)
    }
    run()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        Loading promotions...
      </div>
    )
  }
  if (!user || !business) return null

  return (
    <DashboardSubpageLayout
      title="Promotions"
      description="Create timed discounts for all catalog items or for selected products and services."
    >
      <PromotionsManager businessId={business.id} />
    </DashboardSubpageLayout>
  )
}
