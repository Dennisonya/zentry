import { createClient } from "@supabase/supabase-js"

// Singleton Supabase client for client-side usage
let supabaseClient: ReturnType<typeof createClient> | null = null
let cachedUrl: string | undefined = undefined
let cachedKey: string | undefined = undefined

// Client-side Supabase client
export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Provide detailed error messages
  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL environment variable. " +
      "Please add it to your .env.local file. " +
      "Example: NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
    )
  }

  if (!key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. " +
      "Please add it to your .env.local file. " +
      "You can find this in your Supabase project settings under API."
    )
  }

  // Validate that URL and key are not empty strings
  if (url.trim() === "") {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is empty. " +
      "Please check your .env.local file and ensure it has a valid Supabase URL."
    )
  }

  if (key.trim() === "") {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is empty. " +
      "Please check your .env.local file and ensure it has a valid Supabase anon key."
    )
  }

  // Validate URL format
  try {
    new URL(url)
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL format: "${url}". ` +
      "It should be a valid URL like https://your-project.supabase.co"
    )
  }

  // Validate key format (Supabase keys typically start with 'eyJ')
  if (!key.startsWith('eyJ')) {
    console.warn(
      "Warning: NEXT_PUBLIC_SUPABASE_ANON_KEY doesn't appear to be in the expected format. " +
      "Supabase keys typically start with 'eyJ'. Please verify you're using the correct anon/public key."
    )
  }

  // Recreate client if URL or key changed (or if client doesn't exist)
  if (!supabaseClient || cachedUrl !== url || cachedKey !== key) {
    cachedUrl = url
    cachedKey = key
    
    // Create new client with proper auth configuration
    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
      },
    })
  }

  return supabaseClient
}

// Server-side Supabase client
// Requires service role key for server-side operations to bypass RLS
export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error("Missing Supabase environment variable: NEXT_PUBLIC_SUPABASE_URL is required")
  }

  if (!serviceRoleKey) {
    throw new Error(
      "Missing Supabase environment variable: SUPABASE_SERVICE_ROLE_KEY is required for server-side operations. " +
      "Server-side operations must use the service role key to bypass Row Level Security policies."
    )
  }

  return createClient(url, serviceRoleKey)
}
