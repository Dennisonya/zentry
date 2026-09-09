import { notFound } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase"
import { ServiceCatalog } from "@/components/storefront/service-catalog"

interface PageProps {
  params: Promise<{ businessname: string }>
}

export default async function ServicesPage({ params }: PageProps) {
  const { businessname } = await params
  const supabase = getSupabaseServerClient()

  const { data: business, error } = await supabase.from("businesses").select("*").eq("slug", businessname).single()

  if (error || !business) {
    notFound()
  }

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", business.id)
    .eq("is_available", true)
    .order("created_at", { ascending: false })

  return <ServiceCatalog business={business} services={services || []} />
}

export async function generateMetadata({ params }: PageProps) {
  const { businessname } = await params
  const supabase = getSupabaseServerClient()

  const { data: business } = await supabase
    .from("businesses")
    .select("business_name")
    .eq("slug", businessname)
    .single()

  if (!business) {
    return { title: "Business Not Found" }
  }

  return {
    title: `Services - ${business.business_name} - Zentry`,
    description: `Browse all services from ${business.business_name}`,
  }
}
