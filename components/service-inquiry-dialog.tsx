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
  DialogFooter,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"

interface ServiceInquiryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessId: string
  businessName: string
  serviceId?: string | null
  serviceName?: string | null
  whatsappNumber: string | null
  instagramHandle: string | null
}

export function ServiceInquiryDialog({
  open,
  onOpenChange,
  businessId,
  businessName,
  serviceId = null,
  serviceName = null,
  whatsappNumber,
  instagramHandle,
}: ServiceInquiryDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    message: "",
    preferredDate: "",
    location: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = getSupabaseClient()

      // Get customer's WhatsApp number
      const customerWhatsApp = formData.whatsapp.replace(/[^0-9]/g, "")

      const now = new Date()
      const pad2 = (n: number) => String(n).padStart(2, "0")
      const formatDateLocal = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
      const formatTimeLocal = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`

      // Attempt a best-effort parse; if we can't, default to "now" and store the original text in notes.
      let parsedDate: Date | null = null
      if (formData.preferredDate.trim()) {
        const raw = formData.preferredDate.trim()
        const lower = raw.toLowerCase()
        if (lower.includes("tomorrow")) {
          const tomorrow = new Date(now)
          tomorrow.setDate(now.getDate() + 1)

          // Try to extract a time like "3pm" / "3:30pm" / "14:30".
          const timeMatch = raw.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
          if (timeMatch) {
            let h = Number(timeMatch[1])
            const m = timeMatch[2] ? Number(timeMatch[2]) : 0
            const ampm = timeMatch[3]?.toLowerCase()
            if (ampm === "pm" && h < 12) h += 12
            if (ampm === "am" && h === 12) h = 0
            tomorrow.setHours(h, m, 0, 0)
          }
          parsedDate = tomorrow
        } else {
          const d = new Date(raw)
          if (!Number.isNaN(d.getTime())) parsedDate = d
        }
      }

      const bookingDate = formatDateLocal(parsedDate ?? now)
      const bookingTime = formatTimeLocal(parsedDate ?? now)

      const notesParts: string[] = []
      if (formData.preferredDate) notesParts.push(`Preferred: ${formData.preferredDate}`)
      if (serviceName) notesParts.push(`Service: ${serviceName}`)
      if (formData.location) notesParts.push(`Location: ${formData.location}`)
      if (formData.message) notesParts.push(`Message: ${formData.message}`)
      const notes = notesParts.length ? notesParts.join("\n") : null

      // Create booking/inquiry record in database
      const { error: insertError } = await supabase.from("bookings").insert({
        business_id: businessId,
        customer_name: formData.name,
        customer_phone: customerWhatsApp,
        service_id: serviceId,
        booking_date: bookingDate,
        booking_time: bookingTime,
        status: "inquiry",
        notes,
      })

      if (insertError) throw insertError

      setSuccess(true)
      setTimeout(() => {
        onOpenChange(false)
        setSuccess(false)
        setFormData({ name: "", whatsapp: "", message: "", preferredDate: "", location: "" })
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Failed to send inquiry")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {whatsappNumber ? "Send Inquiry" : "Contact"} {businessName}
          </DialogTitle>
          <DialogDescription>
            {whatsappNumber
              ? "Fill in your details and send an inquiry directly to the business owner"
              : "Get in touch with the business owner"}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Inquiry Sent Successfully!</h3>
            <p className="text-sm text-muted-foreground">
              The business owner has been notified. They will contact you shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">
                Your Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">
                WhatsApp Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="whatsapp"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">Include country code</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Delivery/Pickup Location (Optional)</Label>
              <Textarea
                id="location"
                placeholder="Building, Floor, Room/Door, Apt name..."
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                disabled={loading}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredDate">Preferred Date/Time (Optional)</Label>
              <Input
                id="preferredDate"
                type="text"
                placeholder="Tomorrow 3PM or any preferred time"
                value={formData.preferredDate}
                onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Tell the business owner about your needs..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                disabled={loading}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="bg-transparent"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send Inquiry"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

