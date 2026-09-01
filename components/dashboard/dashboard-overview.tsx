"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { DonutChart } from "@tremor/react"
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
  Package,
} from "lucide-react"
import { format, isSameDay, parseISO, startOfMonth, subMonths } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { AddProductDialog } from "@/components/add-product-dialog"
import { ProductList } from "@/components/product-list"
import { ServiceList } from "@/components/service-list"
import { MobileDashboardNav } from "@/components/dashboard/dashboard-sidebar"
import type { Business, Product, Service, Order, Booking as BaseBooking } from "@/components/dashboard-content"

interface PageView {
  id: string
  viewed_at: string
}

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

const PRODUCT_COLORS = ["blue", "orange", "lime", "slate", "cyan"] as const

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
  const [addProductOpen, setAddProductOpen] = useState(false)
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

  const validOrders = orders.filter((o) => o.status !== "cancelled")
  const validBookings = bookings.filter((b) => b.status !== "cancelled")

  const salesItems = [
    ...validOrders.map((o) => ({ date: parseISO(o.created_at), amount: Number(o.total_amount) })),
    ...validBookings.map((b) => ({ date: parseISO(b.created_at), amount: Number(b.total_amount) })),
  ]
  const { thisSum: totalSales, pct: salesPct } = sumMonthOverMonth(salesItems, now)

  const ordersPct = monthOverMonth(orders.map((o) => parseISO(o.created_at)), now)
  const bookingsPct = monthOverMonth(bookings.map((b) => parseISO(b.created_at)), now)
  const viewsPct = monthOverMonth(pageViews.map((v) => parseISO(v.viewed_at)), now)

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

  const lowStock = products
    .filter((p: any) => p.track_inventory && p.stock_quantity !== null && p.stock_quantity !== undefined)
    .filter((p: any) => p.stock_quantity <= (p.low_stock_threshold ?? 5))
    .sort((a: any, b: any) => a.stock_quantity - b.stock_quantity)
    .slice(0, 5) as any[]

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
      label: b.status === "confirmed" ? `Booking confirmed for ${b.customer_name}` : `New booking request from ${b.customer_name}`,
      sublabel: `${format(parseISO(b.booking_date), "MMM d")} at ${b.booking_time?.slice(0, 5) ?? ""}`,
      date: parseISO(b.created_at),
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5)

  const todaysBookings = bookings
    .filter((b) => b.status !== "cancelled" && isSameDay(parseISO(b.booking_date), now))
    .sort((a, b) => (a.booking_time > b.booking_time ? 1 : -1))

  const serviceNameById = new Map(services.map((s) => [s.id, s.name]))
  const firstName = (ownerName || business.business_name).split(" ")[0]

  const donutData = topProducts.map(({ name, sales }) => ({ name, sales }))
  const totalProductSales = donutData.reduce((sum, item) => sum + item.sales, 0)

  return (
    <>
      <div className="mx-auto max-w-[1600px]">
        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <MobileDashboardNav />
              <div>
                <h1 className="text-2xl font-bold leading-tight text-balance">Hello {firstName},</h1>
                <p className="text-muted-foreground">Here&apos;s what&apos;s happening with {business.business_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <span className="hidden text-sm text-muted-foreground md:inline">{format(now, "EEEE, MMMM do yyyy")}</span>
              <ThemeToggle />
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src={avatarUrl ?? undefined} alt={ownerName ?? business.business_name} />
                  <AvatarFallback>{firstName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold leading-none">{ownerName || business.business_name}</p>
                  <p className="text-xs text-muted-foreground">Business owner</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="border-0 bg-emerald-600 text-white shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-white/90">Total Sales</CardTitle>
                    <DollarSign className="h-4 w-4 text-white/80" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">${totalSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    <p className="mt-2 flex items-center gap-1 text-xs text-white/85">
                      {salesPct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      <span className="font-semibold">{Math.abs(salesPct).toFixed(1)}%</span> from last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle><TrendBadge pct={ordersPct} /></CardHeader>
                  <CardContent><div className="text-3xl font-bold">{orders.length}</div><p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><ShoppingBag className="h-3 w-3" /> from last month</p></CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle><TrendBadge pct={bookingsPct} /></CardHeader>
                  <CardContent><div className="text-3xl font-bold">{bookings.length}</div><p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="h-3 w-3" /> from last month</p></CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Visitors</CardTitle><TrendBadge pct={viewsPct} /></CardHeader>
                  <CardContent><div className="text-3xl font-bold">{pageViews.length}</div><p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" /> from last month</p></CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button variant="outline" className="h-14 justify-start gap-2 bg-transparent text-base font-semibold" onClick={() => setAddProductOpen(true)}><Plus className="h-4 w-4" /> Products</Button>
                    <Button variant="outline" className="h-14 justify-start gap-2 bg-transparent text-base font-semibold" asChild><Link href="/dashboard/promotions"><Plus className="h-4 w-4" /> Promotion</Link></Button>
                    <Button variant="outline" className="h-14 justify-between bg-transparent text-base font-semibold" asChild><Link href={businessUrl} target="_blank">View Store <ExternalLink className="h-4 w-4" /></Link></Button>
                    <Button variant="outline" className="h-14 justify-between bg-transparent text-base font-semibold" onClick={handleCopyLink}>{copied ? "Link copied!" : "Share Store"} <Share2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Recent Activities</CardTitle></CardHeader>
                  <CardContent>{activities.length === 0 ? <p className="text-sm text-muted-foreground">No activity yet — new orders and bookings will show up here.</p> : <ul className="space-y-4">{activities.map((a) => <li key={a.id}><p className="text-sm font-medium leading-tight">{a.label}</p><p className="text-xs text-muted-foreground">{a.sublabel}</p></li>)}</ul>}</CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Today&apos;s Schedule</CardTitle></CardHeader>
                  <CardContent>{todaysBookings.length === 0 ? <p className="text-sm text-muted-foreground">No bookings scheduled for today.</p> : <ul className="space-y-4">{todaysBookings.map((b) => <li key={b.id} className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="flex h-9 w-16 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold">{b.booking_time?.slice(0, 5)}</div><div><p className="text-sm font-medium leading-tight">{(b.service_id && serviceNameById.get(b.service_id)) || "Booking"}</p><p className="text-xs text-muted-foreground">Customer: {b.customer_name}</p></div></div><Badge variant="secondary" className="shrink-0 capitalize">{b.status === "pending" ? "Upcoming" : b.status}</Badge></li>)}</ul>}</CardContent>
                </Card>
              </div>

              <div id="inventory" className="scroll-mt-8 space-y-6">
                <Card>
                  <CardHeader><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="flex items-center gap-2"><Package className="h-4 w-4" /> Products</CardTitle><CardDescription>Shown in the Products section on your public page.</CardDescription></div><Button onClick={() => setAddProductOpen(true)} className="shrink-0"><Plus className="h-4 w-4 mr-2" /> Add</Button></div></CardHeader>
                  <CardContent><ProductList products={products} businessId={business.id} /></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Services</CardTitle><CardDescription>Shown in the Services section on your public page. Use <span className="font-medium text-foreground">Add</span> above and choose <span className="font-medium text-foreground">Service</span>.</CardDescription></CardHeader>
                  <CardContent><ServiceList services={services} businessId={business.id} /></CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Top Products</CardTitle><CardDescription>Best-selling products by units sold</CardDescription></CardHeader>
                <CardContent>
                  {topProducts.length === 0 ? (
                    <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">No sales yet — top sellers will show up here.</div>
                  ) : (
                    <div className="space-y-5">
                      <div className="flex justify-center">
                        <DonutChart
                          data={donutData}
                          category="sales"
                          index="name"
                          colors={["blue", "orange", "lime", "slate", "cyan"]}
                          className="h-48 w-48"
                          showLabel
                          label={`${totalProductSales}`}
                          valueFormatter={(value) => `${value} sold`}
                          showAnimation
                        />
                      </div>
                      <div className="space-y-2">
                        {topProducts.map((p) => <div key={p.name} className="flex items-center gap-2 text-sm"><span className={`h-2.5 w-2.5 rounded-full bg-${p.color}-500`} /><span className="min-w-0 flex-1 truncate">{p.name}</span><span className="text-xs text-muted-foreground">{p.sales} sold</span></div>)}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className={lowStock.length > 0 ? "border-0 bg-red-600 text-white" : ""}>
                <CardHeader><CardTitle className={lowStock.length > 0 ? "flex items-center gap-2 text-white" : "flex items-center gap-2"}><AlertTriangle className="h-5 w-5" /> Inventory Alerts</CardTitle></CardHeader>
                <CardContent>{lowStock.length === 0 ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4" /> Stock levels look healthy.</p> : <ul className="space-y-2">{lowStock.map((p: any) => <li key={p.id} className="flex items-start gap-2 text-sm"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{p.stock_quantity === 0 ? `Out of stock: ${p.name}!` : `${p.stock_quantity} stock${p.stock_quantity === 1 ? "" : "s"} of ${p.name} left!`}</span></li>)}</ul>}</CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
      <AddProductDialog open={addProductOpen} onOpenChange={setAddProductOpen} businessId={business.id} />
    </>
  )
}
