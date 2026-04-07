export function DashboardPreview() {
  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Manage your business With Zentry
          </h2>
          <p className="mt-2 text-muted-foreground">
            Powered By Smart Digital Tools
          </p>
        </div>

        <div className="relative mx-auto max-w-5xl">
          {/* Desktop Dashboard Preview */}
          <div className="relative rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="flex-1 text-center">
                <span className="text-xs text-muted-foreground">
                  zentry.app/dashboard
                </span>
              </div>
            </div>
            <div className="p-6 bg-background">
              {/* Dashboard Content */}
              <div className="flex gap-6">
                {/* Sidebar */}
                <div className="hidden md:block w-48 space-y-4">
                  <div className="font-semibold text-foreground">Zentry</div>
                  <nav className="space-y-2 text-sm">
                    <div className="px-3 py-2 rounded-lg bg-muted text-foreground font-medium">
                      Hi Property
                    </div>
                    <div className="px-3 py-2 text-muted-foreground">
                      Dashboard
                    </div>
                    <div className="px-3 py-2 text-muted-foreground">
                      Products
                    </div>
                    <div className="px-3 py-2 text-muted-foreground">
                      Orders
                    </div>
                    <div className="px-3 py-2 text-muted-foreground">
                      Analytics
                    </div>
                  </nav>
                </div>

                {/* Main Content */}
                <div className="flex-1 space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground">
                        Total Sales
                      </div>
                      <div className="text-xl font-bold text-foreground">
                        $12,450
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground">
                        Orders
                      </div>
                      <div className="text-xl font-bold text-foreground">
                        156
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground">
                        Customers
                      </div>
                      <div className="text-xl font-bold text-foreground">
                        89
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground">Views</div>
                      <div className="text-xl font-bold text-foreground">
                        2.4k
                      </div>
                    </div>
                  </div>

                  {/* Chart Placeholder */}
                  <div className="h-40 rounded-lg bg-muted/30 flex items-end justify-around p-4 gap-2">
                    {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map(
                      (height, i) => (
                        <div
                          key={i}
                          className="w-full bg-[#0066FF] rounded-t"
                          style={{ height: `${height}%` }}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Preview */}
          <div className="absolute -right-4 sm:right-8 -bottom-8 sm:bottom-8 w-32 sm:w-40">
            <div className="rounded-2xl border-4 border-foreground bg-background shadow-xl overflow-hidden">
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted" />
                  <div>
                    <div className="text-[10px] font-semibold text-foreground">
                      Zentry
                    </div>
                    <div className="text-[8px] text-muted-foreground">
                      Your Store
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="h-16 rounded bg-muted" />
                  <div className="grid grid-cols-2 gap-1">
                    <div className="h-8 rounded bg-muted" />
                    <div className="h-8 rounded bg-muted" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-16 text-center text-muted-foreground max-w-2xl mx-auto">
          Track sales, manage products, and discover customers, all from one
          dashboard.
        </p>
      </div>
    </section>
  )
}
