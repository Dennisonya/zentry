"use client"

<<<<<<< HEAD
import { useEffect, useMemo, useState } from "react"
=======
import { useState, useMemo, useEffect } from "react"
>>>>>>> 447dd1603412727f3d023f52cafc26f2dfa59e51
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
<<<<<<< HEAD
import { Search, MapPin, Phone, Instagram, MessageCircle, UserRound } from "lucide-react"
=======
import { Search, MapPin, Phone, Instagram, MessageCircle, UserCircle } from "lucide-react"
>>>>>>> 447dd1603412727f3d023f52cafc26f2dfa59e51
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase"

interface Business { 
  id:string;
  business_name:string; 
  slug:string; 
  business_type:string; 
  description:string|null; 
  logo_url:string|null; 
  address:string|null; 
  phone:string|null; 
  theme_color:string; 
  whatsapp_number:string|null; 
  instagram_handle:string|null 
}

export function MarketplaceContent({ businesses }: { businesses: Business[] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
<<<<<<< HEAD
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseClient()
    supabase.auth.getUser().then(({ data }) => setLoggedIn(Boolean(data.user)))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setLoggedIn(Boolean(session?.user)))
    return () => listener.subscription.unsubscribe()
  }, [])

  const categories = useMemo(() => Array.from(new Set(businesses.map((b) => b.business_type))).sort(), [businesses])
  const filteredBusinesses = useMemo(() => businesses.filter((business) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = !q || business.business_name.toLowerCase().includes(q) || business.description?.toLowerCase().includes(q) || business.business_type.toLowerCase().includes(q)
    return matchesSearch && (selectedCategory === null || business.business_type === selectedCategory)
  }), [businesses, searchQuery, selectedCategory])

  return <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
    <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 py-5"><div className="flex items-center justify-between gap-4">
        <Link href="/" className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-2xl font-bold text-transparent">Zentry</Link>
        <nav className="flex items-center gap-2">
          {loggedIn ? <Button asChild variant="outline" className="rounded-full bg-white"><Link href="/account"><UserRound className="mr-2 h-4 w-4"/>My account</Link></Button> : <Button asChild variant="outline" className="rounded-full bg-white"><Link href="/auth/login?next=/marketplace">Sign in</Link></Button>}
          <Button asChild className="rounded-full"><Link href="/auth/sign-up">List Your Business</Link></Button>
        </nav>
      </div></div>
    </header>
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center"><h1 className="mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">Discover Local Businesses</h1><p className="mx-auto max-w-2xl text-lg text-muted-foreground">Browse through our collection of amazing local businesses and find exactly what you need</p></div>
      <div className="mx-auto mb-8 max-w-2xl"><div className="relative"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"/><Input placeholder="Search businesses, products, or services..." value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} className="h-14 rounded-full border-2 bg-white/80 pl-12 backdrop-blur focus:border-purple-500"/></div></div>
      <div className="mb-12 flex flex-wrap justify-center gap-2"><Button variant={selectedCategory===null?"default":"outline"} onClick={()=>setSelectedCategory(null)} className="rounded-full">All</Button>{categories.map(category=><Button key={category} variant={selectedCategory===category?"default":"outline"} onClick={()=>setSelectedCategory(category)} className="rounded-full">{category}</Button>)}</div>
      <div className="mb-6"><p className="text-sm text-muted-foreground">Showing {filteredBusinesses.length} {filteredBusinesses.length===1?"business":"businesses"}</p></div>
      {filteredBusinesses.length===0?<div className="py-12 text-center"><p className="text-lg text-muted-foreground">No businesses found matching your criteria</p></div>:<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{filteredBusinesses.map(business=><Link key={business.id} href={`/${business.slug}`}><Card className="h-full overflow-hidden rounded-2xl border-2 bg-white/80 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-purple-200 hover:shadow-xl"><div className="relative h-32" style={{background:`linear-gradient(135deg, ${business.theme_color} 0%, ${business.theme_color}dd 100%)`}}>{business.logo_url&&<div className="absolute -bottom-8 left-6 flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border-4 border-white bg-white shadow-lg"><img src={business.logo_url} alt={business.business_name} className="h-full w-full object-cover"/></div>}</div><CardContent className="p-6 pt-12"><Badge variant="secondary" className="mb-3 rounded-full">{business.business_type}</Badge><h3 className="mb-2 text-xl font-bold">{business.business_name}</h3>{business.description&&<p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{business.description}</p>}<div className="space-y-2 text-sm">{business.address&&<div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4"/><span className="line-clamp-1">{business.address}</span></div>}{business.phone&&<div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4"/><span>{business.phone}</span></div>}</div><div className="mt-4 flex gap-2">{business.whatsapp_number&&<div className="flex items-center gap-1 text-xs text-green-600"><MessageCircle className="h-3 w-3"/><span>WhatsApp</span></div>}{business.instagram_handle&&<div className="flex items-center gap-1 text-xs text-pink-600"><Instagram className="h-3 w-3"/><span>Instagram</span></div>}</div></CardContent></Card></Link>)}</div>}
