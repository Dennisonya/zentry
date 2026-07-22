"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Zap, AlertCircle } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"

type AccountType = "personal" | "business"
type Plan = "basic" | "pro" | "premium"

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [accountType, setAccountType] = useState<AccountType>("personal")
  const [intendedPlan, setIntendedPlan] = useState<Plan>("basic")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingUser, setExistingUser] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setExistingUser(false)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)

    try {
      const supabase = getSupabaseClient()

      // Pre-check for an existing account before hitting Auth. This calls a
      // SECURITY DEFINER Postgres function (see scripts/010) rather than
      // querying profiles directly — RLS only allows reading your own row,
      // and this function returns just a boolean without exposing any data.
      const { data: exists, error: checkError } = await supabase.rpc("email_exists", {
        check_email: email,
      })

      if (checkError) {
        console.error("email_exists check failed:", checkError)
        // Fail open: signUp() is still the source of truth if this errors.
      } else if (exists) {
        setExistingUser(true)
        setError("Looks like you already have an account with this email.")
        setLoading(false)
        return
      }
      // Land on /auth/callback after the verification link is clicked; that
      // page waits for the session then sends the user into the marketplace.
      const emailRedirectTo =
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: {
            account_type: accountType,
            intended_plan: accountType === "business" ? intendedPlan : null,
          },
        },
      })

      if (signUpError) {
        const isExistingUser =
          signUpError.message?.toLowerCase().includes("user already registered") || signUpError.status === 400
        if (isExistingUser) {
          setExistingUser(true)
          setError("Looks like you already have an account with this email.")
          return
        }
        throw signUpError
      }

      if (data.user) {
        router.push("/auth/sign-up-success")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during sign up")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Create your account</CardTitle>
          <CardDescription className="text-center">
            Free to join — shop as a customer, or set up a business storefront.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <p>{error}</p>
                  {existingUser && (
                    <p>
                      Already signed up?{" "}
                      <Link href="/auth/login" className="underline">
                        Go to the login page
                      </Link>
                      .
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Label>Account type</Label>
              <RadioGroup
                value={accountType}
                onValueChange={(v) => setAccountType(v as AccountType)}
                className="grid grid-cols-2 gap-3"
                disabled={loading}
              >
                <label
                  htmlFor="acct-personal"
                  className="flex cursor-pointer items-start gap-2 rounded-lg border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <RadioGroupItem value="personal" id="acct-personal" className="mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Personal</div>
                    <p className="text-xs text-muted-foreground">Browse, order, and book from businesses</p>
                  </div>
                </label>
                <label
                  htmlFor="acct-business"
                  className="flex cursor-pointer items-start gap-2 rounded-lg border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <RadioGroupItem value="business" id="acct-business" className="mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Business</div>
                    <p className="text-xs text-muted-foreground">Create a storefront and manage orders</p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {accountType === "business" && (
              <div className="space-y-3 rounded-lg border p-3">
                <Label>Preferred plan</Label>
                <p className="text-xs text-muted-foreground">
                  No payment collected yet — we&apos;ll remember your choice for when billing launches.
                </p>
                <RadioGroup
                  value={intendedPlan}
                  onValueChange={(v) => setIntendedPlan(v as Plan)}
                  className="space-y-2"
                  disabled={loading}
                >
                  {(
                    [
                      { value: "basic", label: "Basic", hint: "Getting started" },
                      { value: "pro", label: "Pro", hint: "Growing businesses" },
                      { value: "premium", label: "Premium", hint: "Established businesses" },
                    ] as const
                  ).map((plan) => (
                    <label key={plan.value} htmlFor={`plan-${plan.value}`} className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value={plan.value} id={`plan-${plan.value}`} />
                      <span className="font-medium">{plan.label}</span>
                      <span className="text-muted-foreground">— {plan.hint}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
