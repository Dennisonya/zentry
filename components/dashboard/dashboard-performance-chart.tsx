"use client"

import { useMemo, useState } from "react"
import { format, isAfter, parseISO, subDays, startOfDay } from "date-fns"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import type { Order, Booking as BaseBooking } from "@/components/dashboard-content"

interface PageView {
  id: string
  viewed_at: string
}

type Booking = BaseBooking & { service_id?: string | null }

interface DashboardPerformanceChartProps {
  orders: Order[]
  bookings: Booking[]
  pageViews: PageView[]
}

const chartConfig = {
  sales: { label: "Sales", color: "hsl(var(--chart-1))" },
  visitors: { label: "Visitors", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig

export function DashboardPerformanceChart({ orders, bookings, pageViews }: DashboardPerformanceChartProps) {
  const [range, setRange] = useState<7 | 30>(30)

  const data = useMemo(() => {
    const today = startOfDay(new Date())
    const days = Array.from({ length: range }, (_, index) => subDays(today, range - 1 - index))

    return days.map((day) => {
      const nextDay = subDays(day, -1)
      const dayOrders = orders.filter((order) => {
        if (order.status === "cancelled") return false
        const date = parseISO(order.created_at)
        return !isAfter(date, nextDay) && isAfter(date, day)
      })
      const dayBookings = bookings.filter((booking) => {
        if (booking.status === "cancelled") return false
        const date = parseISO(booking.created_at)
        return !isAfter(date, nextDay) && isAfter(date, day)
      })
      const dayViews = pageViews.filter((view) => {
        const date = parseISO(view.viewed_at)
        return !isAfter(date, nextDay) && isAfter(date, day)
      })

      const sales =
        dayOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) +
        dayBookings.reduce((sum, booking) => sum + Number(booking.total_amount || 0), 0)

      return {
        date: format(day, range === 7 ? "EEE" : "MMM d"),
        sales: Number(sales.toFixed(2)),
        visitors: dayViews.length,
      }
    })
  }, [orders, bookings, pageViews, range])

  const totalSales = data.reduce((sum, day) => sum + day.sales, 0)
  const totalVisitors = data.reduce((sum, day) => sum + day.visitors, 0)

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Performance overview</CardTitle>
          <CardDescription>Sales and storefront visitors over the last {range} days.</CardDescription>
        </div>
        <div className="flex items-center gap-1 rounded-lg border p-1">
          {[7, 30].map((value) => (
            <Button
              key={value}
              type="button"
              variant={range === value ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-3"
              onClick={() => setRange(value as 7 | 30)}
            >
              {value} days
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Sales</p>
            <p className="mt-1 text-lg font-semibold">${totalSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Visitors</p>
            <p className="mt-1 text-lg font-semibold">{totalVisitors.toLocaleString()}</p>
          </div>
        </div>

        {data.every((day) => day.sales === 0 && day.visitors === 0) ? (
          <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            Your performance data will appear here once customers visit or place an order.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[280px] w-full aspect-auto">
            <LineChart accessibilityLayer data={data} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis yAxisId="sales" tickLine={false} axisLine={false} width={42} tickFormatter={(value) => `$${value}`} />
              <YAxis yAxisId="visitors" orientation="right" tickLine={false} axisLine={false} width={34} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line yAxisId="sales" type="monotone" dataKey="sales" stroke="var(--color-sales)" strokeWidth={2} dot={false} />
              <Line yAxisId="visitors" type="monotone" dataKey="visitors" stroke="var(--color-visitors)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
