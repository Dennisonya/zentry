"use client"

import type React from "react"
import { useState } from "react"
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

interface Product {
  id: string
  name: string
  price: number
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
  instagramHandle
}: EnhancedOrderDialogProps) {
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

${orderDetails.additionalNotes ? `📝 *Notes:* ${orderDetails.additionalNotes}\n\n` : ''}
---
Order placed via Zentry 🚀`

    // Format WhatsApp number (remove spaces and special characters)
    const formattedNumber = whatsappNumber.replace(/[^0-9]/g, "")
    
    // Create WhatsApp API URL (this will be opened in a new window/tab behind the scenes)
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`
    
    // Open in a new window immediately (before the user sees success)
    window.open(whatsappUrl, '_blank')
  }

  const sendInstagramNotification = async (orderDetails: any) => {
    if (!instagramHandle) return

    // Open Instagram DM in a new window
    const instagramUrl = `https://www.instagram.com/${instagramHandle.replace('@', '')}/`
    window.open(instagramUrl, '_blank')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = getSupabaseClient()

      const orderData = {
        business_id: businessId,
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
          },
        ],
        delivery_address: formData.deliveryAddress,
        additional_notes: formData.additionalNotes,
        inquiry_type: "order",
      }

      const { error: insertError } = await supabase.from("orders").insert(orderData)

      if (insertError) throw insertError

      // Send notifications to business owner behind the scenes
      if (whatsappNumber) {
        await sendWhatsAppNotification({
          customerName: formData.customerName,
          whatsappNumber: formData.whatsappNumber,
          deliveryAddress: formData.deliveryAddress,
          additionalNotes: formData.additionalNotes,
        })
      }

      if (instagramHandle) {
        await sendInstagramNotification({
          customerName: formData.customerName,
        })
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
            <p className="text-muted-foreground mb-4">
              Your order has been received by {businessName}
            </p>
            <div className="rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 p-4 text-sm">
              <p className="font-medium text-green-900 dark:text-green-100">What happens next?</p>
              <p className="text-green-700 dark:text-green-300 mt-1">
                ✅ Order saved to your dashboard<br/>
                {whatsappNumber && "📱 WhatsApp notification sent to business owner"}<br/>
                {instagramHandle && "📸 Instagram notification sent to business owner"}<br/>
                🎉 You'll receive a confirmation shortly!
              </p>
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
                  You're ordering from <span className="font-semibold">{businessName}</span>
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

              {/* Product Summary */}
              <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background p-4">
                <div className="flex items-center gap-4">
                  {product.image_url && (
                    <div className="h-20 w-20 overflow-hidden rounded-lg bg-muted">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{product.name}</h4>
                    <p className="text-2xl font-bold text-primary mt-1">
                      ${product.price.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Quantity Selector */}
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
                    <span className="w-12 text-center font-bold text-lg">{quantity}</span>
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

                {/* Total */}
                <div className="mt-3 flex items-center justify-between border-t pt-3">
                  <span className="font-semibold">Total Amount</span>
                  <span className="text-2xl font-bold text-primary">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Customer Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg flex items-center gap-2">
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
                    className="transition-all focus:scale-[1.02]"
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
                    className="transition-all focus:scale-[1.02]"
                  />
                  <p className="text-xs text-muted-foreground">
                    The business will contact you here to confirm your order
                  </p>
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
                    className="resize-none transition-all focus:scale-[1.02]"
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
                    className="resize-none transition-all focus:scale-[1.02]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
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
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  {loading ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Place Order
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}