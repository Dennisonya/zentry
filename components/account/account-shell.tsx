"use client"

import type { ReactNode } from "react"
import { AccountSidebar } from "./account-sidebar"

export function AccountShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen overflow-x-hidden bg-muted/30">
      <AccountSidebar />
      <div className="min-w-0 flex-1 overflow-x-hidden">{children}</div>
    </div>
  )
}
