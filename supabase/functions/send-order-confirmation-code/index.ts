// Sends an order confirmation code to the customer by SMS or WhatsApp.
//
// The browser calls this with the order's confirmation token. The code is
// generated and hashed by request_order_confirmation_code() (scripts/021),
// texted to the phone number stored on the order, and never returned to the
// caller, so entering it proves the customer has that phone.
//
// Secrets (supabase secrets set ...):
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN          required
//   TWILIO_SMS_FROM or TWILIO_MESSAGING_SERVICE_SID  for SMS
//   TWILIO_WHATSAPP_FROM                           for WhatsApp, e.g. +14155238886
//   TWILIO_WHATSAPP_CONTENT_SID                    optional approved template with {{1}} = code
//   DEFAULT_COUNTRY_CODE                           optional, e.g. 234, for numbers stored as 080...
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.

import { createClient } from "npm:@supabase/supabase-js@2"
import { maskPhone, toE164 } from "./phone.ts"

type Channel = "sms" | "whatsapp"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })

const env = (name: string) => Deno.env.get(name)?.trim() || undefined

function channelConfigured(channel: Channel): boolean {
  if (!env("TWILIO_ACCOUNT_SID") || !env("TWILIO_AUTH_TOKEN")) return false
  return channel === "sms"
    ? Boolean(env("TWILIO_SMS_FROM") || env("TWILIO_MESSAGING_SERVICE_SID"))
    : Boolean(env("TWILIO_WHATSAPP_FROM"))
}

async function sendWithTwilio(channel: Channel, to: string, code: string, businessName: string | null) {
  const sid = env("TWILIO_ACCOUNT_SID")!
  const form = new URLSearchParams()
  const text = `${code} is your ${businessName ?? "Zentry"} order confirmation code. It expires in 5 minutes. Do not share it.`

  if (channel === "sms") {
    form.set("To", to)
    const serviceSid = env("TWILIO_MESSAGING_SERVICE_SID")
    if (serviceSid) form.set("MessagingServiceSid", serviceSid)
    else form.set("From", env("TWILIO_SMS_FROM")!)
    form.set("Body", text)
  } else {
    form.set("To", `whatsapp:${to}`)
    form.set("From", `whatsapp:${env("TWILIO_WHATSAPP_FROM")!.replace(/^whatsapp:/, "")}`)
    // Outside a 24h customer session WhatsApp only delivers approved templates.
    const contentSid = env("TWILIO_WHATSAPP_CONTENT_SID")
    if (contentSid) {
      form.set("ContentSid", contentSid)
      form.set("ContentVariables", JSON.stringify({ "1": code }))
    } else {
      form.set("Body", text)
    }
  }

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${sid}:${env("TWILIO_AUTH_TOKEN")!}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  })
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}))
    console.error("Twilio send failed", res.status, detail?.code, detail?.message)
    throw new Error("send_failed")
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  let token: unknown, channel: unknown
  try {
    ;({ token, channel } = await req.json())
  } catch {
    return json({ error: "Invalid request" }, 400)
  }
  if (typeof token !== "string" || !token) return json({ error: "Order not found" }, 404)
  if (channel !== "sms" && channel !== "whatsapp") return json({ error: "Choose SMS or WhatsApp" }, 400)

  // Check config before issuing a code so a missing secret doesn't burn a send.
  if (!channelConfigured(channel)) {
    return json({ error: `Sending codes by ${channel === "sms" ? "SMS" : "WhatsApp"} isn't available yet` }, 503)
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  })

  const { data, error } = await supabase.rpc("request_order_confirmation_code", { p_token: token })
  if (error || !data) {
    // Messages raised by the database function are written for customers.
    return json({ error: error?.message ?? "Could not create a code" }, 400)
  }

  const { code, expires_in_seconds, customer_phone, business_name } = data as {
    code: string
    expires_in_seconds: number
    customer_phone: string
    business_name: string | null
  }

  const to = toE164(customer_phone, env("DEFAULT_COUNTRY_CODE"))
  if (!to) return json({ error: "The phone number on this order isn't valid. Please contact the business" }, 400)

  try {
    await sendWithTwilio(channel, to, code, business_name)
  } catch {
    return json({ error: `We couldn't send the code by ${channel === "sms" ? "SMS" : "WhatsApp"}. Please try again or use the other option` }, 502)
  }

  return json({ channel, sent_to: maskPhone(to), expires_in_seconds })
})
