"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { StoreCartItem } from "@/lib/store-cart"

interface StoreCartDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessId: string
  businessName: string
  whatsappNumber?: string | null
  items: StoreCartItem[]
  onQuantityChange: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
  onClear: () => void
}

type CheckoutProfile = {
  full_name: string | null
  phone: string | null
  address: string | null
}

export function StoreCartDrawer({ open, onOpenChange, businessId, businessName, whatsappNumber, items, onQuantityChange, onRemove, onClear }: StoreCartDrawerProps) {
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [form, setForm] = useState({ fullName: "", phone: "", address: "", notes: "" })

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items])

  useEffect(() => {
    if (!open || checkoutOpen) return
    setError(null)
    setSuccess(null)
  }, [open, checkoutOpen])

  const beginCheckout = async () => {
    setError(null)
    setSuccess(null)
    setProfileLoading(true)

    try {
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        const next = encodeURIComponent(window.location.pathname)
        window.location.href = `/auth/login?next=${next}`
        return
      }

      setUserId(user.id)
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone, address")
        .eq("id", user.id)
        .maybeSingle()

      const typedProfile = (profile as CheckoutProfile | null) || null
      setForm((current) => ({
        fullName: typedProfile?.full_name || current.fullName,
        phone: typedProfile?.phone || current.phone,
        address: typedProfile?.address || current.address,
        notes: current.notes,
      }))
      setCheckoutOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.")
    } finally {
      setProfileLoading(false)
    }
  }

  const notifyBusiness = () => {
    if (!whatsappNumber) return
    const itemLines = items
      .map((item) => `• ${item.name} x${item.quantity} — $${(item.price * item.quantity).toFixed(2)}`)
      .join("\n")
    const message = `🛍️ NEW ZENTRY ORDER\n\nCustomer: ${form.fullName}\nPhone: ${form.phone}\nAddress: ${form.address}\n\nItems:\n${itemLines}\n\nTotal: $${subtotal.toFixed(2)}${form.notes ? `\n\nNotes: ${form.notes}` : ""}`
    const formattedNumber = whatsappNumber.replace(/[^0-9]/g, "")
    window.open(`https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`, "_blank")
  }

  const placeOrder = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseClient() as any
      const { data: { user } } = await supabase.auth.getUser()

      if (!user || user.id !== userId) {
        const next = encodeURIComponent(window.location.pathname)
        window.location.href = `/auth/login?next=${next}`
        return
      }

      const { data: insertedOrder, error: insertError } = await supabase
        .from("orders")
        .insert({
          business_id: businessId,
          customer_id: user.id,
          customer_name: form.fullName,
          customer_email: user.email || null,
          customer_phone: form.phone,
          total_amount: subtotal,
          status: "pending",
          order_items: items.map((item) => ({
            product_id: item.productId,
            product_name: item.name,
            price: item.price,
            quantity: item.quantity,
            image_url: item.imageUrl,
          })),
          delivery_address: form.address,
          additional_notes: form.notes || null,
          inquiry_type: "order",
        })
        .select("id")
        .single()

      if (insertError) throw insertError

      notifyBusiness()
      setSuccess(`Order ${insertedOrder?.id ? `#${String(insertedOrder.id).slice(0, 8)}` : ""} placed successfully.`)
      setCheckoutOpen(false)
      onClear()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button type="button" onClick={() => onOpenChange(true)} aria-label={`Open ${businessName} cart`} className="fixed bottom-6 right-6 z-40 flex h-14 items-center gap-2 rounded-full bg-primary px-5 text-primary-foreground shadow-xl transition-transform hover:scale-[1.02]">
        <ShoppingCart className="h-5 w-5" />
        <span className="font-semibold">Cart</span>
        {itemCount > 0 && <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-background px-1.5 text-xs font-bold text-foreground">{itemCount}</span>}
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <button type="button" aria-label="Close cart" className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={() => onOpenChange(false)} />
          <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4"><div><p className="text-lg font-semibold">Your cart</p><p className="text-xs text-muted-foreground">{businessName}</p></div><Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label="Close cart"><X className="h-5 w-5" /></Button></div>
            <div className="flex-1 overflow-y-auto p-5">
              {success && <Alert className="mb-4 border-green-200 bg-green-50 text-green-900"><AlertDescription>{success} You can track it from your account.</AlertDescription></Alert>}
              {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
              {items.length === 0 ? (
                <div className="flex min-h-[50vh] flex-col items-center justify-center text-center"><ShoppingCart className="mb-4 h-12 w-12 text-muted-foreground/50" /><h3 className="text-lg font-semibold">Your cart is empty</h3><p className="mt-1 max-w-xs text-sm text-muted-foreground">Add a few products from {businessName}, then come back here to check out.</p></div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-3 rounded-2xl border p-3">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">{item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>}</div>
                      <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><p className="font-medium">{item.name}</p><p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p></div><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRemove(item.productId)}><Trash2 className="h-4 w-4" /></Button></div><div className="mt-3 flex items-center justify-between"><div className="flex items-center rounded-lg border"><Button variant="ghost" size="icon" className="h-8 w-8 rounded-r-none" onClick={() => onQuantityChange(item.productId, item.quantity - 1)}><Minus className="h-3.5 w-3.5" /></Button><span className="w-8 text-center text-sm font-medium">{item.quantity}</span><Button variant="ghost" size="icon" className="h-8 w-8 rounded-l-none" onClick={() => onQuantityChange(item.productId, item.quantity + 1)}><Plus className="h-3.5 w-3.5" /></Button></div><p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p></div></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {items.length > 0 && !checkoutOpen && <div className="border-t bg-background p-5"><div className="mb-4 flex items-center justify-between"><span className="text-muted-foreground">Subtotal</span><span className="text-xl font-bold">${subtotal.toFixed(2)}</span></div><div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={onClear}>Clear</Button><Button className="flex-1" onClick={beginCheckout} disabled={profileLoading}>{profileLoading ? "Loading..." : "Checkout"}</Button></div></div>}
          </aside>
        </div>
      )}

      {checkoutOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 p-4"><div className="w-full max-w-lg rounded-2xl border bg-background shadow-2xl"><div className="flex items-center justify-between border-b px-5 py-4"><div><p className="text-lg font-semibold">Checkout</p><p className="text-xs text-muted-foreground">{businessName}</p></div><Button variant="ghost" size="icon" onClick={() => setCheckoutOpen(false)}><X className="h-5 w-5" /></Button></div><form onSubmit={placeOrder} className="space-y-5 p-5"><div className="rounded-xl bg-muted/50 p-4 text-sm"><div className="flex items-center justify-between"><span>{itemCount} item{itemCount !== 1 ? "s" : ""}</span><span className="font-semibold">${subtotal.toFixed(2)}</span></div></div><div className="space-y-2"><Label htmlFor="checkout-name">Name</Label><Input id="checkout-name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></div><div className="space-y-2"><Label htmlFor="checkout-phone">Phone</Label><Input id="checkout-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></div><div className="space-y-2"><Label htmlFor="checkout-address">Delivery address</Label><Textarea id="checkout-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Your saved address" rows={3} required /></div><div className="space-y-2"><Label htmlFor="checkout-notes">Order notes (optional)</Label><Textarea id="checkout-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Anything the business should know?" rows={2} /></div><div className="flex gap-2 pt-1"><Button type="button" variant="outline" className="flex-1" onClick={() => setCheckoutOpen(false)}>Back to cart</Button><Button type="submit" className="flex-1" disabled={loading}>{loading ? "Placing order..." : "Place order"}</Button></div><p className="text-center text-xs text-muted-foreground">Need to change your saved details? <Link href="/account/settings" className="underline">Update your account</Link>.</p></form></div></div>
      )}
    </>
  )
}
