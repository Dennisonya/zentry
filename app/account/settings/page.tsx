"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabase"
import { DashboardSubpageLayout } from "@/components/dashboard-subpage-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Store } from "lucide-react"

type Profile = {
  id: string
  full_name: string | null
  phone: string | null
  address: string | null
  default_view: string | null
}

export default function AccountSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [addingBusiness, setAddingBusiness] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [hasBusiness, setHasBusiness] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({ fullName: "", phone: "", address: "" })

  useEffect(() => {
    const run = async () => {
      const supabase = getSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.replace("/auth/login?next=/account/settings")
        return
      }
      setUser(user)

      const [{ data: profile }, { data: biz }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("businesses").select("id").eq("user_id", user.id).maybeSingle(),
      ])

      const p = profile as Profile | null
      setForm({
        fullName: p?.full_name || "",
        phone: p?.phone || "",
        address: p?.address || "",
      })
      setHasBusiness(!!biz)
      setLoading(false)
    }
    run()
  }, [router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError(null)
    setSuccess(false)
    setSaving(true)
    try {
      const supabase = getSupabaseClient()
      const { error: upErr } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: form.fullName.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        updated_at: new Date().toISOString(),
      })
      if (upErr) throw upErr
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

  const handleAddBusiness = async () => {
    if (!user) return
    setAddingBusiness(true)
    setError(null)
    try {
      const supabase = getSupabaseClient()
      // Preference only — does not remove personal access
      await supabase.from("profiles").upsert({
        id: user.id,
        default_view: "business",
        updated_at: new Date().toISOString(),
      })
      router.push("/onboarding")
    } catch (err: any) {
      setError(err.message || "Could not start business setup")
      setAddingBusiness(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading settings...</div>
    )
  }
  if (!user) return null

  return (
    <DashboardSubpageLayout
      title="Account settings"
      description="Your personal profile. You can also add a business without losing marketplace access."
      backHref="/account"
      backLabel="Back to Account"
    >
      <div className="space-y-6 max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Used to prefill orders and bookings when you shop</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>Profile saved.</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  rows={3}
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  disabled={saving}
                />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business</CardTitle>
            <CardDescription>
              Adding a business creates a storefront linked to this same login. Your personal account stays available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasBusiness ? (
              <Button type="button" variant="outline" className="bg-transparent" onClick={() => router.push("/dashboard")}>
                <Store className="mr-2 h-4 w-4" />
                Go to Business Dashboard
              </Button>
            ) : (
              <Button type="button" onClick={handleAddBusiness} disabled={addingBusiness}>
                <Store className="mr-2 h-4 w-4" />
                {addingBusiness ? "Opening setup..." : "Add a Business"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardSubpageLayout>
  )
}
