"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatDistanceToNow, parseISO } from "date-fns"
import { Bell, CalendarCheck, CheckCircle2, Package, XCircle } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { AccountShell } from "@/components/account/account-shell"
import { MobileAccountNav } from "@/components/account/account-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

type CustomerNotification = {
  id: string
  type: string
  title: string
  body: string
  order_id: string | null
  booking_id: string | null
  read_at: string | null
  created_at: string
}

function iconFor(type: string) {
  if (type.endsWith("cancelled")) return { Icon: XCircle, className: "bg-red-100 text-red-700" }
  if (type.endsWith("completed") || type.endsWith("confirmed")) return { Icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700" }
  if (type.startsWith("booking")) return { Icon: CalendarCheck, className: "bg-sky-100 text-sky-700" }
  return { Icon: Package, className: "bg-purple-100 text-purple-700" }
}

export default function NotificationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [items, setItems] = useState<CustomerNotification[]>([])

  useEffect(() => {
    ;(async () => {
      const supabase = getSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.replace("/auth/login?next=/account/notifications")
        return
      }
      setUserId(user.id)
      const { data, error: loadError } = await supabase
        .from("customer_notifications")
        .select("id, type, title, body, order_id, booking_id, read_at, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100)
      if (loadError) setError("We couldn't load your notifications. Please refresh to try again.")
      setItems((data as CustomerNotification[]) || [])
      setLoading(false)
    })()
  }, [router])

  const unreadCount = items.filter((n) => !n.read_at).length

  const markRead = async (ids: string[]) => {
    if (!userId) return
    ids = ids.filter((id) => items.some((n) => n.id === id && !n.read_at))
    if (ids.length === 0) return
    const now = new Date().toISOString()
    const previous = items
    setItems((current) => current.map((n) => (ids.includes(n.id) ? { ...n, read_at: n.read_at ?? now } : n)))
    const { error: updateError } = await getSupabaseClient()
      .from("customer_notifications")
      .update({ read_at: now } as never)
      .eq("user_id", userId)
      .in("id", ids)
    if (updateError) {
      setItems(previous)
      toast.error("Couldn't mark notifications as read.")
      return
    }
    window.dispatchEvent(new CustomEvent("zentry:notifications-read", { detail: ids.length }))
  }

  return (
    <AccountShell>
      <main className="mx-auto max-w-4xl px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <MobileAccountNav />
            <div>
              <p className="text-sm text-muted-foreground">Updates on your orders and bookings</p>
              <h1 className="text-3xl font-bold">Notifications</h1>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => markRead(items.filter((n) => !n.read_at).map((n) => n.id))}
            >
              Mark all read
            </Button>
          )}
        </header>

        {loading ? (
          <p className="text-muted-foreground">Loading notifications...</p>
        ) : error ? (
          <Card className="border-destructive/40">
            <CardContent className="p-5 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-20 text-center">
              <div className="rounded-2xl bg-purple-100 p-4 text-purple-700">
                <Bell className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-xl font-semibold">You&apos;re all caught up</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                When a business confirms, completes or changes one of your orders or bookings, you&apos;ll see it here.
              </p>
              <Button asChild className="mt-5 rounded-xl">
                <Link href="/marketplace">Explore marketplace</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((n) => {
              const { Icon, className } = iconFor(n.type)
              const href = n.booking_id ? "/account/services" : "/account/orders"
              return (
                <Link key={n.id} href={href} onClick={() => !n.read_at && markRead([n.id])} className="block">
                  <Card className={`shadow-sm transition-colors hover:bg-muted/40 ${n.read_at ? "" : "border-purple-200 bg-purple-50/40"}`}>
                    <CardContent className="flex gap-4 p-5">
                      <div className={`h-fit rounded-2xl p-3 ${className}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-semibold">{n.title}</p>
                          {!n.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-purple-600" aria-label="Unread" />}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {formatDistanceToNow(parseISO(n.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </AccountShell>
  )
}
