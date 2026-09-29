"use client"

import type React from "react"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, AlertCircle } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { AuthShell } from "@/components/auth/auth-shell"
import { OAuthButtons } from "@/components/auth/oauth-buttons"

function safeNextPath(raw: string | null): string | null {
  if (!raw) return null
  if (!raw.startsWith("/") || raw.startsWith("//")) return null
  return raw
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = safeNextPath(searchParams.get("next"))

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      let supabase
      try {
        supabase = getSupabaseClient()
      } catch (configError: any) {
        console.error("Supabase configuration error:", configError)
        setError(
          configError.message ||
            "Configuration error: Please check your Supabase environment variables in .env.local",
        )
        setLoading(false)
        return
      }

      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError) {
        if (loginError.message?.includes("Invalid API key") || loginError.message?.includes("api key")) {
          setError(
            "Invalid API key. Please check your NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local. " +
              "Make sure you're using the 'anon' or 'public' key from your Supabase project settings.",
          )
        } else if (loginError.message?.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please try again.")
        } else {
          setError(loginError.message || "An error occurred during login")
        }
        setLoading(false)
        return
      }

      if (data.user && data.session) {
        // Prefer explicit return path (e.g. back to storefront after "sign in to order")
        window.location.href = nextPath || "/dashboard"
      } else {
        setError("Login failed. Please try again.")
        setLoading(false)
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "An unexpected error occurred during login")
      setLoading(false)
    }
  }

  const signUpHref = nextPath ? `/auth/sign-up?next=${encodeURIComponent(nextPath)}` : "/auth/sign-up"
  const forgotPasswordHref = nextPath
    ? `/auth/forgot-password?next=${encodeURIComponent(nextPath)}`
    : "/auth/forgot-password"

  // No `intent` param here — sign-in is shared by customers and business
  // owners, and a first-time OAuth user should fall through to the existing
  // 'personal' profile default (see auth/callback).
  const oauthRedirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`
      : "/auth/callback"

  return (
    <AuthShell
      title="Welcome back"
      subtitle={nextPath ? "Sign in to continue your order or booking" : "Sign in to your Zentry account"}
      rightHeadline="Everything you need to run your storefront."
      rightSubcopy="Orders, inventory, and customers — pick up right where you left off."
    >
      <OAuthButtons mode="sign-in" redirectTo={oauthRedirectTo} onError={(message) => setError(message || null)} />

      <div className="my-6 flex items-center gap-4 text-xs font-medium text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        or
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href={forgotPasswordHref} className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </Button>

        <p className="text-sm text-center text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href={signUpHref} className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground text-sm">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
