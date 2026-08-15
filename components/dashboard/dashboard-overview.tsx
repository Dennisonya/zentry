"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  CalendarDays,
  Users,
  DollarSign,
  Plus,
  ExternalLink,
  Share2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { format, isSameDay, parseISO, startOfMonth, subMonths } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { ServiceList } from "@/components/service-list"
import { MobileDashboardNav } from "@/components/dashboard/dashboard-sidebar"
import type { Business, Product, Service, Order, Booking as BaseBooking } from "@/components/dashboard-content"

interface PageView {
  id: string
  viewed_at: string
}

// The bookings table has a service_id column that the shared Booking type
// (used by the legacy dashboard view) doesn't declare. Extend it locally.
type Booking = BaseBooking & { service_id?: string | null }

interface DashboardOverviewProps {
  business: Business
  ownerName: string | null
  avatarUrl: string | null
  products: Product[]
  services: Service[]
  orders: Order[]
  bookings: Booking[]
  pageViews: PageView[]
}

const PRODUCT_COLORS = ["bg-blue-500", "bg-orange-500", "bg-lime-500", "bg-slate-400", "bg-cyan-500"]

function monthOverMonth(dates: Date[], now: Date) {
  const thisMonthStart = startOfMonth(now)
  const lastMonthStart = startOfMonth(subMonths(now, 1))
  const thisCount = dates.filter((d) => d >= thisMonthStart).length
  const lastCount = dates.filter((d) => d >= lastMonthStart && d < thisMonthStart).length
  if (lastCount === 0) return thisCount > 0 ? 100 : 0
  return ((thisCount - lastCount) / lastCount) * 100
}

function sumMonthOverMonth(items: { date: Date; amount: number }[], now: Date) {
  const thisMonthStart = startOfMonth(now)
  const lastMonthStart = startOfMonth(subMonths(now, 1))
  const thisSum = items.filter((i) => i.date >= thisMonthStart).reduce((s, i) => s + i.amount, 0)
  const lastSum = items
    .filter((i) => i.date >= lastMonthStart && i.date < thisMonthStart)
    .reduce((s, i) => s + i.amount, 0)
  const pct = lastSum === 0 ? (thisSum > 0 ? 100 : 0) : ((thisSum - lastSum) / lastSum) * 100
  return { thisSum, pct }
}

function TrendBadge({ pct }: { pct: number }) {
  const positive = pct >= 0
  return (
    <Badge
      className={
        positive
          ? "border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400"
          : "border-transparent bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-500/15 dark:text-red-400"
      }
    >
      {positive ? "+" : ""}
      {pct.toFixed(1)}%
    </Badge>
  )
}

function StatCardLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: ReactNode
}) {
  return (
    <Link href={href} className="block min-w-0 w-full">
      <Card
        className={cn(
          "h-full w-full max-w-full min-w-0 overflow-hidden transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        {children}
      </Card>
    </Link>
  )
}

export function DashboardOverview({
  business,
  ownerName,
  avatarUrl,
  products,
  services,
  orders,
  bookings,
  pageViews,
}: DashboardOverviewProps) {
  const [copied, setCopied] = useState(false)
  const now = useMemo(() => new Date(), [])

  const businessUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/b/${business.slug}`

  const handleCopyLink = async () => {
    try {
      await navigator.share?.({ title: business.business_name, url: businessUrl })
    } catch {
      await navigator.clipboard.writeText(businessUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // ---- Stats ----
  const validOrders = orders.filter((o) => o.status !== "cancelled")
  const validBookings = bookings.filter((b) => b.status !== "cancelled")

  const salesItems = [
    ...validOrders.map((o) => ({ date: parseISO(o.created_at), amount: Number(o.total_amount) })),
    ...validBookings.map((b) => ({ date: parseISO(b.created_at), amount: Number(b.total_amount) })),
  ]
  const { thisSum: totalSales, pct: salesPct } = sumMonthOverMonth(salesItems, now)

  const orderDates = orders.map((o) => parseISO(o.created_at))
  const ordersPct = monthOverMonth(orderDates, now)

  const bookingDates = bookings.map((b) => parseISO(b.created_at))
  const bookingsPct = monthOverMonth(bookingDates, now)

  const viewDates = pageViews.map((v) => parseISO(v.viewed_at))
  const viewsPct = monthOverMonth(viewDates, now)

  // ---- Top products (by units sold from order_items) ----
  const productSales = validOrders.reduce((acc: Record<string, number>, order) => {
    const items = Array.isArray(order.order_items) ? order.order_items : []
    items.forEach((item: any) => {
      const name = item.product_name || item.name
      if (name) acc[name] = (acc[name] || 0) + (Number(item.quantity) || 1)
    })
    return acc
  }, {})
  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, sales], i) => ({ name, sales, color: PRODUCT_COLORS[i % PRODUCT_COLORS.length] }))

  // ---- Inventory alerts ----
  const lowStock = products
    .filter((p) => p.track_inventory && p.stock_quantity !== null && p.stock_quantity !== undefined)
    .filter((p) => (p.stock_quantity as number) <= (p.low_stock_threshold ?? 5))
    .sort((a, b) => (a.stock_quantity as number) - (b.stock_quantity as number))
    .slice(0, 5)

  // ---- Recent activity ----
  type Activity = { id: string; label: string; sublabel: string; date: Date }
  const activities: Activity[] = [
    ...orders.map((o) => ({
      id: `order-${o.id}`,
      label: `New order from ${o.customer_name}`,
      sublabel: `$${Number(o.total_amount).toFixed(2)} · ${o.status}`,
      date: parseISO(o.created_at),
    })),
    ...bookings.map((b) => ({
      id: `booking-${b.id}`,
      label:
        b.status === "confirmed"
          ? `Booking confirmed for ${b.customer_name}`
          : `New booking request from ${b.customer_name}`,
      sublabel: `${format(parseISO(b.booking_date), "MMM d")} at ${b.booking_time?.slice(0, 5) ?? ""}`,
      date: parseISO(b.created_at),
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5)

  // ---- Today's schedule ----
  const todaysBookings = bookings
    .filter((b) => b.status !== "cancelled" && isSameDay(parseISO(b.booking_date), now))
    .sort((a, b) => (a.booking_time > b.booking_time ? 1 : -1))

  const serviceNameById = new Map(services.map((s) => [s.id, s.name]))

  const firstName = (ownerName || business.business_name).split(" ")[0]

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1600px] overflow-x-hidden">
      <main className="min-w-0 px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Header */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <MobileDashboardNav />
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <span className="hidden text-sm text-muted-foreground md:inline">
                  {format(now, "EEEE, MMMM do yyyy")}
                </span>
                <ThemeToggle />
                <Avatar className="h-9 w-9">
                  <AvatarImage src={avatarUrl ?? undefined} alt={ownerName ?? business.business_name} />
                  <AvatarFallback>{firstName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold leading-none">{ownerName || business.business_name}</p>
                  <p className="text-xs text-muted-foreground">Business owner</p>
                </div>
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold leading-tight sm:text-2xl">Hello {firstName},</h1>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                Here&apos;s what&apos;s happening with{" "}
                <span className="break-words">{business.business_name}</span>
              </p>
            </div>
          </div>

          <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-6">
              {/* Stat cards */}
              <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                <StatCardLink href="/dashboard/analytics#revenue" className="border-0 bg-emerald-600 text-white shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-white/90">Total Sales</CardTitle>
                    <DollarSign className="h-4 w-4 shrink-0 text-white/80" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold sm:text-3xl">
                      ${totalSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-xs text-white/85">
                      {salesPct >= 0 ? <TrendingUp className="h-3 w-3 shrink-0" /> : <TrendingDown className="h-3 w-3 shrink-0" />}
                      <span className="font-semibold">{Math.abs(salesPct).toFixed(1)}%</span> from last month
                    </p>
                  </CardContent>
                </StatCardLink>

                <StatCardLink href="/dashboard/orders">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
                    <TrendBadge pct={ordersPct} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold sm:text-3xl">{orders.length}</div>
                    <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <ShoppingBag className="h-3 w-3 shrink-0" /> from last month
                    </p>
                  </CardContent>
                </StatCardLink>

                <StatCardLink href="/dashboard/bookings">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
                    <TrendBadge pct={bookingsPct} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold sm:text-3xl">{bookings.length}</div>
                    <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="h-3 w-3 shrink-0" /> from last month
                    </p>
                  </CardContent>
                </StatCardLink>

                <StatCardLink href="/dashboard/analytics#visitors">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Visitors</CardTitle>
                    <TrendBadge pct={viewsPct} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold sm:text-3xl">{pageViews.length}</div>
                    <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3 shrink-0" /> from last month
                    </p>
                  </CardContent>
                </StatCardLink>
              </div>

              {/* Quick actions */}
              <Card className="min-w-0 w-full max-w-full overflow-hidden">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      variant="outline"
                      className="h-14 justify-start gap-2 bg-transparent text-base font-semibold"
                      asChild
                    >
                      <Link href="/dashboard/inventory?new=1">
                        <Plus className="h-4 w-4" /> Products
                      </Link>
                    </Button>
                    <Button variant="outline" className="h-14 justify-start gap-2 bg-transparent text-base font-semibold" asChild>
                      <Link href="/dashboard/promotions">
                        <Plus className="h-4 w-4" /> Promotion
                      </Link>
                    </Button>
                    <Button variant="outline" className="h-14 justify-between bg-transparent text-base font-semibold" asChild>
                      <Link href={businessUrl} target="_blank">
                        View Store <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-14 justify-between bg-transparent text-base font-semibold"
                      onClick={handleCopyLink}
                    >
                      {copied ? "Link copied!" : "Share Store"} <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent activity + today's schedule */}
              <div className="grid min-w-0 gap-6 md:grid-cols-2">
                <Card className="min-w-0 w-full max-w-full overflow-hidden">
                  <CardHeader>
                    <CardTitle>Recent Activities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activities.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No activity yet — new orders and bookings will show up here.</p>
                    ) : (
                      <ul className="space-y-4">
                        {activities.map((a) => (
                          <li key={a.id}>
                            <p className="text-sm font-medium leading-tight">{a.label}</p>
                            <p className="text-xs text-muted-foreground">{a.sublabel}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>

                <Card className="min-w-0 w-full max-w-full overflow-hidden">
                  <CardHeader>
                    <CardTitle>Today&apos;s Schedule</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {todaysBookings.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No bookings scheduled for today.</p>
                    ) : (
                      <ul className="space-y-4">
                        {todaysBookings.map((b) => (
                          <li key={b.id} className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-9 w-16 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold">
                                {b.booking_time?.slice(0, 5)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium leading-tight">
                                  {(b.service_id && serviceNameById.get(b.service_id)) || "Booking"}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">Customer: {b.customer_name}</p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="w-fit shrink-0 capitalize">
                              {b.status === "pending" ? "Upcoming" : b.status}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Catalog management — products now live on the dedicated Inventory page */}
              <div className="min-w-0 space-y-6">
                <Card className="min-w-0 w-full max-w-full overflow-hidden">
                  <CardHeader>
                    <CardTitle>Services</CardTitle>
                    <CardDescription>
                      Shown in the Services section on your public page. Manage product stock and pricing from{" "}
                      <Link href="/dashboard/inventory" className="text-primary underline-offset-4 hover:underline">
                        Inventory
                      </Link>
                      .
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ServiceList services={services} businessId={business.id} />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right column */}
            <div className="min-w-0 space-y-6">
              <Card className="min-w-0 w-full max-w-full overflow-hidden border-0 bg-slate-900 text-white">
                <CardHeader>
                  <CardTitle className="text-white">Top Products</CardTitle>
                </CardHeader>
                <CardContent>
                  {topProducts.length === 0 ? (
                    <p className="text-sm text-white/60">No sales yet — top sellers will show up here.</p>
                  ) : (
                    <ul className="space-y-3">
                      {topProducts.map((p) => (
                        <li key={p.name} className="flex items-center gap-3">
                          <span className={`h-3 w-3 shrink-0 rounded-sm ${p.color}`} />
                          <span className="flex-1 text-sm text-white/90">{p.name}</span>
                          <span className="text-xs text-white/50">{p.sales} sold</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card className={cn("min-w-0 w-full max-w-full overflow-hidden", lowStock.length > 0 ? "border-0 bg-red-600 text-white" : "")}>
                <CardHeader>
                  <CardTitle className={lowStock.length > 0 ? "flex items-center gap-2 text-white" : "flex items-center gap-2"}>
                    <AlertTriangle className="h-5 w-5" /> Inventory Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {lowStock.length === 0 ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4" /> Stock levels look healthy.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {lowStock.map((p) => (
                        <li key={p.id} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>
                            {p.stock_quantity === 0
                              ? `Out of stock: ${p.name}!`
                              : `${p.stock_quantity} stock${p.stock_quantity === 1 ? "" : "s"} of ${p.name} left!`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
    </div>
  )
}
