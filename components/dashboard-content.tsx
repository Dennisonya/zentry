"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Sparkles,
  ExternalLink,
  Plus,
  Package,
  ShoppingBag,
  TrendingUp,
  LogOut,
  Settings,
  Copy,
  Check,
  Calendar,
  Tag,
  Users,
  UserCircle,
} from "lucide-react"
import { AddProductDialog } from "@/components/add-product-dialog"
import { ProductList } from "@/components/product-list"
import { ServiceList } from "@/components/service-list"
import { ThemeToggle } from "@/components/theme-toggle"
import { getSupabaseClient } from "@/lib/supabase"

export interface Business {
  id: string
  business_name: string
  slug: string
  business_type: string
  business_type_mode?: string
  phone: string | null
  email: string | null
  address: string | null
  description: string | null
  whatsapp_number: string | null
  instagram_handle: string | null
}

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string | null
  is_available: boolean
}

export interface Service {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string | null
  duration_minutes: number | null
  location: string | null
  is_available: boolean
}

export interface Order {
  id: string
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  total_amount: number
  status: string
  order_items: any
  created_at: string
}

export interface Booking {
  id: string
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  total_amount: number
  status: string
  booking_date: string
  booking_time: string
  notes: string | null
  created_at: string
  updated_at: string
}
interface DashboardContentProps {
  business: Business
  products: Product[]
  services: Service[]
  orders: Order[]
  bookings: Booking[]
  totalViews: number
}

export function DashboardContent({ business, products, services, orders, totalViews, bookings }: DashboardContentProps) {
  const router = useRouter()
  const [addProductOpen, setAddProductOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const isServiceBusiness = business.business_type_mode === "service"

  const businessUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/b/${business.slug}`

  const handleSignOut = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(businessUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Revenue from orders (exclude cancelled)
  const totalCompletedOrders= orders
    .filter((o) => o.status === "completed")
    .reduce((sum, order) => sum + Number(order.total_amount), 0)

  const totalBookingsRevenue= bookings
    .filter((b) => b.status === "completed")
    .reduce((sum, booking) => sum + Number(booking.total_amount), 0)

  const totalRevenue = Number(totalCompletedOrders) + Number(totalBookingsRevenue)
  console.log(totalRevenue)
  console.log(totalCompletedOrders)
  console.log(totalBookingsRevenue)
  // For service businesses, active bookings = confirmed + pending
  const activeBookings = bookings.filter((b) =>
    ["pending", "confirmed", "rescheduled", "inquiry"].includes(b.status)
  ).length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Zentry
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/account">
              <Button variant="outline" size="sm" className="bg-transparent">
                <UserCircle className="h-4 w-4 mr-2" />
                My Account
              </Button>
            </Link>
            <Link href="/dashboard/analytics">
              <Button variant="outline" size="sm" className="bg-transparent">
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </Link>
            <Link href={businessUrl} target="_blank">
              <Button variant="outline" size="sm" className="bg-transparent">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Page
              </Button>
            </Link>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Business Info */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{business.business_name}</h1>
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-md">
              <span className="font-mono">{businessUrl}</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCopyLink}>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
            <Link href="/dashboard/settings">
              <Button variant="outline" size="sm" className="bg-transparent">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
            <Link href="/dashboard/promotions">
              <Button variant="outline" size="sm" className="bg-transparent">
                <Tag className="h-4 w-4 mr-2" />
                Promotions
              </Button>
            </Link>
            <Link href="/dashboard/bookings">
              <Button variant="outline" size="sm" className="bg-transparent">
                <Calendar className="h-4 w-4 mr-2" />
                Bookings
              </Button>
            </Link>
            <Link href="/dashboard/orders">
              <Button variant="outline" size="sm" className="bg-transparent">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Orders
              </Button>
            </Link>
            <Link href="/dashboard/customers">
              <Button variant="outline" size="sm" className="bg-transparent">
                <Users className="h-4 w-4 mr-2" />
                Customers
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Catalog</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length + services.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {products.length} product{products.length !== 1 ? "s" : ""} · {services.length} service
                {services.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isServiceBusiness ? "Active Bookings" : "Total Orders"}
              </CardTitle>
              {isServiceBusiness ? (
                <Calendar className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isServiceBusiness ? activeBookings : orders.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Page Views</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalViews}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Catalog: products and services are separate on the storefront */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>Products</CardTitle>
                  <CardDescription>
                    Shown in the Products section on your public page. Product orders appear under{" "}
                    <Link href="/dashboard/orders" className="text-primary underline-offset-4 hover:underline">
                      Orders
                    </Link>
                    .
                  </CardDescription>
                </div>
                <Button onClick={() => setAddProductOpen(true)} className="shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ProductList products={products} businessId={business.id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-2">
                <CardTitle>Services</CardTitle>
                <CardDescription>
                  Shown in the Services section on your public page. Service inquiries and bookings appear under{" "}
                  <Link href="/dashboard/bookings" className="text-primary underline-offset-4 hover:underline">
                    Bookings
                  </Link>
                  . Use <span className="font-medium text-foreground">Add</span> above and choose{" "}
                  <span className="font-medium text-foreground">Service</span> to create a new service.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ServiceList services={services} businessId={business.id} />
            </CardContent>
          </Card>
        </div>
      </div>

      <AddProductDialog open={addProductOpen} onOpenChange={setAddProductOpen} businessId={business.id} />
    </div>
  )
}
