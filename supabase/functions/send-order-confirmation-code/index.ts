// Texts an order confirmation code to the customer by SMS.
//
// The browser calls this with the order's confirmation token. The code is
// generated and hashed by request_order_confirmation_code() (scripts/021),
// sent to the phone number stored on the order, and never returned to the
// caller, so entering it proves the customer has that phone.
//
// Secrets (Supabase dashboard > Edge Functions > Secrets):
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN   required
//   TWILIO_MESSAGING_SERVICE_SID or TWILIO_SMS_FROM
//                                           optional; without either, the first
//                                           SMS-capable number on the account is used
//   DEFAULT_COUNTRY_CODE                    optional, e.g. 234, for numbers stored as 080...
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.

import { createClient } from "npm:@supabase/supabase-js@2"
import { maskPhone, toE164 } from "./phone.ts"

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

const twilioSid = () => env("TWILIO_ACCOUNT_SID")
const twilioAuth = () => `Basic ${btoa(`${twilioSid()}:${env("TWILIO_AUTH_TOKEN")}`)}`

// Cached for the life of the worker once looked up.
let accountSmsNumber: string | null = null

async function findAccountSmsNumber(): Promise<string | null> {
  if (accountSmsNumber) return accountSmsNumber
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilioSid()}/IncomingPhoneNumbers.json?PageSize=50`,
    { headers: { Authorization: twilioAuth() } },
  )
  if (!res.ok) {
    console.error("Twilio number lookup failed", res.status)
    return null
  }
  const { incoming_phone_numbers = [] } = await res.json()
  const number = incoming_phone_numbers.find((n: any) => n?.capabilities?.sms)?.phone_number ?? null
  accountSmsNumber = number
  return number
}

async function sendSms(to: string, code: string, businessName: string | null) {
  const form = new URLSearchParams()
  form.set("To", to)
  form.set("Body", `${code} is your ${businessName ?? "Zentry"} order confirmation code. It expires in 5 minutes. Do not share it.`)

  const serviceSid = env("TWILIO_MESSAGING_SERVICE_SID")
  const from = env("TWILIO_SMS_FROM")
  if (serviceSid) form.set("MessagingServiceSid", serviceSid)
  else if (from) form.set("From", from)
  else {
    const accountNumber = await findAccountSmsNumber()
    if (!accountNumber) {
      console.error("No SMS sender: set TWILIO_SMS_FROM or TWILIO_MESSAGING_SERVICE_SID, or add an SMS-capable number to the Twilio account")
      throw new Error("no_sender")
    }
    form.set("From", accountNumber)
  }

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid()}/Messages.json`, {
    method: "POST",
    headers: { Authorization: twilioAuth(), "Content-Type": "application/x-www-form-urlencoded" },
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

  let token: unknown
  try {
    ;({ token } = await req.json())
  } catch {
    return json({ error: "Invalid request" }, 400)
  }
  if (typeof token !== "string" || !token) return json({ error: "Order not found" }, 404)

  // Check config before issuing a code so a missing secret doesn't burn a send.
  const missing = ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"].filter((name) => !env(name))
  if (missing.length) {
    console.error(`SMS not configured: missing Edge Function secret(s) ${missing.join(", ")}`)
    return json({ error: "Sending codes by SMS isn't available yet" }, 503)
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
    await sendSms(to, code, business_name)
  } catch {
    // Nothing reached the customer, so don't let this attempt count toward
    // the one-per-minute / five-per-hour limits.
    await supabase.rpc("cancel_undelivered_confirmation_code", { p_token: token })
    return json({ error: "We couldn't send the code. Please try again in a minute" }, 502)
  }

  return json({ sent_to: maskPhone(to), expires_in_seconds })
})
