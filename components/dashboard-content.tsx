"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Zap, ExternalLink, Plus, Package, ShoppingBag, TrendingUp, LogOut, Settings, Copy, Check } from "lucide-react"
import { AddProductDialog } from "@/components/add-product-dialog"
import { ProductList } from "@/components/product-list"
import { OrderList } from "@/components/order-list"
import { ThemeToggle } from "@/components/theme-toggle"
import { getSupabaseClient } from "@/lib/supabase"

export interface Business {
  id: string
  business_name: string
  slug: string
  business_type: string
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

interface DashboardContentProps {
  business: Business
  products: Product[]
  orders: Order[]
  totalViews: number
}

export function DashboardContent({ business, products, orders, totalViews }: DashboardContentProps) {
  const router = useRouter()
  const [addProductOpen, setAddProductOpen] = useState(false)
  const [copied, setCopied] = useState(false)

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">InstantBiz</span>
          </div>
          <div className="flex items-center gap-3">
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
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
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
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
              <div className="text-2xl font-bold">
                ${orders.reduce((sum, order) => sum + Number(order.total_amount), 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Products</CardTitle>
                    <CardDescription>Manage your product catalog</CardDescription>
                  </div>
                  <Button onClick={() => setAddProductOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ProductList products={products} businessId={business.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>View and manage customer orders</CardDescription>
              </CardHeader>
              <CardContent>
                <OrderList orders={orders} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AddProductDialog open={addProductOpen} onOpenChange={setAddProductOpen} businessId={business.id} />
    </div>
  )
}
