"use client"

import { useState } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { GoogleIcon, AppleIcon } from "@/components/auth/social-icons"

type Provider = "google" | "apple"

interface OAuthButtonsProps {
  redirectTo: string
  mode?: "sign-in" | "sign-up"
  onError?: (message: string) => void
}

export function OAuthButtons({ redirectTo, mode = "sign-in", onError }: OAuthButtonsProps) {
  const [pending, setPending] = useState<Provider | null>(null)
  const verb = mode === "sign-up" ? "Sign up" : "Sign in"

  const handleClick = async (provider: Provider) => {
    setPending(provider)
    onError?.("")

    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      })

      if (error) {
        onError?.(error.message || `Could not ${verb.toLowerCase()} with ${provider}`)
        setPending(null)
      }
      // On success the browser navigates away to the provider, so no need to reset pending.
    } catch (err: any) {
      onError?.(err.message || `Could not ${verb.toLowerCase()} with ${provider}`)
      setPending(null)
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
      <button
        type="button"
        onClick={() => handleClick("google")}
        disabled={pending !== null}
        className="flex h-11 w-full min-w-0 items-center justify-center gap-2 rounded-lg border border-black/15 bg-white px-4 text-sm font-medium text-black transition-colors hover:bg-black/[0.02] disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
      >
        <GoogleIcon />
        <span className="whitespace-nowrap">{verb} with Google</span>
      </button>
      <button
        type="button"
        onClick={() => handleClick("apple")}
        disabled={pending !== null}
        className="flex h-11 w-full min-w-0 items-center justify-center gap-2 rounded-lg border border-black/15 bg-white px-4 text-sm font-medium text-black transition-colors hover:bg-black/[0.02] disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
      >
        <AppleIcon />
        <span className="whitespace-nowrap">{verb} with Apple</span>
      </button>
    </div>
  )
}
