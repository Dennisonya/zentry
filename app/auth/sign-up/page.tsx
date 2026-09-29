"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Eye, EyeOff, AlertCircle } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { PLAN_ORDER, PLANS, type PlanId } from "@/lib/plans"
import { AuthShell } from "@/components/auth/auth-shell"
import { OAuthButtons } from "@/components/auth/oauth-buttons"

export default function SignUpPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [intendedPlan, setIntendedPlan] = useState<PlanId>("Starter")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [skipMarketingEmails, setSkipMarketingEmails] = useState(false)
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

    if (!agreedToTerms) {
      setError("You need to agree to the Terms of Service and Privacy Policy to continue")
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
      // page waits for the session then sends business accounts to onboarding.
      const emailRedirectTo =
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: {
            account_type: "business",
            intended_plan: intendedPlan,
            full_name: `${firstName} ${lastName}`.trim(),
            marketing_opt_out: skipMarketingEmails,
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
    <AuthShell
      title="Create your business account"
      subtitle="Set up a storefront and start selling in minutes."
      rightHeadline="Built for businesses ready to sell everywhere."
      rightSubcopy="A storefront, inventory, and order management — all in one place, wherever your customers find you."
    >
      <OAuthButtons
        mode="sign-up"
        redirectTo={
          typeof window !== "undefined" ? `${window.location.origin}/auth/callback?intent=business` : "/auth/callback"
        }
        onError={(message) => setError(message || null)}
      />

      <div className="my-6 flex items-center gap-4 text-xs font-medium text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        or
        <div className="h-px flex-1 bg-border" />
      </div>

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

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              placeholder="Jane"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Business email</Label>
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
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 6 characters"
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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-3 rounded-lg border p-3">
          <Label>Preferred plan</Label>
          <p className="text-xs text-muted-foreground">
            No payment collected yet — we&apos;ll remember your choice for when billing launches.
          </p>
          <RadioGroup
            value={intendedPlan}
            onValueChange={(v) => setIntendedPlan(v as PlanId)}
            className="space-y-2"
            disabled={loading}
          >
            {PLAN_ORDER.map((id) => (
              <label key={id} htmlFor={`plan-${id}`} className="flex items-center gap-2 text-sm">
                <RadioGroupItem value={id} id={`plan-${id}`} />
                <span className="font-medium">{PLANS[id].name}</span>
                <span className="text-muted-foreground">— {PLANS[id].description}</span>
              </label>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-3 pt-2 text-xs leading-5 text-muted-foreground">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={skipMarketingEmails}
              onCheckedChange={(v) => setSkipMarketingEmails(v === true)}
              disabled={loading}
              className="mt-0.5"
            />
            <span>I don&apos;t want to receive emails about Zentry feature updates and best practices.</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={agreedToTerms}
              onCheckedChange={(v) => setAgreedToTerms(v === true)}
              disabled={loading}
              className="mt-0.5"
              required
            />
            <span>
              By creating an account, you agree to our{" "}
              <a href="#" className="font-medium underline underline-offset-2">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="font-medium underline underline-offset-2">
                Privacy Policy
              </a>
            </span>
          </label>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </Button>

        <p className="text-sm text-center text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
