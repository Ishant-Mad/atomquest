"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRole } from "@/context/role-context"
import { useAuth } from "@/context/auth-context"
import { 
  LayoutDashboard, Target, Activity, Award, 
  Settings, Users, Shield, BarChart2,
  FileText, Layers, Tag
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
        <div className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
          isActive
            ? "bg-indigo-50 text-indigo-700 font-semibold"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 font-medium"
        }`}>
          <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
          <span className="text-sm truncate">{label}</span>
        </div>
      </Link>
    )
  }

  return (
    <div className="w-60 border-r border-slate-200 bg-white flex flex-col h-screen fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-slate-200 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Target className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight text-slate-900">AtomQuest</span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-0.5">
        {visibleNav.map(item => (
          <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
        ))}

        {/* Admin Section */}
        {role === "ADMIN" && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Admin</p>
            {adminNavItems.map(item => (
              <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
