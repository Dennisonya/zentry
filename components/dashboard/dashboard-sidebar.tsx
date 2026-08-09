"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutGrid,
  BarChart3,
  Package,
  ShoppingBag,
  Gift,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  Sparkles,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getSupabaseClient } from "@/lib/supabase"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

function NavLink({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string
  icon: React.ElementType
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white",
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span>{label}</span>
    </Link>
  )
}

function SidebarNavContent({ inventoryHref }: { inventoryHref: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [ordersOpen, setOrdersOpen] = useState(false)

  const isOrdersSection = pathname?.startsWith("/dashboard/orders") || pathname?.startsWith("/dashboard/bookings")

  const handleSignOut = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-2 pb-6">
        <div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">Zentry</span>
      </div>
      <div className="h-px bg-white/15 mb-6" />

      <nav className="flex-1 space-y-6 overflow-y-auto">
        <div>
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-white/50">General</p>
          <div className="space-y-1">
            <NavLink href="/dashboard" icon={LayoutGrid} label="Dashboard" active={pathname === "/dashboard"} />
            <NavLink
              href="/dashboard/analytics"
              icon={BarChart3}
              label="Analytics"
              active={pathname === "/dashboard/analytics"}
            />
            <NavLink href={inventoryHref} icon={Package} label="Inventory" active={false} />

            {/* Orders / Bookings — expandable */}
            <div>
              <button
                onClick={() => setOrdersOpen((o) => !o)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isOrdersSection ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white",
                )}
              >
                <ShoppingBag className="h-[18px] w-[18px] shrink-0" />
                <span className="flex-1 text-left">Orders/Bookings</span>
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", ordersOpen || isOrdersSection ? "rotate-180" : "")}
                />
              </button>
              {(ordersOpen || isOrdersSection) && (
                <div className="ml-6 mt-1 space-y-1 border-l border-white/15 pl-3">
                  <Link
                    href="/dashboard/orders"
                    className={cn(
                      "block rounded-lg px-3 py-1.5 text-sm transition-colors",
                      pathname === "/dashboard/orders"
                        ? "text-white font-medium"
                        : "text-white/70 hover:text-white",
                    )}
                  >
                    Orders
                  </Link>
                  <Link
                    href="/dashboard/bookings"
                    className={cn(
                      "block rounded-lg px-3 py-1.5 text-sm transition-colors",
                      pathname === "/dashboard/bookings"
                        ? "text-white font-medium"
                        : "text-white/70 hover:text-white",
                    )}
                  >
                    Bookings
                  </Link>
                </div>
              )}
            </div>

            <NavLink
              href="/dashboard/promotions"
              icon={Gift}
              label="Promotions"
              active={pathname === "/dashboard/promotions"}
            />
          </div>
        </div>

        <div>
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-white/50">Tools</p>
          <div className="space-y-1">
            <NavLink
              href="/dashboard/settings"
              icon={Settings}
              label="Settings"
              active={pathname === "/dashboard/settings"}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white">
                  <HelpCircle className="h-[18px] w-[18px] shrink-0" />
                  <span>Help</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="right">
                <DropdownMenuItem asChild>
                  <a href="mailto:support@zentry.app">Contact support</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">Account settings</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <button
        onClick={handleSignOut}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
      >
        <LogOut className="h-[18px] w-[18px] shrink-0" />
        <span>Logout</span>
      </button>
    </div>
  )
}

export function DashboardSidebar({ inventoryHref = "/dashboard#inventory" }: { inventoryHref?: string }) {
  return (
    <aside className="hidden lg:flex h-screen w-64 shrink-0 flex-col bg-primary px-4 py-6 sticky top-0">
      <SidebarNavContent inventoryHref={inventoryHref} />
    </aside>
  )
}

export function MobileDashboardNav({ inventoryHref = "/dashboard#inventory" }: { inventoryHref?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden bg-transparent shrink-0">
          <Menu className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 bg-primary border-none p-4 py-6 [&_button]:text-white">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SidebarNavContent inventoryHref={inventoryHref} />
      </SheetContent>
    </Sheet>
  )
}
