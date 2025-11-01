import "server-only"

import { getSupabaseServerClient } from "@/lib/supabase"
import { headers } from "next/headers"

export async function trackPageView(businessId: string) {
  try {
    const supabase = getSupabaseServerClient()
    const headersList = await headers()

    const visitorIp = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
    const userAgent = headersList.get("user-agent") || "unknown"
    const referrer = headersList.get("referer") || null

    await supabase.from("page_views").insert({
      business_id: businessId,
      visitor_ip: visitorIp,
      user_agent: userAgent,
      referrer: referrer,
    })
  } catch (error) {
    console.error("[v0] Failed to track page view:", error)
  }
}
