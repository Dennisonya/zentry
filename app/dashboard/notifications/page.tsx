"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabase"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { NotificationsContent, type NotificationRow } from "@/components/dashboard/notifications-content"

export default function DashboardNotificationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<NotificationRow[]>([])

  const refetch = useCallback(async (id: string) => {
    const supabase = getSupabaseClient()
    const { data } = await supabase
      .from("notifications")
      .select("id, type, title, body, read_at, created_at")
      .eq("business_id", id)
      .order("created_at", { ascending: false })
      .limit(100)
    setNotifications((data as NotificationRow[]) || [])
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

      const { data: businessRow } = await (supabase as any).from("businesses").select("id").eq("user_id", user.id).maybeSingle()
      if (!businessRow) {
        router.replace("/onboarding")
        return
      }
      setBusinessId(businessRow.id)
      await refetch(businessRow.id)
      setLoading(false)
    }
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const markRead = async (id: string) => {
    setNotifications((current) => current.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)))
    const supabase = getSupabaseClient() as any
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id)
  }

  const markAllRead = async () => {
    if (!businessId) return
    const now = new Date().toISOString()
    setNotifications((current) => current.map((n) => (n.read_at ? n : { ...n, read_at: now })))
    const supabase = getSupabaseClient() as any
    await supabase.from("notifications").update({ read_at: now }).eq("business_id", businessId).is("read_at", null)
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading notifications...</div>
  }
  if (!user || !businessId) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <DashboardSidebar />
      <div className="flex-1 min-w-0">
        <NotificationsContent notifications={notifications} onMarkRead={markRead} onMarkAllRead={markAllRead} />
      </div>
    </div>
  )
}
