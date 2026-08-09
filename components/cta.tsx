import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function CTA() {
  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-[#0066FF] px-6 py-12 sm:px-12 sm:py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 text-balance">
            Ready to get started?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Join free as a customer, or set up a business storefront — one account can do both.
          </p>
          <Link
            href="/auth/sign-up"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-base font-medium text-background hover:bg-foreground/90 transition-colors"
          >
            Create Free Account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
