"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRole } from "@/context/role-context"
import { useAuth } from "@/context/auth-context"
import { 
  LayoutDashboard, Target, Activity, Award, 
  Settings, Users, Shield, BarChart2,
  FileText, Layers, Tag, TrendingUp, AlertTriangle
} from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()
  const { role } = useRole()
  const { isAuthenticated, isLoading } = useAuth()

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["EMPLOYEE", "MANAGER", "ADMIN"] },
    { href: "/goals", label: "My Goals", icon: Target, roles: ["EMPLOYEE", "MANAGER", "ADMIN"] },
    { href: "/team", label: "My Team", icon: Users, roles: ["MANAGER", "ADMIN"] },
    { href: "/manager/approvals", label: "Approvals", icon: Award, roles: ["MANAGER", "ADMIN"] },
    { href: "/manager/checkins", label: "Check-ins", icon: Activity, roles: ["MANAGER", "ADMIN"] },
  ]

  const adminNavItems = [
    { href: "/admin", label: "Admin Panel", icon: Shield },
    { href: "/admin/cycles", label: "Cycles", icon: Settings },
    { href: "/admin/users", label: "Org Hierarchy", icon: Users },
    { href: "/admin/thrust-areas", label: "Thrust Areas", icon: Tag },
    { href: "/admin/goal-sheets", label: "All Goal Sheets", icon: Layers },
    { href: "/admin/analytics", label: "Analytics", icon: TrendingUp },
    { href: "/admin/escalations", label: "Escalations", icon: AlertTriangle },
    { href: "/admin/audit-logs", label: "Audit Logs", icon: FileText },
    { href: "/admin/reports", label: "Reports", icon: BarChart2 },
    { href: "/admin/completion", label: "Completion", icon: Activity },
  ]

  if (isLoading || !isAuthenticated || pathname === "/") return null

  const visibleNav = navItems.filter(item => item.roles.includes(role))

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: any }) => {
    const isActive = pathname === href || (href !== "/" && pathname.startsWith(href))
    return (
      <Link href={href}>
        <div
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150 cursor-pointer ${
            isActive
              ? "bg-primary/10 text-primary font-semibold"
              : "text-muted-foreground hover:bg-accent hover:text-foreground font-medium"
          }`}
          style={{ transitionTimingFunction: 'var(--ease-out-quart)' }}
        >
          <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
          <span className="truncate">{label}</span>
        </div>
      </Link>
    )
  }

  return (
    <div className="w-60 border-r border-sidebar-border bg-sidebar flex flex-col h-screen fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-sidebar-border shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="bg-primary p-1.5 rounded-lg">
            <Target className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-heading font-bold text-base tracking-tight text-foreground">AtomQuest</span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-0.5">
        {visibleNav.map(item => (
          <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
        ))}

        {/* Admin Section */}
        {role === "ADMIN" && (
          <div className="mt-5 pt-4 border-t border-sidebar-border">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Administration</p>
            {adminNavItems.map(item => (
              <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