=======
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    let mounted = true
    const supabase = getSupabaseClient()
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setSignedIn(!!data.user)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setSignedIn(!!session?.user)
    })
    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const categories = useMemo(() => {
    const cats = new Set(businesses.map((b) => b.business_type))
    return Array.from(cats).sort()
  }, [businesses])

  const filteredBusinesses = useMemo(() => {
    return businesses.filter((business) => {
      const matchesSearch =
        searchQuery === "" ||
        business.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        business.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        business.business_type.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = selectedCategory === null || business.business_type === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [businesses, searchQuery, selectedCategory])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
            >
              Zentry
            </Link>
            <nav className="flex items-center gap-2">
              <Link href={signedIn ? "/account" : "/auth/login?next=%2Faccount"}>
                <Button variant="ghost" className="rounded-full">
                  <UserCircle className="mr-2 h-4 w-4" />
                  {signedIn ? "My Account" : "Sign in"}
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button variant="outline" className="rounded-full bg-transparent">
                  List Your Business
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
            Discover Local Businesses
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Browse through our collection of amazing local businesses and find exactly what you need
          </p>
        </div>

        <div className="mx-auto mb-8 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search businesses, products, or services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 rounded-full border-2 bg-white/80 pl-12 backdrop-blur focus:border-purple-500"
            />
          </div>
        </div>

        <div className="mb-12 flex flex-wrap justify-center gap-2">
          <Button variant={selectedCategory === null ? "default" : "outline"} onClick={() => setSelectedCategory(null)} className="rounded-full">
            All
          </Button>
          {categories.map((category) => (
            <Button key={category} variant={selectedCategory === category ? "default" : "outline"} onClick={() => setSelectedCategory(category)} className="rounded-full">
              {category}
            </Button>
          ))}
        </div>

        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {filteredBusinesses.length} {filteredBusinesses.length === 1 ? "business" : "businesses"}
          </p>
        </div>

        {filteredBusinesses.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">No businesses found matching your criteria</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBusinesses.map((business) => (
              <Link key={business.id} href={`/${business.slug}`}>
                <Card className="h-full overflow-hidden rounded-2xl border-2 bg-white/80 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-purple-200 hover:shadow-xl">
                  <div className="relative h-32" style={{ background: `linear-gradient(135deg, ${business.theme_color} 0%, ${business.theme_color}dd 100%)` }}>
                    {business.logo_url && (
                      <div className="absolute -bottom-8 left-6">
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border-4 border-white bg-white shadow-lg">
                          <img src={business.logo_url || "/placeholder.svg"} alt={business.business_name} className="h-full w-full object-cover" />
                        </div>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-6 pt-12">
                    <Badge variant="secondary" className="mb-3 rounded-full">{business.business_type}</Badge>
                    <h3 className="mb-2 text-xl font-bold">{business.business_name}</h3>
                    {business.description && <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{business.description}</p>}

                    <div className="space-y-2 text-sm">
                      {business.address && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /><span className="line-clamp-1">{business.address}</span></div>}
                      {business.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /><span>{business.phone}</span></div>}
                    </div>

                    <div className="mt-4 flex gap-2">
                      {business.whatsapp_number && <div className="flex items-center gap-1 text-xs text-green-600"><MessageCircle className="h-3 w-3" /><span>WhatsApp</span></div>}
                      {business.instagram_handle && <div className="flex items-center gap-1 text-xs text-pink-600"><Instagram className="h-3 w-3" /><span>Instagram</span></div>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <footer className="mt-20 border-t bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} <span className="font-semibold">Zentry</span>. Empowering local businesses.</p>
        </div>
      </footer>
>>>>>>> 447dd1603412727f3d023f52cafc26f2dfa59e51
    </div>
    <footer className="mt-20 border-t bg-white/80 backdrop-blur"><div className="container mx-auto px-4 py-8 text-center"><p className="text-sm text-muted-foreground">© 2026 <span className="font-semibold">Zentry</span>. Empowering local businesses.</p></div></footer>
  </div>
}
