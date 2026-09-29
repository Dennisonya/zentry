"use client"

import type React from "react"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Mail } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { AuthShell } from "@/components/auth/auth-shell"

function ForgotPasswordForm() {
  const searchParams = useSearchParams()
  const nextPath = searchParams.get("next")

  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const loginHref = nextPath ? `/auth/login?next=${encodeURIComponent(nextPath)}` : "/auth/login"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = getSupabaseClient()
      const redirectTo = `${window.location.origin}/auth/reset-password`
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

      if (resetError) throw resetError

      setSent(true)
    } catch (err: any) {
      setError(err.message || "Something went wrong sending the reset link")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="We've sent a password reset link to your inbox."
        rightHeadline="Almost there."
        rightSubcopy="Click the link we sent to set a new password and get back into your account."
      >
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <div className="w-full space-y-2 rounded-lg bg-muted p-4 text-left">
            <p className="text-sm text-muted-foreground">
              Click the link in the email to choose a new password. If it doesn&apos;t show up in a few
              minutes, check your spam folder.
            </p>
          </div>
          <Link href={loginHref} className="w-full">
            <Button variant="outline" className="w-full bg-transparent">
              Back to sign in
            </Button>
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
      rightHeadline="Forgetting a password happens to the best of us."
      rightSubcopy="We'll get you a fresh link so you can pick a new one and get right back to business."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending link..." : "Send reset link"}
        </Button>

        <p className="text-sm text-center text-muted-foreground">
          Remembered your password?{" "}
          <Link href={loginHref} className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground text-sm">Loading...</div>}>
      <ForgotPasswordForm />
    </Suspense>
  )
}
