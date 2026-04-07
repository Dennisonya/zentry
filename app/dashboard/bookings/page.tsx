"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabase"
import { BookingList } from "@/components/booking-list"
import { DashboardSubpageLayout } from "@/components/dashboard-subpage-layout"
import type { Business } from "@/components/dashboard-content"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type BookingRow = {
  id: string
  business_id: string
  service_id: string | null
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  booking_date: string | null
  booking_time: string | null
  status: string
  notes: string | null
  created_at: string
  updated_at: string
  services?: {
    name: string
    duration_minutes: number | null
    location: string | null
  } | null
}

export default function DashboardBookingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [bookings, setBookings] = useState<BookingRow[]>([])

  const refetchBookings = useCallback(async (businessId: string) => {
    const supabase = getSupabaseClient()
    const { data } = await supabase
      .from("bookings")
      .select("*, services(name, duration_minutes, location)")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
    setBookings((data as BookingRow[]) || [])
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
      await refetchBookings(biz.id)
      setLoading(false)
    }
    run()
  }, [router, refetchBookings])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        Loading bookings...
      </div>
    )
  }
  if (!user || !business) return null

  return (
    <DashboardSubpageLayout
      title="Bookings"
      description="Manage customer booking requests — approve, reschedule, or cancel."
    >
      <Card>
        <CardHeader>
          <CardTitle>Appointments &amp; bookings</CardTitle>
          <CardDescription>All requests for your services</CardDescription>
        </CardHeader>
        <CardContent>
          <BookingList
            bookings={bookings}
            businessId={business.id}
            whatsappNumber={business.whatsapp_number}
            onRecordsChange={() => refetchBookings(business.id)}
          />
        </CardContent>
      </Card>
    </DashboardSubpageLayout>
  )
}
