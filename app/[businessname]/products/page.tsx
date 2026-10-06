import { notFound } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase"
import { ProductCatalog } from "@/components/storefront/product-catalog"

interface PageProps {
  params: Promise<{ businessname: string }>
}

export default async function ProductsPage({ params }: PageProps) {
  const { businessname } = await params
  const supabase = getSupabaseServerClient()

  const { data: business, error } = await supabase.from("businesses").select("*").eq("slug", businessname).single()

  if (error || !business) {
    notFound()
  }

  const { data: products } = await supabase
    .from("products")
    .select("*, product_variants(stock_quantity, low_stock_threshold)")
    .eq("business_id", business.id)
    .eq("is_available", true)
    .order("created_at", { ascending: false })

  return <ProductCatalog business={business} products={products || []} />
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
    title: `Products - ${business.business_name} - Zentry`,
    description: `Browse all products from ${business.business_name}`,
  }
}
