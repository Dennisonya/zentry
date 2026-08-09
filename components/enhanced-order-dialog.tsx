"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, ShoppingBag, Sparkles } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

interface Product {
  id: string
  name: string
  price: number
  original_price?: number | null
  promotion_badge?: string | null
  image_url?: string | null
}

interface EnhancedOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product
  businessId: string
  businessName: string
  whatsappNumber?: string | null
  instagramHandle?: string | null
}

export function EnhancedOrderDialog({
  open,
  onOpenChange,
  product,
  businessId,
  businessName,
  whatsappNumber,
  instagramHandle,
}: EnhancedOrderDialogProps) {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [formData, setFormData] = useState({
    customerName: "",
    whatsappNumber: "",
    deliveryAddress: "",
    additionalNotes: "",
  })

  const totalAmount = product.price * quantity
  const showDiscount = product.original_price != null && Number(product.original_price) > Number(product.price)
  const loginNext = `/auth/login?next=${encodeURIComponent(pathname || "/")}`
  const signUpNext = `/auth/sign-up?next=${encodeURIComponent(pathname || "/")}`

  useEffect(() => {
    if (!open) return
    let cancelled = false
    const run = async () => {
      setAuthChecked(false)
      const supabase = getSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (cancelled) return
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone, address")
          .eq("id", user.id)
          .maybeSingle()
        if (!cancelled && profile) {
          setFormData((f) => ({
            ...f,
            customerName: f.customerName || (profile as any).full_name || "",
            whatsappNumber: f.whatsappNumber || (profile as any).phone || "",
            deliveryAddress: f.deliveryAddress || (profile as any).address || "",
          }))
        }
      }
      if (!cancelled) setAuthChecked(true)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [open])

  const sendWhatsAppNotification = async (orderDetails: any) => {
    if (!whatsappNumber) return

    const message = `🛍️ *NEW ORDER RECEIVED* 🛍️

*Customer Details:*
👤 Name: ${orderDetails.customerName}
📱 WhatsApp: ${orderDetails.whatsappNumber}
📍 Address: ${orderDetails.deliveryAddress}

*Order Details:*
🛒 Product: ${product.name}
💰 Price: $${product.price.toFixed(2)}
🔢 Quantity: ${quantity}
💵 *Total: $${totalAmount.toFixed(2)}*

${orderDetails.additionalNotes ? `📝 *Notes:* ${orderDetails.additionalNotes}\n\n` : ""}
---
Order placed via Zentry 🚀`

    const formattedNumber = whatsappNumber.replace(/[^0-9]/g, "")
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const sendInstagramNotification = async () => {
    if (!instagramHandle) return
    const instagramUrl = `https://www.instagram.com/${instagramHandle.replace("@", "")}/`
    window.open(instagramUrl, "_blank")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = getSupabaseClient() as any
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) {
        setError("Please sign in to place an order.")
        setUser(null)
        setLoading(false)
        return
      }

      const orderData = {
        business_id: businessId,
        customer_id: currentUser.id,
        customer_name: formData.customerName,
        customer_phone: formData.whatsappNumber,
        total_amount: totalAmount,
        status: "pending",
        order_items: [
          {
            product_id: product.id,
            product_name: product.name,
            price: product.price,
            quantity: quantity,
            image_url: product.image_url,
            original_price: product.original_price ?? null,
            promotion_badge: product.promotion_badge ?? null,
          },
        ],
        delivery_address: formData.deliveryAddress,
        additional_notes: formData.additionalNotes,
        inquiry_type: "order",
      }

      const { error: insertError } = await supabase.from("orders").insert(orderData)
      if (insertError) throw insertError

      if (whatsappNumber) {
        await sendWhatsAppNotification({
          customerName: formData.customerName,
          whatsappNumber: formData.whatsappNumber,
          deliveryAddress: formData.deliveryAddress,
          additionalNotes: formData.additionalNotes,
        })
      }

      if (instagramHandle) {
        await sendInstagramNotification()
      }

      setSuccess(true)
      setTimeout(() => {
        onOpenChange(false)
        setSuccess(false)
        setFormData({
          customerName: "",
          whatsappNumber: "",
          deliveryAddress: "",
          additionalNotes: "",
        })
        setQuantity(1)
      }, 3000)
    } catch (err: any) {
      setError(err.message || "Failed to place order")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden p-0">
        {success ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400 animate-in zoom-in-50" />
            </div>
            <h3 className="mb-2 text-2xl font-bold">Order Placed Successfully!</h3>
            <p className="text-muted-foreground mb-4">Your order has been received by {businessName}</p>
            <div className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4 text-sm dark:border-green-800 dark:from-green-900/20 dark:to-emerald-900/20">
              <p className="font-medium text-green-900 dark:text-green-100">What happens next?</p>
              <p className="mt-1 text-green-700 dark:text-green-300">
                ✅ Order saved to your account
                <br />
                {whatsappNumber && "📱 WhatsApp notification sent to business owner"}
                <br />
                Track it anytime in{" "}
                <Link href="/account" className="underline">
                  My Account
                </Link>
              </p>
            </div>
          </div>
        ) : !authChecked ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Checking your session...</div>
        ) : !user ? (
          <div className="space-y-4 p-8 text-center">
            <DialogHeader>
              <DialogTitle>Sign in required</DialogTitle>
              <DialogDescription>
                Create a free Zentry account or sign in to order from {businessName}. You&apos;ll return to this page
                afterward.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link href={loginNext}>
                <Button className="w-full sm:w-auto">Sign in</Button>
              </Link>
              <Link href={signUpNext}>
                <Button variant="outline" className="w-full bg-transparent sm:w-auto">
                  Create account
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6">
              <div className="absolute top-0 right-0 opacity-20">
                <Sparkles className="h-32 w-32" />
              </div>
              <DialogHeader className="relative">
                <DialogTitle className="text-2xl font-bold">Complete Your Order</DialogTitle>
                <DialogDescription className="text-base">
                  You&apos;re ordering from <span className="font-semibold">{businessName}</span>
                </DialogDescription>
              </DialogHeader>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              {error && (
                <Alert variant="destructive" className="animate-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background p-4">
                <div className="flex items-center gap-4">
                  {product.image_url && (
                    <div className="h-20 w-20 overflow-hidden rounded-lg bg-muted">
                      <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold">{product.name}</h4>
                    <div className="mt-1 flex flex-wrap items-baseline gap-2">
                      {product.promotion_badge ? (
                        <span className="inline-flex items-center rounded-full bg-green-600 px-2 py-0.5 text-xs font-medium text-white">
                          {product.promotion_badge}
                        </span>
                      ) : null}
                      <p className="text-2xl font-bold text-primary">${product.price.toFixed(2)}</p>
                      {showDiscount ? (
                        <p className="text-sm text-muted-foreground line-through">
                          ${Number(product.original_price).toFixed(2)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-lg bg-background p-3">
                  <Label className="font-medium">Quantity</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={loading}
                    >
                      -
                    </Button>
                    <span className="w-12 text-center text-lg font-bold">{quantity}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={loading}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t pt-3">
                  <span className="font-semibold">Total Amount</span>
                  <span className="text-2xl font-bold text-primary">${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-lg font-semibold">
                  <ShoppingBag className="h-5 w-5" />
                  Your Information
                </h4>

                <div className="space-y-2">
                  <Label htmlFor="customerName">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="customerName"
                    placeholder="John Doe"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">
                    WhatsApp Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="whatsappNumber"
                    type="tel"
                    placeholder="+234 803 456 7890"
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryAddress">
                    Delivery Address <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="deliveryAddress"
                    placeholder="123 Main Street, Apartment 4B, City, State"
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                    required
                    disabled={loading}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="additionalNotes"
                    placeholder="Any special instructions or requests..."
                    value={formData.additionalNotes}
                    onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                    disabled={loading}
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Processing..." : "Place Order"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
