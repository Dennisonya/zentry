import Link from "next/link"
import { CheckCircle } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
            Build Your Business. Get Discovered.{" "}
            <span className="block">Sell All In One Place.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Launch your business instantly, sell through social apps, and get
            discovered in one marketplace.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/marketplace/page.tsx"
              className="inline-flex items-center justify-center rounded-full border border-foreground bg-foreground px-6 py-3 text-base font-medium text-background hover:bg-foreground/90 transition-colors"
            >
              Browse Businesses
            </Link>
            <Link
              href="/auth/sign-up/page.tsx"
              className="inline-flex items-center justify-center rounded-full bg-[#0066FF] px-6 py-3 text-base font-medium text-white hover:bg-[#0052CC] transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Trusted by small businesses</span>
            <CheckCircle className="h-5 w-5 text-green-500 fill-green-500" />
          </div>
        </div>
      </div>
    </section>
  )
}
