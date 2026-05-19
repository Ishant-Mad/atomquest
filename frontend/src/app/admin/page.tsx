"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { useRole } from "@/context/role-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import {
  Settings, Users, Target, BarChart2, FileText, Shield, 
  CheckCircle2, Clock, ChevronRight, Activity, Layers,
  TrendingUp, AlertCircle
} from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default function AdminDashboardPage() {
  const { user, isAuthenticated } = useAuth()
  const { role } = useRole()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5001/api/admin/stats")
      if (!res.ok) throw new Error()
      setStats(await res.json())
    } catch {
      toast.error("Failed to load stats")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) { router.push("/"); return }
    if (role !== "ADMIN") { router.push("/dashboard"); return }
    fetchStats()
  }, [isAuthenticated, role, router, fetchStats])

  if (!isAuthenticated || role !== "ADMIN") return null

  const adminModules = [
    { href: "/admin/cycles", label: "Performance Cycles", icon: Settings, description: "Manage fiscal year cycles and phases", color: "indigo" },
    { href: "/admin/users", label: "Org Hierarchy", icon: Users, description: "Manage employees and reporting structure", color: "violet" },
    { href: "/admin/thrust-areas", label: "Thrust Areas", icon: Target, description: "Configure organizational focus areas", color: "blue" },
    { href: "/admin/goal-sheets", label: "All Goal Sheets", icon: Layers, description: "Review and manage all employee goal sheets", color: "emerald" },
    { href: "/admin/audit-logs", label: "Audit Logs", icon: FileText, description: "Track all post-approval changes", color: "amber" },
    { href: "/admin/reports", label: "Reports & Analytics", icon: BarChart2, description: "Export achievement and completion reports", color: "rose" },
    { href: "/admin/completion", label: "Completion Dashboard", icon: Activity, description: "Monitor check-in rates across the org", color: "cyan" },
  ]

  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    violet: "bg-violet-50 text-violet-600",
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    cyan: "bg-cyan-50 text-cyan-600",
  }

  return (
    <div className="flex flex-col flex-1 bg-slate-50/50">
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Admin Dashboard</h1>
            <p className="text-sm text-slate-500">
              {stats?.activeCycle ? `Active Cycle: ${stats.activeCycle.name}` : "No active performance cycle"} · Manage your organization's goal ecosystem.
            </p>
          </div>

          {/* Stats Row */}
          {!isLoading && stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-indigo-600" },
                { label: "Pending Approvals", value: stats.pendingSheets, icon: Clock, color: "text-amber-600" },
                { label: "Approved Sheets", value: stats.approvedSheets, icon: CheckCircle2, color: "text-emerald-600" },
                { label: "Total Goals", value: stats.totalGoals, icon: Target, color: "text-violet-600" },
              ].map(stat => (
                <Card key={stat.label} className="bg-white border-slate-200 shadow-sm rounded-xl">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-slate-500">{stat.label}</p>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                    <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Adoption Meters */}
          {!isLoading && stats && (
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl mb-8">
              <CardHeader className="border-b border-slate-100 px-6 py-4">
                <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-600" /> Adoption Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: "Goal Sheet Submission Rate", value: stats.submissionRate },
                  { label: "Manager Approval Rate", value: stats.approvalRate },
                ].map(m => (
                  <div key={m.label}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600 font-medium">{m.label}</span>
                      <span className={`font-bold ${m.value >= 80 ? 'text-emerald-600' : m.value >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                        {m.value}%
                      </span>
                    </div>
                    <Progress
                      value={m.value}
                      className="h-2 bg-slate-100"
                      indicatorClassName={m.value >= 80 ? "bg-emerald-500" : m.value >= 50 ? "bg-amber-500" : "bg-red-500"}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Admin Modules Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminModules.map(mod => (
              <Link key={mod.href} href={mod.href}>
                <Card className="bg-white border-slate-200 shadow-sm rounded-xl hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group h-full">
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className={`h-10 w-10 rounded-lg ${colorMap[mod.color]} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                      <mod.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800 mb-1 group-hover:text-indigo-700 transition-colors">{mod.label}</p>
                      <p className="text-xs text-slate-500">{mod.description}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-4 text-xs font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      Open <ChevronRight className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
