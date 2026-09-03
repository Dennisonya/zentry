"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, TrendingUp, Eye, ShoppingBag, DollarSign } from "lucide-react"
import { format, startOfDay, parseISO, startOfWeek, startOfMonth, subDays, subWeeks, subMonths } from "date-fns"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Bar, BarChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { MobileDashboardNav } from "@/components/dashboard/dashboard-sidebar"

interface Business {
  id: string
  business_name: string
  slug: string
}

interface PageView {
  id: string
  viewed_at: string
}

interface Product {
  id: string
  name: string
}

interface Order {
  id: string
  total_amount: number
  order_items: any
  created_at: string
  status: string
}

interface AnalyticsContentProps {
  business: Business
  pageViews: PageView[]
  totalViews: number
  products: Product[]
  orders: Order[]
}

interface Business { id: string; business_name: string; slug: string }
interface PageView { id: string; viewed_at: string }
interface Product { id: string; name: string }
interface Order { id: string; total_amount: number; order_items: any; created_at: string; status: string }
interface AnalyticsContentProps { business: Business; pageViews: PageView[]; totalViews: number; products: Product[]; orders: Order[] }
type RevenuePeriod = "daily" | "weekly" | "monthly"

const viewsChartConfig = { views: { label: "Views", color: "var(--chart-1)" } } satisfies ChartConfig
const revenueChartConfig = { revenue: { label: "Revenue", color: "var(--chart-2)" } } satisfies ChartConfig
const productsChartConfig = { sales: { label: "Orders", color: "var(--chart-3)" } } satisfies ChartConfig

