import { notFound } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase"
import { BusinessPage } from "@/components/business-page"
import { trackPageView } from "@/lib/analytics"

interface PageProps {
  params: Promise<{ businessname: string }>
}

export default async function BusinessPageRoute({ params }: PageProps) {
  const { businessname } = await params
  const supabase = getSupabaseServerClient()

  // Fetch business data by slug (businessname in URL)
  const { data: business, error } = await supabase.from("businesses").select("*").eq("slug", businessname).single()

  if (error || !business) {
    notFound()
  }

  // Fetch products for this business
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", business.id)
    .eq("is_available", true)
    .order("created_at", { ascending: false })

  // Fetch services for this business
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", business.id)
    .eq("is_available", true)
    .order("created_at", { ascending: false })

  // Track page view (server-side)
  await trackPageView(business.id)

  return <BusinessPage business={business} products={products || []} services={services || []} />
}

export async function generateMetadata({ params }: PageProps) {
  const { businessname } = await params
  const supabase = getSupabaseServerClient()

  const { data: business } = await supabase
    .from("businesses")
    .select("business_name, description")
    .eq("slug", businessname)
    .single()

  if (!business) {
    return {
      title: "Business Not Found",
    }
  }

  return {
    title: `${business.business_name} - Products & Services - Zentry`,
    description: business.description || `Visit ${business.business_name} online`,
  }
}
