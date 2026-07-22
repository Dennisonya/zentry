"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"

// Landed on after the user clicks the confirmation link in their email.
// getSupabaseClient() has detectSessionInUrl enabled, so it exchanges the
// verification token/code for a session automatically on load — we just
// wait for that to land, then send the user into the marketplace.
export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<"verifying" | "error">("verifying")

  useEffect(() => {
    const supabase = getSupabaseClient()
    let redirected = false

    // Business accounts haven't set up a storefront yet, so they go to
    // /onboarding (same target /dashboard sends new business users to).
    // Personal accounts go straight to the marketplace.
    const routeUser = async (userId: string) => {
      if (redirected) return
      redirected = true

      const { data: profile } = await supabase
        .from("profiles")
        .select("default_view")
        .eq("id", userId)
        .maybeSingle()

      const defaultView = (profile as { default_view?: string } | null)?.default_view

      router.replace(defaultView === "business" ? "/onboarding" : "/marketplace")
    }

    // If the session is already there by the time this runs, go immediately.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) routeUser(data.session.user.id)
    })

    // Otherwise wait for the client to finish processing the URL.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        routeUser(session.user.id)
      }
    })

    // Give the client a few seconds to process an expired/invalid link
    // before showing an error instead of spinning forever.
    const timeout = setTimeout(() => {
      if (!redirected) setStatus("error")
    }, 6000)

    return () => {
      listener.subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [router])

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Verification link expired</CardTitle>
            <CardDescription className="text-center">
              This link may have already been used or has expired. Try signing in, or request a
              new confirmation email by signing up again.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link href="/auth/login">
              <Button className="w-full">Go to login</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button variant="outline" className="w-full bg-transparent">
                Back to sign up
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying your account...</p>
        </CardContent>
      </Card>
    </div>
  )
}