export function AnalyticsContent({ business, pageViews, totalViews, products, orders }: AnalyticsContentProps) {
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>("weekly")
  const viewsByDay = pageViews.reduce((acc, view) => { const day = format(startOfDay(parseISO(view.viewed_at)), "MMM dd"); acc[day] = (acc[day] || 0) + 1; return acc }, {} as Record<string, number>)
  const viewsChartData = Object.entries(viewsByDay).map(([date, views]) => ({ date, views }))
  const validOrders = orders.filter((o) => o.status !== "cancelled")
  const totalRevenue = validOrders.reduce((sum, order) => sum + Number(order.total_amount), 0)

  const getRevenueChartData = () => {
    const now = new Date()
    if (revenuePeriod === "daily") return Array.from({ length: 7 }, (_, i) => { const day = subDays(now, 6 - i); const dayStart = startOfDay(day); const nextDay = subDays(day, -1); const revenue = validOrders.filter((o) => { const date = parseISO(o.created_at); return date >= dayStart && date < nextDay }).reduce((s, o) => s + Number(o.total_amount), 0); return { period: format(day, "MMM dd"), revenue: Number(revenue.toFixed(2)) } })
    if (revenuePeriod === "weekly") return Array.from({ length: 8 }, (_, i) => { const weekStart = startOfWeek(subWeeks(now, 7 - i)); const weekEnd = subDays(startOfWeek(subWeeks(now, 6 - i)), 0); const revenue = validOrders.filter((o) => { const date = parseISO(o.created_at); return date >= weekStart && date < weekEnd }).reduce((s, o) => s + Number(o.total_amount), 0); return { period: format(weekStart, "MMM dd"), revenue: Number(revenue.toFixed(2)) } })
    return Array.from({ length: 6 }, (_, i) => { const monthStart = startOfMonth(subMonths(now, 5 - i)); const monthEnd = startOfMonth(subMonths(now, 4 - i)); const revenue = validOrders.filter((o) => { const date = parseISO(o.created_at); return date >= monthStart && date < monthEnd }).reduce((s, o) => s + Number(o.total_amount), 0); return { period: format(monthStart, "MMM yyyy"), revenue: Number(revenue.toFixed(2)) } })
  }
  const revenueChartData = getRevenueChartData()
  const productSales = validOrders.reduce((acc, order) => { if (Array.isArray(order.order_items)) order.order_items.forEach((item: any) => { const name = item.product_name || item.name; if (name) acc[name] = (acc[name] || 0) + (Number(item.quantity) || 1) }); return acc }, {} as Record<string, number>)
  const popularProductsData = Object.entries(productSales).map(([name, sales]) => ({ name, sales })).sort((a, b) => b.sales - a.sales).slice(0, 5)

  const chartClassName = "aspect-auto h-[260px] w-full min-w-0 sm:h-[300px]"

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (!hash) return
    const el = document.getElementById(hash)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [])

  return (
    <div className="mx-auto max-w-[1600px] min-w-0 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-6 flex min-w-0 items-start gap-3">
        <MobileDashboardNav />
        <div className="min-w-0">
          <Link
            href="/dashboard"
            className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <h1 className="text-xl font-bold sm:text-2xl">Analytics</h1>
          <p className="text-sm text-muted-foreground">Track your business performance and customer behaviour</p>
        </div>
      </div>

      <div className="min-w-0">

        {/* Key Metrics */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalViews}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Confirmed orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalViews > 0 ? ((orders.length / totalViews) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Orders / Views</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Page views chart */}
          <Card id="visitors">
            <CardHeader>
              <CardTitle>Page Views (Last 30 Days)</CardTitle>
              <CardDescription>Daily visitor traffic to your business page</CardDescription>
            </CardHeader>
            <CardContent className="overflow-hidden">
              {viewsChartData.length > 0 ? (
                <ChartContainer config={{ views: { label: "Views", color: "hsl(var(--chart-1))" } }} className={chartClassName}>
                  <LineChart data={viewsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} tickMargin={8} />
                    <YAxis fontSize={12} width={32} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="views" stroke="var(--color-views)" strokeWidth={2} />
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[260px] items-center justify-center text-muted-foreground sm:h-[300px]">
                  No page views data yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue chart with period toggle */}
          <Card id="revenue">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <CardTitle>Revenue</CardTitle>
                  <CardDescription>Income over time (confirmed orders)</CardDescription>
                </div>
                <div className="flex shrink-0 flex-wrap gap-1">
                  {(["daily", "weekly", "monthly"] as RevenuePeriod[]).map((p) => (
                    <Button
                      key={p}
                      size="sm"
                      variant={revenuePeriod === p ? "default" : "outline"}
                      onClick={() => setRevenuePeriod(p)}
                      className={`px-2 text-xs sm:px-3 sm:text-sm ${revenuePeriod !== p ? "bg-transparent" : ""}`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-hidden">
              {revenueChartData.some((d) => d.revenue > 0) ? (
                <ChartContainer config={{ revenue: { label: "Revenue ($)", color: "hsl(var(--chart-2))" } }} className={chartClassName}>
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" fontSize={11} tickMargin={8} />
                    <YAxis fontSize={11} width={40} tickFormatter={(v) => `$${v}`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[260px] items-center justify-center text-muted-foreground sm:h-[300px]">
                  No revenue data yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Popular products */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Popular Products / Services</CardTitle>
            <CardDescription>Top 5 most ordered items</CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            {popularProductsData.length > 0 ? (
              <ChartContainer config={{ sales: { label: "Orders", color: "hsl(var(--chart-3))" } }} className={chartClassName}>
                <BarChart data={popularProductsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} tickMargin={8} interval={0} angle={-25} textAnchor="end" height={60} />
                  <YAxis fontSize={12} width={32} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="sales" fill="var(--color-sales)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[260px] items-center justify-center text-muted-foreground sm:h-[300px]">
                No order data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Insights & Recommendations</CardTitle>
            <CardDescription>Tips to grow your business</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {totalViews === 0 && (
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Share your page to get started</h3>
                <p className="text-sm text-muted-foreground">
                  Your business page hasn't received any views yet. Share your link on social media, WhatsApp, or with
                  your customers to start tracking visitors.
                </p>
              </div>
            )}
            {totalViews > 0 && orders.length === 0 && (
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">You have visitors but no orders yet</h3>
                <p className="text-sm text-muted-foreground">
                  Make sure your products or services have clear descriptions and attractive images. Consider adding your
                  WhatsApp number to make ordering easier for customers.
                </p>
              </div>
            )}
            {orders.length > 0 && totalViews > 0 && (orders.length / totalViews) * 100 < 5 && (
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Low conversion rate</h3>
                <p className="text-sm text-muted-foreground">
                  Your conversion rate is below 5%. Try improving photos, adding detailed descriptions, or offering
                  special promotions to encourage more orders.
                </p>
              </div>
            )}
            {products.length < 5 && (
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Add more products or services</h3>
                <p className="text-sm text-muted-foreground">
                  Having a wider selection can attract more customers and increase sales. Consider adding more items to
                  your catalog.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
