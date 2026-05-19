"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRole } from "@/context/role-context"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Activity, LayoutDashboard, Target, Award, Settings, User } from "lucide-react"

export function Navbar() {
  const pathname = usePathname()
  const { role, setRole, isDemoMode } = useRole()
  const { user, isAuthenticated, logout } = useAuth()

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    ...(role === "MANAGER" || role === "ADMIN" ? [{ href: "/manager/checkins", label: "Check-ins", icon: Activity }] : []),
    ...(role === "MANAGER" || role === "ADMIN" ? [{ href: "/manager/approvals", label: "Approvals", icon: Award }] : []),
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="h-5 w-5" />
            </div>
            <span className="font-bold hidden sm:inline-block">AtomQuest</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center text-sm font-medium transition-colors hover:text-primary ${
                    isActive ? "text-foreground" : "text-foreground/60"
                  }`}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {isDemoMode && (
            <div className="flex items-center gap-2 rounded-full border border-border/40 bg-muted/50 px-3 py-1.5 text-sm shadow-sm transition-all hover:bg-muted/80">
              <User className="h-4 w-4 text-muted-foreground" />
              <Select value={role} onValueChange={(v: any) => setRole(v)}>
                <SelectTrigger className="h-7 w-[120px] border-none bg-transparent shadow-none focus:ring-0 focus:ring-offset-0 px-1 py-0">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">{user?.firstName}</span>
              <Button variant="ghost" size="sm" onClick={logout}>Logout</Button>
            </div>
          ) : (
            <Link href="/login" passHref legacyBehavior>
              <Button variant="outline" size="sm">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}