"use client"
import Link from "next/link"
import { Heart } from "lucide-react"
import { AccountShell } from "@/components/account/account-shell"
import { MobileAccountNav } from "@/components/account/account-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
export default function FavoritesPage(){return <AccountShell><main className="mx-auto max-w-5xl px-5 py-6 sm:px-6 lg:px-8 lg:py-8"><header className="mb-8 flex items-center gap-3"><MobileAccountNav/><div><p className="text-sm text-muted-foreground">Businesses you love</p><h1 className="text-3xl font-bold">Favorites</h1></div></header><Card className="border-dashed"><CardContent className="flex flex-col items-center py-24 text-center"><div className="rounded-2xl bg-purple-100 p-4 text-purple-700"><Heart className="h-8 w-8"/></div><h2 className="mt-5 text-xl font-semibold">Your favorites will live here</h2><p className="mt-2 max-w-md text-sm text-muted-foreground">Save businesses from the marketplace and come back to them anytime.</p><Button asChild className="mt-6 rounded-xl"><Link href="/marketplace">Discover businesses</Link></Button></CardContent></Card></main></AccountShell>}
