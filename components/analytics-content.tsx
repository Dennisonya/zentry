"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, ArrowLeft, TrendingUp, Eye, ShoppingBag, DollarSign } from "lucide-react"
import { format, startOfDay, parseISO } from "date-fns"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Bar, BarChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

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
}

interface AnalyticsContentProps {
  business: Business
  pageViews: PageView[]
  totalViews: number
  products: Product[]
  orders: Order[]
}

export function AnalyticsContent({ business, pageViews, totalViews, products, orders }: AnalyticsContentProps) {
  // Process page views by day
  const viewsByDay = pageViews.reduce(
    (acc, view) => {
      const day = format(startOfDay(parseISO(view.viewed_at)), "MMM dd")
      acc[day] = (acc[day] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const viewsChartData = Object.entries(viewsByDay).map(([date, views]) => ({
    date,
    views,
  }))

  // Calculate revenue
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0)

  // Calculate popular products
  const productSales = orders.reduce(
    (acc, order) => {
      if (Array.isArray(order.order_items)) {
        order.order_items.forEach((item: any) => {
          acc[item.product_name] = (acc[item.product_name] || 0) + 1
        })
      }
      return acc
    },
    {} as Record<string, number>,
  )

  const popularProductsData = Object.entries(productSales)
    .map(([name, sales]) => ({ name, sales }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">InstantBiz</span>
          </div>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analytics</h1>
          <p className="text-muted-foreground">Track your business performance and customer behavior</p>
        </div>

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
              <p className="text-xs text-muted-foreground">All time</p>
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
          <Card>
            <CardHeader>
              <CardTitle>Page Views (Last 30 Days)</CardTitle>
              <CardDescription>Daily visitor traffic to your business page</CardDescription>
            </CardHeader>
            <CardContent>
              {viewsChartData.length > 0 ? (
                <ChartContainer
                  config={{
                    views: {
                      label: "Views",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={viewsChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="views" stroke="var(--color-views)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No page views data yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Popular Products</CardTitle>
              <CardDescription>Top 5 most ordered products</CardDescription>
            </CardHeader>
            <CardContent>
              {popularProductsData.length > 0 ? (
                <ChartContainer
                  config={{
                    sales: {
                      label: "Orders",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={popularProductsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="sales" fill="var(--color-sales)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No order data yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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
                  Make sure your products have clear descriptions and attractive images. Consider adding your WhatsApp
                  number to make ordering easier for customers.
                </p>
              </div>
            )}

            {orders.length > 0 && totalViews > 0 && (orders.length / totalViews) * 100 < 5 && (
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Low conversion rate</h3>
                <p className="text-sm text-muted-foreground">
                  Your conversion rate is below 5%. Try improving product photos, adding detailed descriptions, or
                  offering special promotions to encourage more orders.
                </p>
              </div>
            )}

            {products.length < 5 && (
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Add more products</h3>
                <p className="text-sm text-muted-foreground">
                  Having a wider selection of products can attract more customers and increase sales. Consider adding
                  more items to your catalog.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
