"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, Bell, CheckCheck, PackageX, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MobileDashboardNav } from "@/components/dashboard/dashboard-sidebar"

export interface NotificationRow {
  id: string
  type: string
  title: string
  body: string
  read_at: string | null
  created_at: string
}

interface NotificationsContentProps {
  notifications: NotificationRow[]
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

export function NotificationsContent({ notifications, onMarkRead, onMarkAllRead }: NotificationsContentProps) {
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read_at).length, [notifications])

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <MobileDashboardNav />
          <div>
            <Link href="/dashboard" className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
            </Link>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={onMarkAllRead} className="shrink-0">
            <CheckCheck className="mr-2 h-4 w-4" /> Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Bell className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              No notifications yet — you'll see low-stock and out-of-stock alerts here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={!n.read_at ? "border-primary/30 bg-primary/[0.03]" : undefined}
              onClick={() => !n.read_at && onMarkRead(n.id)}
            >
              <CardContent className="flex items-start gap-3 p-4">
                <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${n.type === "out_of_stock" ? "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400" : "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"}`}>
                  {n.type === "out_of_stock" ? <PackageX className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{n.title}</p>
                    {!n.read_at && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.created_at)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
