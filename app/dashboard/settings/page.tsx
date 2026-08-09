
"use client"

import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"
import { SettingsContent } from "@/components/settings-content"

export default function AnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<boolean>(true)
  const [user, setUser] = useState<User | null>(null)
  const [business, setBusiness] = useState<any | null>(null)

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
      setLoading(false)
    }
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading settings...</div>
  }
  if (!user || !business) {
    return null
  }
  return <SettingsContent business={business} />
}
