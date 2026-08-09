"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Phone,
  Mail,
  MapPin,
  StickyNote,
  ShoppingBag,
  CheckCircle2,
  QrCode,
  RefreshCw,
  X,
  Clock,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { getSupabaseClient } from "@/lib/supabase"
import { generateConfirmationToken } from "@/lib/otp"

interface OrderItem {
  product_id?: string
  product_name: string
  price: number
  quantity: number
}

export interface Order {
  id: string
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  total_amount: number
  status: string
  order_items: OrderItem[]
  created_at: string
  confirmation_token: string | null
  confirmed_at: string | null
  delivery_address: string | null
  additional_notes: string | null
  delivery_code: string | null
}

interface OrderDetailModalProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onOrderUpdated: (updated: Order) => void
}

const STATUS_COLOR: Record<string, string> = {
  pending:    "bg-amber-100 text-amber-800 border-amber-200",
  confirmed:  "bg-blue-100 text-blue-800 border-blue-200",
  completed:  "bg-green-100 text-green-800 border-green-200",
  cancelled:  "bg-red-100 text-red-800 border-red-200",
  inquiry:    "bg-purple-100 text-purple-800 border-purple-200",
  rescheduled:"bg-orange-100 text-orange-800 border-orange-200",
}

export function OrderDetailModal({ order, open, onOpenChange, onOrderUpdated }: OrderDetailModalProps) {
  const router = useRouter()
  const [showQR, setShowQR] = useState(false)
  const [confirmUrl, setConfirmUrl] = useState("")
  const [loading, setLoading] = useState<string | null>(null)

  // Build the confirm URL whenever the order changes
  useEffect(() => {
    if (order?.confirmation_token) {
      const base = typeof window !== "undefined" ? window.location.origin : ""
      setConfirmUrl(`${base}/confirm-order?token=${order.confirmation_token}`)
    }
  }, [order?.confirmation_token])

  if (!order) return null

  const items: OrderItem[] = Array.isArray(order.order_items) ? order.order_items : []
  const isCompleted = order.status === "completed"
  const isCancelled = order.status === "cancelled"

  // ── Ensure confirmation token exists (backfill for old orders) ──────────
  const ensureToken = async (): Promise<string> => {
    if (order.confirmation_token) return order.confirmation_token
    const supabase = getSupabaseClient()
    const token = generateConfirmationToken()
    const { error } = await supabase
      .from("orders")
      .update({ confirmation_token: token } as unknown as never)
      .eq("id", order.id)
    if (error) throw error
    const updated = { ...order, confirmation_token: token }
    onOrderUpdated(updated as Order)
    return token
  }

  // ── Show QR ─────────────────────────────────────────────────────────────
  const handleShowQR = async () => {
    setLoading("qr")
    try {
      const token = await ensureToken()
      const base = typeof window !== "undefined" ? window.location.origin : ""
      setConfirmUrl(`${base}/confirm-order?token=${token}`)
      setShowQR(true)
    } catch {
      alert("Could not generate QR code. Please try again.")
    } finally {
      setLoading(null)
    }
  }

  // ── Mark as completed (manual fallback) ─────────────────────────────────
  const handleMarkComplete = async () => {
    if (isCompleted) return
    setLoading("complete")
    try {
      const supabase = getSupabaseClient()
      const now = new Date().toISOString()
      const { error } = await supabase
        .from("orders")
        .update({ status: "completed", confirmed_at: now } as unknown as never)
        .eq("id", order.id)
      if (error) throw error
      onOrderUpdated({ ...order, status: "completed", confirmed_at: now })
      router.refresh()
    } catch {
      alert("Failed to update order. Please try again.")
    } finally {
      setLoading(null)
    }
  }

  const statusClass = STATUS_COLOR[order.status] ?? "bg-gray-100 text-gray-800 border-gray-200"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* ── Header ── */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-lg font-semibold">Order Details</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(parseISO(order.created_at), "dd MMM yyyy · h:mm a")}
              </p>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${statusClass}`}>
              {order.status}
            </span>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 space-y-5">

          {/* ── Customer Info ── */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Customer Info
            </h3>
            <div className="space-y-2">
              <InfoRow icon={<User className="h-4 w-4" />} label="Name" value={order.customer_name} />
              <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={order.customer_phone} />
              <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={order.customer_email} />
            </div>
          </section>

          <Separator />

          {/* ── Delivery Info ── */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Delivery Info
            </h3>
            <div className="space-y-2">
              <InfoRow icon={<MapPin className="h-4 w-4" />} label="Address" value={order.delivery_address} />
              <InfoRow icon={<StickyNote className="h-4 w-4" />} label="Notes" value={order.additional_notes} />
              {order.delivery_code && (
                <InfoRow
                  icon={<ShoppingBag className="h-4 w-4" />}
                  label="Delivery Code"
                  value={
                    <span className="font-mono text-base font-bold tracking-widest text-primary">
                      {order.delivery_code}
                    </span>
                  }
                />
              )}
            </div>
          </section>

          <Separator />

          {/* ── Order Summary ── */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Order Summary
            </h3>
            {items.length > 0 ? (
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium flex-shrink-0">
                        {item.quantity ?? 1}
                      </span>
                      <span>{item.product_name}</span>
                    </div>
                    <span className="font-medium tabular-nums">
                      ${(Number(item.price) * (item.quantity ?? 1)).toFixed(2)}
                    </span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex items-center justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-base">${Number(order.total_amount).toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No items recorded.</p>
            )}
          </section>

          <Separator />

          {/* ── Status Section ── */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Status
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current status</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${statusClass}`}>
                  {order.status}
                </span>
              </div>
              {order.confirmed_at && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Confirmed at</span>
                  <span>{format(parseISO(order.confirmed_at), "dd MMM yyyy · h:mm a")}</span>
                </div>
              )}
            </div>
          </section>

          {/* ── QR Code Panel ── */}
          {showQR && confirmUrl && (
            <section className="bg-muted/40 rounded-xl p-4 text-center space-y-3 border">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium">Scan to confirm order</p>
                <button onClick={() => setShowQR(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex justify-center">
                <div className="bg-white p-3 rounded-lg shadow-sm inline-block">
                  <QRCodeSVG
                    value={confirmUrl}
                    size={180}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground break-all">{confirmUrl}</p>
              {order.delivery_code && (
                <p className="text-xs text-muted-foreground">
                  Fallback code: <span className="font-mono font-bold text-foreground">{order.delivery_code}</span>
                </p>
              )}
            </section>
          )}

          {/* ── Action Buttons ── */}
          {!isCompleted && !isCancelled && (
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-transparent"
                onClick={handleShowQR}
                disabled={loading === "qr"}
              >
                {loading === "qr" ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <QrCode className="h-4 w-4 mr-2" />
                )}
                {showQR ? "Refresh QR" : "Show QR Code"}
              </Button>

              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={handleMarkComplete}
                disabled={loading === "complete"}
              >
                {loading === "complete" ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Mark as Completed
              </Button>
            </div>
          )}

          {isCompleted && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>This order has been confirmed and completed.</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Small helper row ────────────────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode | null | undefined
}) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="text-muted-foreground mt-0.5 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-muted-foreground">{label}:</span>{" "}
        <span className="font-medium break-words">{value}</span>
      </div>
    </div>
  )
}
