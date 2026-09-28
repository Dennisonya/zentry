"use client"

import { Suspense, useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"
import { maskName } from "@/lib/otp"
import { format, parseISO } from "date-fns"
import { CheckCircle2, Package, Loader2, ShieldCheck, Send, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"


interface OrderItem {
  product_name: string
  price: number
  quantity: number
}

// Shape returned by the get_order_by_confirmation_token RPC (scripts/020).
// delivery_code is only present once the order is confirmed.
interface ConfirmOrder {
  id: string
  customer_name: string
  customer_phone: string | null
  total_amount: number
  status: string
  order_items: OrderItem[]
  created_at: string
  confirmed_at: string | null
  delivery_code: string | null
}

// Postgres RAISE messages come back as error.message; show them as-is.
const rpcErrorMessage = (error: { message?: string } | null, fallback: string) =>
  error?.message || fallback

// The Edge Function answers errors as { error: "..." } written for customers.
async function functionErrorMessage(error: any, fallback: string): Promise<string> {
  try {
    const body = await error?.context?.json()
    if (typeof body?.error === "string") return body.error
  } catch {}
  return fallback
}

export default function ConfirmOrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-4"><LoadingState /></div>}>
      <ConfirmOrderContent />
    </Suspense>
  )
}

function ConfirmOrderContent() {
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
  const [sentTo, setSentTo] = useState("")
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // The order is read, the code issued, and the code checked entirely by
  // SECURITY DEFINER functions (scripts/016 + 020). The browser never writes
  // to the orders table and never sees the stored code.
  useEffect(() => {
    if (!token) { setPageState("not_found"); return }
    const fetchOrder = async () => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.rpc("get_order_by_confirmation_token", { p_token: token } as unknown as never)
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
    if (!order || !token) return
    setSendingOtp(true)
    setOtpError("")
    try {
      // The Edge Function texts the code to the phone on the order; the
      // browser never sees it (supabase/functions/send-order-confirmation-code).
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.functions.invoke("send-order-confirmation-code", {
        body: { token },
      })
      if (error || !data) throw new Error(await functionErrorMessage(error, "Failed to send the code. Please try again."))
      const { sent_to, expires_in_seconds } = data as { sent_to: string; expires_in_seconds: number }

      setSentTo(sent_to)
      setOtpInput("")
      setPageState("otp_sent")
      startCountdown(expires_in_seconds ?? 300)
    } catch (e: any) {
      setOtpError(e.message ?? "Failed to send the code. Please try again.")
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!order || !token) return
    setOtpError("")
    setVerifyingOtp(true)
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.rpc("verify_order_confirmation_code", {
        p_token: token,
        p_code: otpInput.trim(),
      } as unknown as never)
      if (error || !data) throw new Error(rpcErrorMessage(error, "Verification failed. Please try again."))

      const result = data as
        | { ok: true; confirmed_at: string; delivery_code: string | null }
        | { ok: false; attempts_left: number }

      if (!result.ok) {
        setOtpError(
          result.attempts_left > 0
            ? `Incorrect code. ${result.attempts_left} ${result.attempts_left === 1 ? "attempt" : "attempts"} left.`
            : "Incorrect code. Please request a new one."
        )
        return
      }

      setOrder((prev) =>
        prev
          ? { ...prev, status: "completed", confirmed_at: result.confirmed_at, delivery_code: result.delivery_code }
          : prev
      )
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

        {pageState === "loading" && <LoadingState />}

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
                    We&apos;ll send a 6-digit code to the phone number on this order.
                  </p>
                  <Button className="w-full" onClick={handleSendOTP} disabled={sendingOtp}>
                    {sendingOtp ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    {sendingOtp ? "Sending…" : "Text me a code"}
                  </Button>
                  {otpError && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{otpError}</span>
                    </div>
                  )}
                </div>
              )}

              {pageState === "otp_sent" && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    We texted a 6-digit code
                    {sentTo ? ` to ${sentTo}` : ""}.
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

                  {/* The database allows one code per minute, matching countdown > 240. */}
                  <button
                    onClick={handleSendOTP}
                    disabled={sendingOtp || countdown > 240}
                    className="w-full text-xs text-muted-foreground underline underline-offset-2 disabled:opacity-40 disabled:no-underline"
                  >
                    Didn&apos;t get a code? Resend
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

function LoadingState() {
  return (
    <div className="text-center py-16">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
      <p className="text-muted-foreground">Looking up your order…</p>
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
