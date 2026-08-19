"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { Lock, Sparkles } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { hasFeature } from "@/lib/plan-access"
import { PLANS } from "@/lib/plans"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { BuilderCanvas } from "@/components/page-builder/builder-canvas"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Business, Product, Service } from "@/components/dashboard-content"

export default function DashboardDesignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [services, setServices] = useState<Service[]>([])

  const refetchBusiness = useCallback(async (businessId: string) => {
    const supabase = getSupabaseClient()
    const { data } = await supabase.from("businesses").select("*").eq("id", businessId).maybeSingle()
    if (data) setBusiness(data as Business)
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

      const [{ data: productRows }, { data: serviceRows }] = await Promise.all([
        supabase.from("products").select("*").eq("business_id", biz.id).order("created_at", { ascending: false }),
        supabase.from("services").select("*").eq("business_id", biz.id).order("created_at", { ascending: false }),
      ])
      setProducts((productRows as Product[]) || [])
      setServices((serviceRows as Service[]) || [])
      setLoading(false)
    }
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading design studio...</div>
  }
  if (!user || !business) {
    return null
  }

  const canCustomize = hasFeature(business, "customStoreDesign")

  if (!canCustomize) {
    return (
      <div className="flex min-h-screen bg-muted/30">
        <DashboardSidebar />
        <div className="flex-1 min-w-0 flex items-center justify-center p-6">
          <Card className="max-w-md">
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Custom store design is a {PLANS.Pro.name} feature</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Upgrade to {PLANS.Pro.name} to drag-and-drop redesign your storefront section by section —
                  reorder, hide, and customize every part of your page. You're currently on{" "}
                  {business.subscription_plan || PLANS.Starter.name}.
                </p>
              </div>
              <Button asChild className="mt-2">
                <a href="/#pricing">
                  <Sparkles className="h-4 w-4 mr-2" /> See {PLANS.Pro.name} plan
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <DashboardSidebar />
      <div className="flex-1 min-w-0">
        <BuilderCanvas
          business={business}
          products={products}
          services={services}
          onSaved={() => refetchBusiness(business.id)}
        />
      </div>
    </div>
  )
}
