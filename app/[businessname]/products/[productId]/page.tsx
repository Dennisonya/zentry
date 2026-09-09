import { notFound } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase"
import { ProductDetail } from "@/components/storefront/product-detail"

interface PageProps {
  params: Promise<{ businessname: string; productId: string }>
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { businessname, productId } = await params
  const supabase = getSupabaseServerClient()

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", businessname)
    .single()

  if (businessError || !business) {
    notFound()
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("business_id", business.id)
    .eq("is_available", true)
    .single()

  if (productError || !product) {
    notFound()
  }

  const [{ data: images }, { data: variants }] = await Promise.all([
    supabase.from("product_images").select("*").eq("product_id", product.id).order("position", { ascending: true }),
    supabase.from("product_variants").select("*").eq("product_id", product.id).order("created_at", { ascending: true }),
  ])

  return (
    <ProductDetail
      business={business}
      product={product}
      images={images || []}
      variants={(variants || []).filter((v) => v.is_available)}
    />
  )
}

export async function generateMetadata({ params }: PageProps) {
  const { businessname, productId } = await params
  const supabase = getSupabaseServerClient()

  const { data: product } = await supabase
    .from("products")
    .select("name, description")
    .eq("id", productId)
    .single()

  if (!product) {
    return { title: "Product Not Found" }
  }

  return {
    title: `${product.name} - Zentry`,
    description: product.description || undefined,
  }
}
