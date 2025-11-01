import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Zap, Smartphone, TrendingUp, Check, Sparkles } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-950 dark:via-blue-950 dark:to-indigo-950">
      {/* Header */}
      <header className="glass border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Zentry
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/marketplace" className="text-sm font-medium hover:text-primary transition-colors">
              Browse Businesses
            </Link>
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm font-medium mb-6 animate-fade-in">
            <Sparkles className="h-4 w-4 text-purple-600" />
            Launch your business online in 60 seconds
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-balance bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent animate-fade-in">
            Your Business Online Instantly
          </h1>
          <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto animate-fade-in">
            Create a stunning business page, accept orders via WhatsApp or Instagram, and start selling in under a
            minute. No coding required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            <Link href="/auth/sign-up">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/50"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button size="lg" variant="outline" className="w-full sm:w-auto glass bg-transparent">
                Browse Businesses
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4">No credit card required • 14-day free trial</p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built for small businesses who want to get online fast without the complexity
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="glass-card border-2 hover:shadow-2xl hover:shadow-purple-500/20 transition-all">
              <CardContent className="pt-6">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mb-4">
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Instant Setup</h3>
                <p className="text-muted-foreground">
                  Answer a few questions and get a professional business page in under a minute. No technical skills
                  needed.
                </p>
              </CardContent>
            </Card>
            <Card className="glass-card border-2 hover:shadow-2xl hover:shadow-blue-500/20 transition-all">
              <CardContent className="pt-6">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-4">
                  <Smartphone className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Mobile-First Design</h3>
                <p className="text-muted-foreground">
                  Your page looks perfect on every device. Customers can browse and order from anywhere.
                </p>
              </CardContent>
            </Card>
            <Card className="glass-card border-2 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all">
              <CardContent className="pt-6">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mb-4">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Built-in Analytics</h3>
                <p className="text-muted-foreground">
                  Track page views, popular products, and customer behavior to grow your business smarter.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-lg text-muted-foreground">From signup to your first sale in minutes</p>
          </div>
          <div className="space-y-8">
            <Card className="glass-card p-6 hover:shadow-xl transition-all">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-shrink-0 h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 text-white flex items-center justify-center text-2xl font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Create Your Account</h3>
                  <p className="text-muted-foreground text-lg">
                    Sign up with your email and tell us about your business. Takes less than 2 minutes.
                  </p>
                </div>
              </div>
            </Card>
            <Card className="glass-card p-6 hover:shadow-xl transition-all">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-shrink-0 h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Add Your Products</h3>
                  <p className="text-muted-foreground text-lg">
                    Upload your products with photos and prices. Our system generates a beautiful page automatically.
                  </p>
                </div>
              </div>
            </Card>
            <Card className="glass-card p-6 hover:shadow-xl transition-all">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-shrink-0 h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center text-2xl font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Share & Start Selling</h3>
                  <p className="text-muted-foreground text-lg">
                    Get your unique link and share it everywhere. Accept orders via WhatsApp, Instagram, or email.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground">
              Choose the plan that fits your business. All plans include a 14-day free trial.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="glass-card border-2 hover:shadow-xl transition-all">
              <CardContent className="pt-6">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold mb-2">Basic</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      $9.99
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>
                <p className="text-muted-foreground mb-6">Perfect for getting started</p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Custom business page</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Up to 20 products</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">WhatsApp integration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Basic analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Mobile responsive</span>
                  </li>
                </ul>
                <Link href="/auth/sign-up" className="block">
                  <Button className="w-full bg-transparent" variant="outline">
                    Start Free Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="glass-card border-4 border-purple-500 shadow-2xl shadow-purple-500/30 relative scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-full">
                Most Popular
              </div>
              <CardContent className="pt-6">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold mb-2">Pro</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      $29.99
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>
                <p className="text-muted-foreground mb-6">For growing businesses</p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Everything in Basic</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Unlimited products</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Instagram integration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Advanced analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Custom domain</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Priority support</span>
                  </li>
                </ul>
                <Link href="/auth/sign-up" className="block">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    Start Free Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="glass-card border-2 hover:shadow-xl transition-all">
              <CardContent className="pt-6">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      $99.99
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>
                <p className="text-muted-foreground mb-6">For established businesses</p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Everything in Pro</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Multiple locations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">API access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">White-label options</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Dedicated account manager</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Custom integrations</span>
                  </li>
                </ul>
                <Link href="/auth/sign-up" className="block">
                  <Button className="w-full bg-transparent" variant="outline">
                    Start Free Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center glass-card p-12 bg-gradient-to-br from-purple-600/90 to-blue-600/90 text-white rounded-3xl shadow-2xl shadow-purple-500/50">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Ready to Launch Your Business?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join hundreds of small businesses already selling online with Zentry
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-white/90 shadow-lg">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Zentry
              </span>
            </div>
            <p className="text-sm text-muted-foreground">© 2025 Zentry. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
