"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { format, parseISO } from "date-fns"
import { Bell, BookOpenCheck, ChevronRight, Heart, MapPin, PackageCheck, ShoppingBag, Sparkles, Store } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { AccountShell } from "@/components/account/account-shell"
import { MobileAccountNav } from "@/components/account/account-sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"

type Profile = { id: string; full_name: string | null; avatar_url: string | null; phone: string | null; address: string | null }
type OrderRow = { id: string; total_amount: number; status: string; created_at: string; order_items: any; businesses?: { business_name: string; slug: string } | null }
type BookingRow = { id: string; status: string; booking_date: string | null; booking_time: string | null; created_at: string; businesses?: { business_name: string; slug: string } | null; services?: { name: string } | null }

function statusLabel(status: string) { return status.replaceAll("_", " ") }
function statusClass(status: string) {
  if (["delivered", "completed", "confirmed"].includes(status)) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
  if (["cancelled", "failed"].includes(status)) return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
  if (["out_for_delivery", "processing", "ready"].includes(status)) return "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300"
  return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
}

export default function AccountPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [hasBusiness, setHasBusiness] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/auth/login?next=/account"); return }
      setUser(user)
      const [{ data: profile }, { data: orders }, { data: bookings }, { data: business }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, avatar_url, phone, address").eq("id", user.id).maybeSingle(),
        supabase.from("orders").select("id, total_amount, status, created_at, order_items, businesses(business_name, slug)").eq("customer_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("bookings").select("id, status, booking_date, booking_time, created_at, businesses(business_name, slug), services(name)").eq("customer_id", user.id).order("created_at", { ascending: false }).limit(4),
        supabase.from("businesses").select("id").eq("user_id", user.id).limit(1).maybeSingle(),
      ])
      setProfile(profile as Profile | null)
      setOrders((orders as OrderRow[]) || [])
      setBookings((bookings as BookingRow[]) || [])
      setHasBusiness(Boolean(business))
      setLoading(false)
    }
    load()
  }, [router])

  const firstName = useMemo(() => (profile?.full_name || user?.email?.split("@")[0] || "there").split(" ")[0], [profile, user])
  const activeOrders = orders.filter((order) => !["delivered", "cancelled", "completed"].includes(order.status)).length
  const upcomingBookings = bookings.filter((booking) => booking.status !== "cancelled" && booking.status !== "completed").length
  const initials = (profile?.full_name || firstName).split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()

  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading your space...</div>

  return (
    <AccountShell>
      <main className="mx-auto w-full max-w-[1500px] px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="mb-8 flex items-center justify-between gap-3">
          <MobileAccountNav />
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <Avatar className="h-10 w-10 ring-2 ring-purple-500/20">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "Account"} />
              <AvatarFallback>{initials || "Z"}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <section className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground"><Sparkles className="h-4 w-4 text-purple-600" /> Your personal space</div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Hey {firstName} 👋</h1>
            <p className="mt-2 max-w-xl text-muted-foreground">Everything you need from Zentry, all in one calm little space.</p>
          </div>
          <Button asChild className="rounded-xl bg-primary px-5"><Link href="/marketplace"><Store className="mr-2 h-4 w-4" />Explore marketplace</Link></Button>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border-0 bg-primary text-primary-foreground shadow-sm"><CardContent className="p-5"><div className="flex items-center justify-between"><p className="text-sm text-primary-foreground/70">Active orders</p><ShoppingBag className="h-5 w-5 text-primary-foreground/70" /></div><p className="mt-4 text-3xl font-bold">{activeOrders}</p><p className="mt-1 text-xs text-primary-foreground/70">Orders currently in progress</p></CardContent></Card>
          <Card className="shadow-sm"><CardContent className="p-5"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Upcoming services</p><BookOpenCheck className="h-5 w-5 text-purple-600" /></div><p className="mt-4 text-3xl font-bold">{upcomingBookings}</p><p className="mt-1 text-xs text-muted-foreground">Bookings you can keep track of</p></CardContent></Card>
          <Card className="shadow-sm"><CardContent className="p-5"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Your account</p><PackageCheck className="h-5 w-5 text-purple-600" /></div><p className="mt-4 text-lg font-semibold">{hasBusiness ? "Business ready" : "Personal"}</p><p className="mt-1 text-xs text-muted-foreground">{hasBusiness ? "Switch to manage your business" : "Upgrade anytime to start selling"}</p></CardContent></Card>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <Card className="overflow-hidden shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Recent orders</CardTitle><p className="mt-1 text-sm text-muted-foreground">Follow your latest purchases in real time.</p></div><Button variant="ghost" asChild><Link href="/account/orders">View all<ChevronRight className="ml-1 h-4 w-4" /></Link></Button></CardHeader>
              <CardContent className="space-y-3">
                {orders.length === 0 ? <Empty text="No orders yet. Your next find is waiting in the marketplace." href="/marketplace" action="Explore marketplace" /> : orders.map((order) => {
                  const items = Array.isArray(order.order_items) ? order.order_items : []
                  const names = items.map((item: any) => item.product_name || item.name).filter(Boolean).slice(0, 2).join(", ")
                  return <Link key={order.id} href="/account/orders" className="flex items-center gap-4 rounded-2xl border p-4 transition-colors hover:bg-muted/50"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300"><ShoppingBag className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="truncate font-semibold">{order.businesses?.business_name || "Business"}</p><p className="truncate text-sm text-muted-foreground">{names || "Order placed through Zentry"}</p></div><div className="text-right"><Badge className={statusClass(order.status)}>{statusLabel(order.status)}</Badge><p className="mt-2 text-sm font-semibold">${Number(order.total_amount || 0).toFixed(2)}</p></div></Link>
                })}
              </CardContent>
            </Card>

            <Card className="shadow-sm"><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>My services</CardTitle><p className="mt-1 text-sm text-muted-foreground">Appointments and services you have booked.</p></div><Button variant="ghost" asChild><Link href="/account/services">View all<ChevronRight className="ml-1 h-4 w-4" /></Link></Button></CardHeader><CardContent className="space-y-3">{bookings.length === 0 ? <Empty text="No services booked yet." href="/marketplace" action="Browse businesses" /> : bookings.map((booking) => <Link key={booking.id} href="/account/services" className="flex items-center gap-4 rounded-2xl border p-4 transition-colors hover:bg-muted/50"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300"><BookOpenCheck className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="truncate font-semibold">{booking.services?.name || "Service booking"}</p><p className="truncate text-sm text-muted-foreground">{booking.businesses?.business_name || "Zentry business"}</p></div><div className="text-right"><Badge className={statusClass(booking.status)}>{statusLabel(booking.status)}</Badge><p className="mt-2 text-xs text-muted-foreground">{booking.booking_date ? format(parseISO(booking.booking_date), "MMM d") : "Date pending"}{booking.booking_time ? ` · ${booking.booking_time.slice(0, 5)}` : ""}</p></div></Link>)}</CardContent></Card>
          </div>

          <aside className="space-y-6">
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-purple-600 via-purple-600 to-violet-500 text-white shadow-sm"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="rounded-xl bg-white/15 p-2"><Sparkles className="h-5 w-5" /></div><Badge className="border-white/15 bg-white/15 text-white hover:bg-white/15">Zentry Pro</Badge></div><h2 className="mt-6 text-2xl font-bold">Want your own business?</h2><p className="mt-2 text-sm text-white/75">Upgrade when you&apos;re ready to build, manage, and grow your own storefront.</p><Button asChild className="mt-5 w-full rounded-xl bg-white text-purple-700 hover:bg-white/90"><Link href={hasBusiness ? "/dashboard" : "/onboarding"}>{hasBusiness ? "View my dashboard" : "Explore Pro"}</Link></Button></CardContent></Card>

            <Card className="shadow-sm"><CardHeader><CardTitle className="text-base">Quick access</CardTitle></CardHeader><CardContent className="space-y-1"><Quick href="/account/favorites" icon={Heart} label="Favorites" /><Quick href="/account/addresses" icon={MapPin} label={profile?.address ? "Delivery address" : "Add an address"} /><Quick href="/account/notifications" icon={Bell} label="Notifications" /></CardContent></Card>
          </aside>
        </section>
      </main>
    </AccountShell>
  )
}

function Quick({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) { return <Link href={href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors hover:bg-muted"><Icon className="h-4 w-4 text-purple-600" />{label}<ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" /></Link> }
function Empty({ text, href, action }: { text: string; href: string; action: string }) { return <div className="rounded-2xl border border-dashed p-7 text-center"><p className="text-sm text-muted-foreground">{text}</p><Button variant="link" asChild className="mt-2 text-purple-600"><Link href={href}>{action}</Link></Button></div> }
