"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sparkles, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { type LayoutStyle } from "@/lib/layouts"
import { STOREFRONT_FONTS } from "@/lib/storefront-fonts"

interface Business {
  id: string
  business_name: string
  business_type: string
  slug: string
  phone: string | null
  email: string | null
  address: string | null
  description: string | null
  theme_color: string
  whatsapp_number: string | null
  instagram_handle: string | null
  layout_style?: LayoutStyle
  accent_color?: string | null
  dark_mode_enabled?: boolean
  font_family?: string | null
}

interface SettingsContentProps {
  business: Business
}

export function SettingsContent({ business }: SettingsContentProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    businessName: business.business_name,
    phone: business.phone || "",
    email: business.email || "",
    address: business.address || "",
    description: business.description || "",
    themeColor: business.theme_color,
    accentColor: business.accent_color || business.theme_color,
    whatsappNumber: business.whatsapp_number || "",
    instagramHandle: business.instagram_handle || "",
    layoutStyle: business.layout_style || "classic-card" as LayoutStyle,
    darkModeEnabled: business.dark_mode_enabled || false,
    fontFamily: business.font_family || "inter",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      const supabase = getSupabaseClient()

      const { error: updateError } = await supabase
        .from("businesses")
        .update({
          business_name: formData.businessName,
          phone: formData.phone || null,
          email: formData.email || null,
          address: formData.address || null,
          description: formData.description || null,
          theme_color: formData.themeColor,
          accent_color: formData.accentColor,
          layout_style: formData.layoutStyle,
          dark_mode_enabled: formData.darkModeEnabled,
          font_family: formData.fontFamily,
          whatsapp_number: formData.whatsappNumber || null,
          instagram_handle: formData.instagramHandle || null,
        })
        .eq("id", business.id)

      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setError(err.message || "Failed to update settings")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Zentry
            </span>
          </div>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Business Settings</h1>
          <p className="text-muted-foreground">Update your business information and social media links</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="bg-green-50 text-green-900 border-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>Settings updated successfully! Redirecting...</AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Storefront Information</CardTitle>
              <CardDescription>
                Public business details shown on your storefront. Your personal profile lives under My
                Account → Settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={loading}
                  rows={3}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card>
            <CardHeader>
              <CardTitle>Social Media Integration</CardTitle>
              <CardDescription>Connect your social media accounts to enable direct ordering</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">Include country code (e.g. +234 for Nigeria)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram Handle</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">@</span>
                  <Input
                    id="instagram"
                    placeholder="yourbusiness"
                    value={formData.instagramHandle}
                    onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
                    disabled={loading}
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how your business page looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                Your storefront's layout and sections are now customized from{" "}
                <Link href="/dashboard/design" className="font-medium text-primary hover:underline">
                  Design
                </Link>{" "}
                — add, remove, and reorder sections there. The settings below still control your brand colors and
                font everywhere on your page.
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="themeColor">Theme Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="themeColor"
                      type="color"
                      value={formData.themeColor}
                      onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                      disabled={loading}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={formData.themeColor}
                      onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                      disabled={loading}
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                      disabled={loading}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={formData.accentColor}
                      onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                      disabled={loading}
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fontFamily">Storefront Font</Label>
                  <select
                    id="fontFamily"
                    value={formData.fontFamily}
                    onChange={(e) => setFormData({ ...formData, fontFamily: e.target.value })}
                    disabled={loading}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {STOREFRONT_FONTS.map((font) => (
                      <option key={font.id} value={font.id}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">Applied across your whole storefront.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.darkModeEnabled}
                    onChange={(e) => setFormData({ ...formData, darkModeEnabled: e.target.checked })}
                    disabled={loading}
                    className="w-4 h-4"
                  />
                  Enable dark mode for your business page
                </Label>
                <p className="text-xs text-muted-foreground ml-6">Apply a dark theme to your public business page</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Link href="/dashboard">
              <Button type="button" variant="outline" disabled={loading} className="bg-transparent">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
