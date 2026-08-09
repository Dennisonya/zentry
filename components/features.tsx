import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function Features() {
  return (
    <section id="features" className="py-16 sm:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Tools Your Business Needs
            <span className="block">To Grow</span>
          </h2>
        </div>

        <div className="grid gap-4 md:gap-6">
          {/* Instant Business Page - Full Width */}
          <div className="rounded-2xl bg-[#1a1f2e] p-6 sm:p-8 text-white">
            <h3 className="text-xl sm:text-2xl font-semibold mb-2">
              Instant Business Page
            </h3>
            <p className="text-white/70 text-sm sm:text-base mb-6 max-w-md">
              Create a clean, shareable business profile in minutes no coding
              needed.
            </p>
            <Link
              href="/auth/sign-up"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#1a1f2e] hover:bg-white/90 transition-colors"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>

            {/* Mock Preview */}
            <div className="mt-6 rounded-lg bg-white/10 p-4 max-w-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-white/20" />
                <div>
                  <div className="h-3 w-24 bg-white/30 rounded" />
                  <div className="h-2 w-16 bg-white/20 rounded mt-1" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-white/10 rounded" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-12 bg-white/10 rounded" />
                  <div className="h-12 bg-white/10 rounded" />
                  <div className="h-12 bg-white/10 rounded" />
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Grid */}
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            {/* Analytics & Insights */}
            <div className="rounded-2xl bg-[#f5f5f5] p-6 sm:p-8 text-foreground">
              <h3 className="text-xl font-semibold mb-2">
                Analytics & Insights
              </h3>
              <p className="text-muted-foreground text-sm mb-6">
                Track traffic, revenue, and inventory in one place.
              </p>

              {/* Mini Chart */}
              <div className="rounded-lg bg-white p-4 shadow-sm">
                <div className="flex items-end justify-around h-24 gap-1">
                  {[30, 50, 40, 70, 55, 80, 65, 90, 75, 85].map((height, i) => (
                    <div
                      key={i}
                      className="w-full bg-[#0066FF] rounded-t"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Marketplace Discovery */}
            <div className="rounded-2xl bg-[#e8f0ea] p-6 sm:p-8 text-foreground">
              <h3 className="text-xl font-semibold mb-2">
                Marketplace Discovery
              </h3>
              <p className="text-muted-foreground text-sm mb-6">
                Get discovered by customers searching for businesses like yours.
              </p>
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:opacity-80 transition-opacity mb-4"
              >
                Browse Marketplace
                <ArrowRight className="h-4 w-4" />
              </Link>

              {/* Person with phone illustration */}
              <div className="flex justify-end">
                <div className="relative w-32 h-32">
                  <div className="absolute right-0 bottom-0 w-24 h-28 rounded-t-full bg-[#c5d5c8]" />
                  <div className="absolute right-6 bottom-10 w-12 h-16 rounded-lg bg-white shadow-md">
                    <div className="p-1 space-y-1">
                      <div className="h-2 w-8 bg-muted rounded" />
                      <div className="h-6 bg-muted/50 rounded" />
                      <div className="h-2 w-6 bg-muted rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
