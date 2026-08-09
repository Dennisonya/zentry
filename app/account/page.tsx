"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Store, Settings, LogOut, ShoppingBag, Calendar } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

type Profile = {
  id: string
  full_name: string | null
  phone: string | null
  address: string | null
  default_view: string | null
}

type OrderRow = {
  id: string
  customer_name: string
  total_amount: number
  status: string
  created_at: string
  order_items: any
  businesses?: { business_name: string; slug: string } | null
}

type BookingRow = {
  id: string
  customer_name: string
  status: string
  booking_date: string | null
  booking_time: string | null
  notes: string | null
  created_at: string
  businesses?: { business_name: string; slug: string } | null
  services?: { name: string } | null
}

export default function AccountPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [hasBusiness, setHasBusiness] = useState(false)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [orderFilter, setOrderFilter] = useState<"pending" | "all">("pending")

  const load = useCallback(async () => {
    const supabase = getSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.replace("/auth/login?next=/account")
      return
    }
    setUser(user)

    const [{ data: profileRow }, { data: bizRow }, { data: orderRows }, { data: bookingRows }] =
      await Promise.all([
        supabase.from("profiles").select("id, full_name, phone, address, default_view").eq("id", user.id).maybeSingle(),
        supabase.from("businesses").select("id").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("orders")
          .select("id, customer_name, total_amount, status, created_at, order_items, businesses(business_name, slug)")
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("bookings")
          .select(
            "id, customer_name, status, booking_date, booking_time, notes, created_at, businesses(business_name, slug), services(name)",
          )
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false }),
      ])

    setProfile((profileRow as Profile) || null)
    setHasBusiness(!!bizRow)
    setOrders((orderRows as OrderRow[]) || [])
    setBookings((bookingRows as BookingRow[]) || [])
    setLoading(false)
  }, [router])

  useEffect(() => {
    load()
  }, [load])

  const filteredOrders = useMemo(() => {
    if (orderFilter === "all") return orders
    return orders.filter((o) => o.status === "pending")
  }, [orders, orderFilter])

  const handleSignOut = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading account...</div>
    )
  }
  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-blue-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-xl font-bold text-transparent">
              Zentry
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/marketplace">
              <Button variant="outline" size="sm" className="bg-transparent">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Marketplace
              </Button>
            </Link>
            {hasBusiness ? (
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="bg-transparent">
                  <Store className="mr-2 h-4 w-4" />
                  Business Dashboard
                </Button>
              </Link>
            ) : null}
            <Link href="/account/settings">
              <Button variant="ghost" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto space-y-8 px-4 py-8">
        <div>
          <h1 className="mb-1 text-3xl font-bold">My Account</h1>
          <p className="text-muted-foreground">Your profile, orders, and appointments</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>How businesses contact you</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium">{profile?.full_name || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium">{profile?.phone || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Address</p>
              <p className="font-medium">{profile?.address || "—"}</p>
            </div>
            <div className="sm:col-span-3">
              <Link href="/account/settings" className="text-primary text-sm underline-offset-4 hover:underline">
                Edit profile
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Orders
                </CardTitle>
                <CardDescription>Orders you placed with businesses on Zentry</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={orderFilter === "pending" ? "default" : "outline"}
                  className={orderFilter === "pending" ? undefined : "bg-transparent"}
                  onClick={() => setOrderFilter("pending")}
                >
                  Pending
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={orderFilter === "all" ? "default" : "outline"}
                  className={orderFilter === "all" ? undefined : "bg-transparent"}
                  onClick={() => setOrderFilter("all")}
                >
                  All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {orderFilter === "pending" ? "No pending orders." : "No orders yet."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="pb-2 font-medium">Business</th>
                      <th className="pb-2 font-medium">Items</th>
                      <th className="pb-2 font-medium">Total</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((o) => {
                      const items = Array.isArray(o.order_items) ? o.order_items : []
                      const names = items.map((i: any) => i.product_name || i.name).filter(Boolean).join(", ")
                      return (
                        <tr key={o.id} className="border-b last:border-0">
                          <td className="py-3 pr-3 font-medium">{o.businesses?.business_name || "—"}</td>
                          <td className="py-3 pr-3 text-muted-foreground line-clamp-1 max-w-[220px]">
                            {names || "—"}
                          </td>
                          <td className="py-3 pr-3">${Number(o.total_amount).toFixed(2)}</td>
                          <td className="py-3 pr-3">
                            <Badge variant="secondary" className="capitalize">
                              {o.status}
                            </Badge>
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {new Date(o.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Appointments
            </CardTitle>
            <CardDescription>Service bookings and inquiries you submitted</CardDescription>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No appointments yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="pb-2 font-medium">Business</th>
                      <th className="pb-2 font-medium">Service</th>
                      <th className="pb-2 font-medium">When</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id} className="border-b last:border-0">
                        <td className="py-3 pr-3 font-medium">{b.businesses?.business_name || "—"}</td>
                        <td className="py-3 pr-3">{b.services?.name || "Inquiry"}</td>
                        <td className="py-3 pr-3 text-muted-foreground">
                          {[b.booking_date, b.booking_time].filter(Boolean).join(" · ") || "—"}
                        </td>
                        <td className="py-3">
                          <Badge variant="secondary" className="capitalize">
                            {b.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
