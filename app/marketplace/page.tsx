import { getSupabaseServerClient } from "@/lib/supabase"
import { MarketplaceContent } from "@/components/marketplace-content"

export const metadata = {
  title: "Marketplace - Zentry",
  description: "Browse all businesses on Zentry",
}

export default async function MarketplacePage() {
  const supabase = getSupabaseServerClient()

  // Fetch all businesses
  const { data: businesses } = await supabase.from("businesses").select("*").order("created_at", { ascending: false })

  return <MarketplaceContent businesses={businesses || []} />
}
