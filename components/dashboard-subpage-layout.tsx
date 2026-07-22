"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowLeft } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export function DashboardSubpageLayout({
  title,
  description,
  children,
  backHref = "/dashboard",
  backLabel = "Back to Dashboard",
}: {
  title: string
  description?: string
  children: ReactNode
  backHref?: string
  backLabel?: string
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Zentry
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href={backHref}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {backLabel}
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          {description ? <p className="text-muted-foreground">{description}</p> : null}
        </div>
        {children}
      </div>
    </div>
  )
}
