"use client"

import { useAuth } from "@/context/auth-context"
import { usePathname } from "next/navigation"

export function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const pathname = usePathname()

  const isLoginPage = pathname === "/"
  const showSidebar = !isLoading && isAuthenticated && !isLoginPage

  return (
    <main className={`flex-1 min-w-0 flex flex-col min-h-screen ${showSidebar ? "ml-60" : ""}`}>
      {children}
    </main>
  )
}
