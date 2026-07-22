"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"
import {
  generateOTP,
  generateDeliveryCode,
  otpExpiresAt,
  isOTPValid,
  maskName,
} from "@/lib/otp"
import { format, parseISO } from "date-fns"
import { CheckCircle2, Package, Loader2, ShieldCheck, Send, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"


interface OrderItem {
  product_name: string
  price: number
  quantity: number
}

interface ConfirmOrder {
  id: string
  customer_name: string
  customer_phone: string | null
  total_amount: number
  status: string
  order_items: OrderItem[]
  created_at: string
  confirmation_token: string
  confirmed_at: string | null
  otp_code: string | null
  otp_expires_at: string | null
  delivery_code: string | null
  delivery_address: string | null
  additional_notes: string | null
}
export const dynamic = 'force-dynamic'
export default function ConfirmOrderPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [order, setOrder] = useState<ConfirmOrder | null>(null)
  const [pageState, setPageState] = useState<
    "loading" | "not_found" | "already_done" | "ready" | "otp_sent" | "success" | "error"
  >("loading")
  const [errorMsg, setErrorMsg] = useState("")

  const [otpInput, setOtpInput] = useState("")
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [otpError, setOtpError] = useState("")
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── FIX: Store OTP + expiry in refs, NOT read back from DB.
  // The original bug: handleVerifyOTP re-fetched otp_expires_at from Supabase.
  // If the column didn't exist yet (migration not run) or the select returned
  // null for any reason, isOTPValid(null) → false → "expired" immediately.
  // Solution: write the values into refs when we generate them in handleSendOTP
  // and use refs as the single source of truth during verification.
  const sessionOtp = useRef<string | null>(null)
  const sessionOtpExpiry = useRef<string | null>(null)

  useEffect(() => {
    if (!token) { setPageState("not_found"); return }
    const fetchOrder = async () => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("confirmation_token", token)
        .single()
      if (error || !data) { setPageState("not_found"); return }
      const fetched = data as ConfirmOrder
      setOrder(fetched)
      if (fetched.status === "completed" || fetched.confirmed_at) {
        setPageState("already_done")
      } else if (fetched.status === "cancelled") {
        setErrorMsg("This order has been cancelled.")
        setPageState("error")
      } else {
        setPageState("ready")
      }
    }
    fetchOrder()
  }, [token])

  const startCountdown = (seconds: number) => {
    setCountdown(seconds)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const handleSendOTP = async () => {
    if (!order) return
    setSendingOtp(true)
    setOtpError("")
    try {
      const supabase = getSupabaseClient()
      const otp = generateOTP()
      const deliveryCode = order.delivery_code ?? generateDeliveryCode()
      const expiresAt = otpExpiresAt(5)

      const { error } = await supabase
        .from("orders")
        .update({ otp_code: otp, otp_expires_at: expiresAt, delivery_code: deliveryCode })
        .eq("id", order.id)
      if (error) throw error

      // ✅ KEY FIX: persist to refs immediately after generation.
      // These refs are the ground truth used in handleVerifyOTP.
      sessionOtp.current = otp
      sessionOtpExpiry.current = expiresAt

      setOrder((prev) =>
        prev ? { ...prev, otp_code: otp, otp_expires_at: expiresAt, delivery_code: deliveryCode } : prev
      )

      // In production: replace with WhatsApp / SMS integration
      console.log(`[Zentry OTP] Order ${order.id} — OTP: ${otp} | Delivery code: ${deliveryCode}`)

      setPageState("otp_sent")
      startCountdown(300)
    } catch {
      setOtpError("Failed to generate code. Please try again.")
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!order) return
    setOtpError("")
    setVerifyingOtp(true)
    try {
      const supabase = getSupabaseClient()

      // ── Step 1: DB re-fetch ONLY to prevent replay attacks (already confirmed / cancelled).
      // We intentionally do NOT read otp_code / otp_expires_at from the DB here —
      // that was the original bug. Those columns may return null if the migration
      // hasn't been applied, causing a false "expired" error.
      const { data: fresh, error: fetchErr } = await supabase
        .from("orders")
        .select("status, confirmed_at")
        .eq("id", order.id)
        .single()

      if (fetchErr || !fresh) throw new Error("Could not reach the server. Please try again.")

      if (fresh.status === "completed" || fresh.confirmed_at) {
        setOtpError("This order has already been confirmed.")
        return
      }
      if (fresh.status === "cancelled") {
        setOtpError("This order has been cancelled.")
        return
      }

      // ── Step 2: Validate against session refs (set during handleSendOTP).
      if (!sessionOtp.current || !sessionOtpExpiry.current) {
        setOtpError('No active code found. Please click "Send Code" again.')
        return
      }

      if (!isOTPValid(sessionOtpExpiry.current)) {
        setOtpError("This code has expired. Please request a new one.")
        return
      }

      if (sessionOtp.current !== otpInput.trim()) {
        setOtpError("Incorrect code. Please check and try again.")
        return
      }

      // ── Step 3: All checks passed → mark as completed.
      const now = new Date().toISOString()
      const { error: updateErr } = await supabase
        .from("orders")
        .update({ status: "completed", confirmed_at: now })
        .eq("id", order.id)
      if (updateErr) throw updateErr

      // Clear refs so the code cannot be reused
      sessionOtp.current = null
      sessionOtpExpiry.current = null

      setOrder((prev) => (prev ? { ...prev, status: "completed", confirmed_at: now } : prev))
      setPageState("success")
    } catch (e: any) {
      setOtpError(e.message ?? "Verification failed. Please try again.")
    } finally {
      setVerifyingOtp(false)
    }
  }

  const items: OrderItem[] = order ? (Array.isArray(order.order_items) ? order.order_items : []) : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {pageState === "loading" && (
          <div className="text-center py-16">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Looking up your order…</p>
          </div>
        )}

        {pageState === "not_found" && (
          <Card>
            <div className="text-center py-8">
              <IconCircle color="red"><AlertCircle className="h-7 w-7 text-red-600" /></IconCircle>
              <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
              <p className="text-sm text-muted-foreground">
                This link may be invalid or expired. Please contact the business directly.
              </p>
            </div>
          </Card>
        )}

        {pageState === "error" && (
          <Card>
            <div className="text-center py-8">
              <IconCircle color="red"><AlertCircle className="h-7 w-7 text-red-600" /></IconCircle>
              <h2 className="text-xl font-semibold mb-2">Cannot Confirm Order</h2>
              <p className="text-sm text-muted-foreground">{errorMsg}</p>
            </div>
          </Card>
        )}

        {pageState === "already_done" && order && (
          <Card>
            <div className="text-center py-6">
              <IconCircle color="green"><CheckCircle2 className="h-8 w-8 text-green-600" /></IconCircle>
              <h2 className="text-xl font-semibold mb-1">Already Confirmed</h2>
              {order.confirmed_at && (
                <p className="text-sm text-muted-foreground">
                  Confirmed on {format(parseISO(order.confirmed_at), "dd MMM yyyy · h:mm a")}
                </p>
              )}
              <OrderSummary order={order} items={items} />
            </div>
          </Card>
        )}

        {(pageState === "ready" || pageState === "otp_sent") && order && (
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Confirm Your Order</h1>
                <p className="text-sm text-muted-foreground">
                  Hi {maskName(order.customer_name)}, review and confirm below.
                </p>
              </div>
            </div>

            <OrderSummary order={order} items={items} />
            <div className="border-t my-5" />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0" />
                <p className="text-sm font-medium">Confirm with a one-time code</p>
              </div>

              {pageState === "ready" && (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click below to generate a 6-digit confirmation code.
                  </p>
                  <Button className="w-full" onClick={handleSendOTP} disabled={sendingOtp}>
                    {sendingOtp ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    {sendingOtp ? "Generating…" : "Send Code"}
                  </Button>
                </div>
              )}

              {pageState === "otp_sent" && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    A 6-digit code has been generated
                    {order.customer_phone ? ` for ${order.customer_phone}` : ""}.
                    Enter it below to confirm your order.
                  </p>

                  {countdown > 0 && (
                    <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 tabular-nums font-medium">
                      Expires in {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}
                    </div>
                  )}
                  {countdown === 0 && (
                    <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                      Code expired.{" "}
                      <button onClick={handleSendOTP} className="underline font-medium">Resend</button>
                    </div>
                  )}

                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={otpInput}
                    onChange={(e) => { setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6)); setOtpError("") }}
                    className="text-center text-2xl font-mono tracking-[0.4em] h-14"
                  />

                  {otpError && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{otpError}</span>
                    </div>
                  )}

                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleVerifyOTP}
                    disabled={verifyingOtp || otpInput.length !== 6}
                  >
                    {verifyingOtp ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                    {verifyingOtp ? "Verifying…" : "Confirm Order"}
                  </Button>

                  <button
                    onClick={handleSendOTP}
                    disabled={sendingOtp || countdown > 240}
                    className="w-full text-xs text-muted-foreground underline underline-offset-2 disabled:opacity-40 disabled:no-underline"
                  >
                    Didn't get a code? Resend
                  </button>
                </div>
              )}
            </div>
          </Card>
        )}

        {pageState === "success" && order && (
          <Card>
            <div className="text-center py-4">
              <IconCircle color="green" large>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </IconCircle>
              <h2 className="text-2xl font-bold mb-1">Order Confirmed! 🎉</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Thank you, {maskName(order.customer_name)}. Your order has been successfully confirmed.
              </p>
              {order.delivery_code && (
                <div className="bg-muted/50 border rounded-xl p-4 mb-4">
                  <p className="text-xs text-muted-foreground mb-1">Delivery code</p>
                  <p className="text-3xl font-mono font-bold tracking-widest text-primary">{order.delivery_code}</p>
                  <p className="text-xs text-muted-foreground mt-1">Share this with your delivery agent</p>
                </div>
              )}
              <OrderSummary order={order} items={items} />
            </div>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by{" "}
          <span className="font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Zentry
          </span>
        </p>
      </div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
      {children}
    </div>
  )
}

function IconCircle({ children, color, large }: { children: React.ReactNode; color: "red" | "green"; large?: boolean }) {
  const size = large ? "h-16 w-16" : "h-14 w-14"
  const bg = color === "green" ? "bg-green-100" : "bg-red-100"
  return (
    <div className={`${size} rounded-full ${bg} flex items-center justify-center mx-auto mb-4`}>
      {children}
    </div>
  )
}

function OrderSummary({ order, items }: { order: ConfirmOrder; items: OrderItem[] }) {
  return (
    <div className="bg-muted/40 rounded-xl p-4 mt-4 space-y-2 text-sm">
      {items.length > 0 && (
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between">
              <span className="text-muted-foreground">
                {item.product_name}
                {item.quantity > 1 && <span className="ml-1 text-xs">×{item.quantity}</span>}
              </span>
              <span className="font-medium tabular-nums">
                ${(Number(item.price) * (item.quantity ?? 1)).toFixed(2)}
              </span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total</span>
            <span>${Number(order.total_amount).toFixed(2)}</span>
          </div>
        </div>
      )}
      <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t">
        <span>Placed</span>
        <span>{format(parseISO(order.created_at), "dd MMM yyyy · h:mm a")}</span>
      </div>
    </div>
  )
}
