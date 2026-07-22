import Link from "next/link"
import { CheckCircle } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
            Shop Local. Run Your Business.{" "}
            <span className="block">All In One Place.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Create a free personal account to order and book — or launch a business storefront and get
            discovered in the marketplace.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center rounded-full border border-foreground bg-foreground px-6 py-3 text-base font-medium text-background hover:bg-foreground/90 transition-colors"
            >
              Browse Businesses
            </Link>
            <Link
              href="/auth/sign-up"
              className="inline-flex items-center justify-center rounded-full bg-[#0066FF] px-6 py-3 text-base font-medium text-white hover:bg-[#0052CC] transition-colors"
            >
              Create Free Account
            </Link>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Free for customers · Business plans when you&apos;re ready</span>
            <CheckCircle className="h-5 w-5 text-green-500 fill-green-500" />
          </div>
        </div>
      </div>
    </section>
  )
}
