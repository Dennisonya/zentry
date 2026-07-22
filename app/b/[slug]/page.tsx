import { notFound } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase"
import { BusinessPage } from "@/components/business-page"
import { trackPageView } from "@/lib/analytics"
import { applyPromotionsToCatalog, fetchActivePromotionsForBusiness, fetchPromotionLinks } from "@/lib/promotions"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function BusinessPageRoute({ params }: PageProps) {
  const { slug } = await params
  const supabase = getSupabaseServerClient()

  // Fetch business data
  const { data: business, error } = await supabase.from("businesses").select("*").eq("slug", slug).single()

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

  const promoList = await fetchActivePromotionsForBusiness(supabase, business.id)
  const promoIds = promoList.map((p) => p.id)
  const { productLinks, serviceLinks } = await fetchPromotionLinks(supabase, promoIds)

  const discountedProducts = applyPromotionsToCatalog((products as any[]) || [], promoList, productLinks, "product")
  const discountedServices = applyPromotionsToCatalog((services as any[]) || [], promoList, serviceLinks, "service")

  // Track page view (server-side)
  await trackPageView(business.id)

  return <BusinessPage business={business} products={discountedProducts || []} services={discountedServices || []} />
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = getSupabaseServerClient()

  const { data: business } = await supabase
    .from("businesses")
    .select("business_name, description")
    .eq("slug", slug)
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
