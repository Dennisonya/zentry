"use client"

import { useMemo } from "react"
import { Pie, PieChart, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { Order } from "@/components/dashboard-content"

interface DashboardPerformanceChartProps {
  orders: Order[]
  bookings?: unknown[]
  pageViews?: unknown[]
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

export function DashboardPerformanceChart({ orders }: DashboardPerformanceChartProps) {
  const data = useMemo(() => {
    const sales = orders
      .filter((order) => order.status !== "cancelled")
      .reduce((acc: Record<string, number>, order) => {
        const items = Array.isArray(order.order_items) ? order.order_items : []
        items.forEach((item: any) => {
          const name = item.product_name || item.name
          if (name) acc[name] = (acc[name] || 0) + (Number(item.quantity) || 1)
        })
        return acc
      }, {})

    return Object.entries(sales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }))
  }, [orders])

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Popular Products</CardTitle>
        <CardDescription>Your top 5 most ordered products.</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            No product sales yet — your top products will appear here.
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
            <ChartContainer
              config={{ value: { label: "Units sold" } }}
              className="h-[250px] w-[250px] aspect-square"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="68%"
                  outerRadius="92%"
                  paddingAngle={2}
                  strokeWidth={2}
                  stroke="hsl(var(--background))"
                >
                  {data.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-xl font-bold">
                  {total}
                </text>
                <text x="50%" y="57%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-[11px]">
                  units sold
                </text>
              </PieChart>
            </ChartContainer>

            <div className="w-full max-w-xs space-y-3">
              {data.map((item, index) => (
                <div key={item.name} className="flex items-center gap-3 text-sm">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  <span className="font-medium tabular-nums">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
