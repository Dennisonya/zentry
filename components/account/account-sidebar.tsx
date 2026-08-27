"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Bell,
  BookOpenCheck,
  Crown,
  Heart,
  LayoutGrid,
  LogOut,
  MapPin,
  Menu,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const nav = [
  { href: "/account", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/account/orders", label: "My Orders", icon: ShoppingBag },
  { href: "/account/services", label: "My Services", icon: BookOpenCheck },
  { href: "/account/favorites", label: "Favorites", icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
]

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const [name, setName] = useState("My account")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [hasBusiness, setHasBusiness] = useState(false)
  const [isPro, setIsPro] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: profile }, { data: business }] = await Promise.all([
        supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).maybeSingle(),
        supabase.from("businesses").select("id").eq("user_id", user.id).limit(1).maybeSingle(),
      ])

      setName((profile as { full_name?: string | null } | null)?.full_name || user.email?.split("@")[0] || "My account")
      setAvatarUrl((profile as { avatar_url?: string | null } | null)?.avatar_url || null)
      setHasBusiness(Boolean(business))
      // Keep this deliberately permissive until the subscription schema is added.
      setIsPro(Boolean(business))
    }
    load()
  }, [])

  const active = (item: (typeof nav)[number]) => item.exact ? pathname === item.href : pathname?.startsWith(item.href)

  const signOut = async () => {
    await getSupabaseClient().auth.signOut()
    router.push("/")
  }

  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "Z"

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-2 pb-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">Zentry</span>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-white/15">
            <AvatarImage src={avatarUrl || undefined} alt={name} />
            <AvatarFallback className="bg-white/15 text-sm text-white">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{name}</p>
            <p className="text-xs text-white/60">Personal account</p>
          </div>
        </div>
      </div>

      <nav className="mt-6 flex-1 space-y-1 overflow-y-auto">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-white/45">My space</p>
        {nav.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active(item) ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          )
        })}

        <div className="mt-6 pt-6">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-white/45">Account</p>
          <Link href="/account/settings" onClick={onNavigate} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors", pathname?.startsWith("/account/settings") ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white")}>
            <Settings className="h-[18px] w-[18px]" /> Account settings
          </Link>
          <Link href={hasBusiness ? "/dashboard" : "/onboarding"} onClick={onNavigate} className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white">
            {hasBusiness ? <Store className="h-[18px] w-[18px]" /> : <Crown className="h-[18px] w-[18px]" />}
            {hasBusiness ? "View my business" : "Upgrade to Pro"}
          </Link>
          {isPro && hasBusiness && <p className="mt-1 px-3 text-xs text-purple-200">Business workspace available</p>}
        </div>
      </nav>

      <div className="space-y-2 pt-4">
        <Link href="/marketplace" onClick={onNavigate} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white">
          <Store className="h-[18px] w-[18px]" /> Marketplace
        </Link>
        <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white">
          <LogOut className="h-[18px] w-[18px]" /> Logout
        </button>
      </div>
    </div>
  )
}

export function AccountSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-primary px-4 py-6 lg:flex">
      <NavContent />
    </aside>
  )
}

export function MobileAccountNav() {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0 bg-background lg:hidden">
          <Menu className="h-4 w-4" />
          <span className="sr-only">Open account navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 border-none bg-primary p-4 py-6 [&_button]:text-white">
        <SheetTitle className="sr-only">Account navigation</SheetTitle>
        <NavContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
