import { getSupabaseServerClient } from "@/lib/supabase"
import { MarketplaceContent } from "@/components/marketplace-content"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "Marketplace - Zentry",
  description: "Browse all businesses on Zentry",
}

export default async function MarketplacePage() {
  const supabase = getSupabaseServerClient()

  // Fetch all businesses
  const { data: businesses, error } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: false })



  // Ensure we always pass an array, even if businesses is null
  const businessesArray = businesses || []

  return <MarketplaceContent businesses={businessesArray} />
}
