"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatDistanceToNow } from "date-fns"
import { CheckCircle, XCircle, Clock, MessageCircle, CheckCheck } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"

interface Booking {
  id: string
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  service_id: string | null
  booking_date: string | null
  booking_time: string | null
  notes: string | null
  status: string
  created_at: string
  services?: {
    name: string
    duration_minutes: number | null
    location: string | null
  } | null
}

interface BookingListProps {
  bookings: Booking[]
  businessId: string
  whatsappNumber: string | null
  onRecordsChange?: () => void
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  inquiry:    { label: "New Inquiry",  variant: "secondary" },
  pending:    { label: "Pending",      variant: "secondary" },
  confirmed:  { label: "Confirmed",    variant: "default" },
  rescheduled:{ label: "Rescheduled",  variant: "outline" },
  cancelled:  { label: "Cancelled",    variant: "destructive" },
  completed:  { label: "Completed",    variant: "default" },
}

export function BookingList({ bookings, businessId, whatsappNumber, onRecordsChange }: BookingListProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [newBookingDate, setNewBookingDate] = useState("")
  const [newBookingTime, setNewBookingTime] = useState("")
  const [rescheduleNote, setRescheduleNote] = useState("")

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No bookings yet. Once customers book your services they'll appear here.</p>
      </div>
    )
  }

  const updateStatus = async (bookingId: string, newStatus: string) => {
    setLoading(bookingId)
    try {
      const supabase = getSupabaseClient() as any
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId)
      if (error) throw error
      onRecordsChange?.()
      router.refresh()
    } catch (err) {
      console.error("Failed to update booking status:", err)
      alert("Failed to update booking. Please try again.")
    } finally {
      setLoading(null)
    }
  }

  const handleReschedule = async () => {
    if (!selectedBooking || !newBookingDate || !newBookingTime) return
    setLoading(selectedBooking.id)
    try {
      const supabase = getSupabaseClient() as any
      const { error } = await supabase
        .from("bookings")
        .update({
          booking_date: newBookingDate,
          booking_time: newBookingTime,
          status: "rescheduled",
          notes: rescheduleNote || selectedBooking.notes || null,
        })
        .eq("id", selectedBooking.id)
      if (error) throw error

      // Notify customer via WhatsApp if they have a number
      if (selectedBooking.customer_phone) {
        const customerPhone = selectedBooking.customer_phone.replace(/[^0-9]/g, "")
        const serviceName = selectedBooking.services?.name ? ` for *${selectedBooking.services.name}*` : ""
        const message = encodeURIComponent(
          `Hi ${selectedBooking.customer_name}! Your appointment${serviceName} has been rescheduled to *${newBookingDate}* at *${newBookingTime}*.${rescheduleNote ? `\n\nNote: ${rescheduleNote}` : ""}\n\nReply *YES* to confirm the new time, or message us to arrange another time.`
        )
        window.open(`https://wa.me/${customerPhone}?text=${message}`, "_blank")
      }

      setRescheduleOpen(false)
      setSelectedBooking(null)
      setNewBookingDate("")
      setNewBookingTime("")
      setRescheduleNote("")
      onRecordsChange?.()
      router.refresh()
    } catch (err) {
      console.error("Failed to reschedule booking:", err)
      alert("Failed to reschedule. Please try again.")
    } finally {
      setLoading(null)
    }
  }

  const openWhatsApp = (booking: Booking) => {
    const phone = booking.customer_phone?.replace(/[^0-9]/g, "")
    if (!phone) return
    const serviceName = booking.services?.name ? ` for *${booking.services.name}*` : ""
    const when =
      booking.booking_date && booking.booking_time
        ? ` on *${booking.booking_date}* at *${booking.booking_time}*`
        : ""
    const message = encodeURIComponent(
      `Hi ${booking.customer_name}, this is regarding your booking request${serviceName}${when}. `
    )
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank")
  }

  const canApprove = (status: string) => ["inquiry", "pending"].includes(status)
  const canCancel = (status: string) => !["cancelled", "completed"].includes(status)
  const canReschedule = (status: string) => ["pending", "confirmed", "inquiry"].includes(status)
  const canComplete = (status: string) => ["confirmed", "rescheduled"].includes(status)

  return (
    <>
      <div className="space-y-4">
        {bookings.map((booking) => {
          const statusConfig = STATUS_CONFIG[booking.status] || { label: booking.status, variant: "outline" as const }
          const serviceLine = booking.services?.name ? booking.services.name : booking.service_id ? "Service" : null
          const whenLine =
            booking.booking_date && booking.booking_time
              ? `${booking.booking_date} at ${booking.booking_time}`
              : booking.booking_date
                ? booking.booking_date
                : null

          return (
            <div key={booking.id} className="p-4 border rounded-lg space-y-3">
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{booking.customer_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {booking.customer_phone || booking.customer_email || "No contact info"}
                  </p>
                </div>
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              </div>

              {/* Booking details */}
              <div className="text-sm text-muted-foreground space-y-1">
                {serviceLine && (
                  <p>
                    <span className="font-medium text-foreground">Service:</span> {serviceLine}
                  </p>
                )}
                {whenLine && (
                  <p>
                    <span className="font-medium text-foreground">When:</span> {whenLine}
                  </p>
                )}
                {booking.services?.location && (
                  <p>
                    <span className="font-medium text-foreground">Location:</span> {booking.services.location}
                  </p>
                )}
                {booking.services?.duration_minutes != null && (
                  <p>
                    <span className="font-medium text-foreground">Duration:</span> {booking.services.duration_minutes} min
                  </p>
                )}
                {booking.notes && (
                  <p>
                    <span className="font-medium text-foreground">Notes:</span> {booking.notes}
                  </p>
                )}
              </div>

              {/* Footer row */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(booking.created_at))} ago
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Contact via WhatsApp */}
                  {booking.customer_phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openWhatsApp(booking)}
                      className="bg-transparent"
                    >
                      <MessageCircle className="h-3.5 w-3.5 mr-1" />
                      WhatsApp
                    </Button>
                  )}

                  {/* Reschedule */}
                  {canReschedule(booking.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loading === booking.id}
                      className="bg-transparent"
                      onClick={() => {
                        setSelectedBooking(booking)
                        setNewBookingDate(booking.booking_date || "")
                        setNewBookingTime(booking.booking_time || "")
                        setRescheduleNote(booking.notes || "")
                        setRescheduleOpen(true)
                      }}
                    >
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      Reschedule
                    </Button>
                  )}

                  {/* Approve / Confirm */}
                  {canApprove(booking.status) && (
                    <Button
                      size="sm"
                      disabled={loading === booking.id}
                      onClick={() => updateStatus(booking.id, "confirmed")}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Confirm
                    </Button>
                  )}

                  {/* Mark Complete */}
                  {canComplete(booking.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loading === booking.id}
                      onClick={() => updateStatus(booking.id, "completed")}
                      className="bg-transparent"
                    >
                      <CheckCheck className="h-3.5 w-3.5 mr-1" />
                      Complete
                    </Button>
                  )}

                  {/* Cancel */}
                  {canCancel(booking.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loading === booking.id}
                      onClick={() => updateStatus(booking.id, "cancelled")}
                      className="bg-transparent text-destructive hover:text-destructive border-destructive/30 hover:border-destructive"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Propose a new time for {selectedBooking?.customer_name}. They will be notified via WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newBookingDate">
                  New date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="newBookingDate"
                  type="date"
                  value={newBookingDate}
                  onChange={(e) => setNewBookingDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newBookingTime">
                  New time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="newBookingTime"
                  type="time"
                  value={newBookingTime}
                  onChange={(e) => setNewBookingTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rescheduleNote">Note to customer (optional)</Label>
              <Textarea
                id="rescheduleNote"
                placeholder="Any additional information..."
                value={rescheduleNote}
                onChange={(e) => setRescheduleNote(e.target.value)}
                rows={2}
              />
            </div>
            {!selectedBooking?.customer_phone && (
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                This customer has no WhatsApp number on file. Status will be updated but they won't receive a WhatsApp notification.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleOpen(false)} className="bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleReschedule} disabled={!newBookingDate || !newBookingTime || loading !== null}>
              {loading ? "Saving..." : "Reschedule & Notify"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
