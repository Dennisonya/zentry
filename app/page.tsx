import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { DashboardPreview } from "@/components/dashboard-preview"
import { Features } from "@/components/features"
import { Steps } from "@/components/steps"
import { Pricing } from "@/components/pricing"
import { FAQ } from "@/components/faq"
import { CTA } from "@/components/cta"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <DashboardPreview />
      <Features />
      <Steps />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  )
}
