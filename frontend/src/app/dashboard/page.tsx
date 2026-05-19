"use client"

import React, { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useRole } from "@/context/role-context"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  Target, Users, AlertCircle, CheckCircle2, ChevronRight,
  Settings, ClipboardList, PlusCircle, Clock, TrendingUp,
  BarChart2, Layers, Activity, UserCheck
} from "lucide-react"
import { motion } from "framer-motion"

const container: any = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
}
const item: any = {
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 120, damping: 14 } }
}

export default function Dashboard() {
  const { role } = useRole()
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) router.push("/")
  }, [isAuthenticated, router])

  if (!isAuthenticated) return null

  return (
    <motion.div
      className="flex-1 p-8 bg-background"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div className="mb-8" variants={item}>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          {role === "EMPLOYEE" && "My Dashboard"}
          {role === "MANAGER" && "Manager Dashboard"}
          {role === "ADMIN" && "Admin Dashboard"}
        </h1>
        <p className="text-sm text-slate-500">
          {role === "EMPLOYEE" && "Track your goals and performance for FY 2026."}
          {role === "MANAGER" && "Monitor your team's progress and pending actions."}
          {role === "ADMIN" && "Organisation-wide metrics and management."}
        </p>
      </motion.div>

      {role === "EMPLOYEE" && <EmployeeDashboard />}
      {role === "MANAGER" && <ManagerDashboard />}
      {role === "ADMIN" && <AdminDashboard />}
    </motion.div>
  )
}

/* ─── Employee Dashboard ────────────────────────────────────────────────────── */
function EmployeeDashboard() {
  const { user } = useAuth()
  const [sheets, setSheets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    fetch(`http://localhost:5001/api/goal-sheets/employee/${user.id}`)
      .then(r => r.json())
      .then(d => { setSheets(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user?.id])

  const latestSheet = sheets[0]
  const totalGoals = latestSheet?.goals?.length || 0
  const approvedGoals = sheets.filter(s => s.status === "APPROVED").length
  const overallScore = latestSheet?.goals?.reduce((sum: number, g: any) => {
    const latest = g.achievements?.[0]
    return sum + (latest?.progressScore || 0) * (g.weightage / 100)
  }, 0) || 0

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Stat cards */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-4" variants={item}>
        <StatCard
          icon={<Layers className="h-5 w-5 text-indigo-600" />}
          bg="bg-indigo-50"
          label="Goal Sheets"
          value={sheets.length}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          bg="bg-emerald-50"
          label="Approved"
          value={approvedGoals}
          color="text-emerald-600"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-violet-600" />}
          bg="bg-violet-50"
          label="Overall Score"
          value={`${overallScore.toFixed(1)}%`}
          color="text-violet-600"
        />
      </motion.div>

      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" variants={item}>
        {/* Goal sheet list */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">My Goal Sheets</h2>
            <Link href="/goals/create">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs">
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> New Sheet
              </Button>
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : sheets.length === 0 ? (
            <EmptyState
              icon={<Target className="h-8 w-8 text-slate-300" />}
              title="No goal sheets yet"
              description="Create your first goal sheet to get started."
              action={<Link href="/goals/create"><Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-700">Create Goal Sheet</Button></Link>}
            />
          ) : (
            sheets.map(sheet => {
              const score = sheet.goals?.reduce((s: number, g: any) => s + (g.achievements?.[0]?.progressScore || 0) * (g.weightage / 100), 0) || 0
              const statusCfg: any = {
                DRAFT: { label: "Draft", cls: "bg-slate-100 text-slate-600" },
                PENDING_APPROVAL: { label: "Pending Approval", cls: "bg-amber-50 text-amber-700" },
                APPROVED: { label: "Approved", cls: "bg-emerald-50 text-emerald-700" },
                RETURNED: { label: "Returned", cls: "bg-red-50 text-red-700" },
              }
              const s = statusCfg[sheet.status] || statusCfg.DRAFT
              return (
                <Card key={sheet.id} className="bg-white border-slate-200 shadow-sm rounded-xl">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{sheet.cycle?.name || "FY 2026"} Goal Sheet</p>
                        <p className="text-xs text-slate-500">{sheet.goals?.length || 0} goals</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
                    </div>
                    {sheet.status === "APPROVED" && (
                      <div>
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Overall Progress</span>
                          <span className="font-bold text-slate-700">{score.toFixed(1)}%</span>
                        </div>
                        <Progress value={score} className="h-1.5 bg-slate-100"
                          indicatorClassName={score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500"} />
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Link href="/goals"><Button size="sm" variant="outline" className="h-7 text-xs border-slate-200">View Details</Button></Link>
                      {sheet.status === "APPROVED" && (
                        <Link href={`/goals/achievements?sheetId=${sheet.id}`}>
                          <Button size="sm" className="h-7 text-xs bg-indigo-600 text-white hover:bg-indigo-700">Update Progress</Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-800">Quick Actions</h2>
          <Link href="/goals"><ActionCard icon={<Target className="h-4 w-4 text-indigo-600" />} bg="bg-indigo-50" title="My Goals" desc="View all your objectives" /></Link>
          <Link href="/goals/create"><ActionCard icon={<PlusCircle className="h-4 w-4 text-emerald-600" />} bg="bg-emerald-50" title="New Goal Sheet" desc="Define your objectives" /></Link>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Manager Dashboard ─────────────────────────────────────────────────────── */
function ManagerDashboard() {
  const { user } = useAuth()
  const [reports, setReports] = useState<any[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      fetch(`http://localhost:5001/api/users/${user.id}/reports`).then(r => r.json()),
      fetch(`http://localhost:5001/api/goal-sheets/pending/${user.id}`).then(r => r.json()),
    ]).then(([teamData, pendingData]) => {
      setReports(teamData)
      setPendingCount(Array.isArray(pendingData) ? pendingData.length : 0)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user?.id])

  const approved = reports.filter(r => r.goalSheets?.[0]?.status === "APPROVED").length
  const pending = reports.filter(r => r.goalSheets?.[0]?.status === "PENDING_APPROVAL").length

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-4" variants={item}>
        <StatCard icon={<Users className="h-5 w-5 text-indigo-600" />} bg="bg-indigo-50" label="Direct Reports" value={reports.length} />
        <StatCard icon={<Clock className="h-5 w-5 text-amber-600" />} bg="bg-amber-50" label="Pending Approvals" value={pendingCount} color="text-amber-600" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} bg="bg-emerald-50" label="Goals Approved" value={approved} color="text-emerald-600" />
      </motion.div>

      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" variants={item}>
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-base font-semibold text-slate-800">Team Progress</h2>
          {loading ? <LoadingSpinner /> : reports.length === 0 ? (
            <EmptyState icon={<Users className="h-8 w-8 text-slate-300" />} title="No direct reports" description="No team members are assigned to you yet." />
          ) : (
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl overflow-hidden">
              <div className="divide-y divide-slate-100">
                {reports.map(member => {
                  const sheet = member.goalSheets?.[0]
                  const status = sheet?.status || "NO_SHEET"
                  const statusCfg: any = {
                    APPROVED: { label: "Approved", cls: "bg-emerald-50 text-emerald-700" },
                    PENDING_APPROVAL: { label: "Pending", cls: "bg-amber-50 text-amber-700" },
                    DRAFT: { label: "Draft", cls: "bg-slate-100 text-slate-600" },
                    RETURNED: { label: "Returned", cls: "bg-red-50 text-red-700" },
                    NO_SHEET: { label: "No Sheet", cls: "bg-slate-50 text-slate-400" },
                  }
                  const s = statusCfg[status] || statusCfg.NO_SHEET
                  return (
                    <div key={member.id} className="p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                      <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm shrink-0">
                        {(member.firstName?.[0] || "") + (member.lastName?.[0] || "")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{member.firstName} {member.lastName}</p>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls} shrink-0`}>{s.label}</span>
                      {status === "PENDING_APPROVAL" && (
                        <Link href="/manager/approvals">
                          <Button size="sm" variant="outline" className="h-7 text-xs border-amber-200 text-amber-700 hover:bg-amber-50 shrink-0">Review</Button>
                        </Link>
                      )}
                      {status === "APPROVED" && (
                        <Link href="/manager/checkins">
                          <Button size="sm" variant="outline" className="h-7 text-xs border-slate-200 shrink-0">Check-in</Button>
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-800">Actions</h2>
          <Link href="/manager/approvals"><ActionCard icon={<UserCheck className="h-4 w-4 text-amber-600" />} bg="bg-amber-50" title={`Pending Approvals (${pendingCount})`} desc="Review goal sheets" /></Link>
          <Link href="/manager/checkins"><ActionCard icon={<Activity className="h-4 w-4 text-indigo-600" />} bg="bg-indigo-50" title="Quarterly Check-ins" desc={`${approved} members ready`} /></Link>
          <Link href="/team"><ActionCard icon={<Users className="h-4 w-4 text-violet-600" />} bg="bg-violet-50" title="My Team" desc="Full team overview" /></Link>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Admin Dashboard ───────────────────────────────────────────────────────── */
function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("http://localhost:5001/api/admin/stats")
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  const modules = [
    { href: "/admin/cycles", icon: <Settings className="h-5 w-5 text-indigo-600" />, bg: "bg-indigo-50", title: "Performance Cycles", desc: "Manage FY cycles and phases" },
    { href: "/admin/users", icon: <Users className="h-5 w-5 text-violet-600" />, bg: "bg-violet-50", title: "Org Hierarchy", desc: "Employees and reporting lines" },
    { href: "/admin/goal-sheets", icon: <Layers className="h-5 w-5 text-emerald-600" />, bg: "bg-emerald-50", title: "All Goal Sheets", desc: "Review every employee sheet" },
    { href: "/admin/reports", icon: <BarChart2 className="h-5 w-5 text-rose-600" />, bg: "bg-rose-50", title: "Reports & Analytics", desc: "Export achievement data" },
    { href: "/admin/completion", icon: <Activity className="h-5 w-5 text-cyan-600" />, bg: "bg-cyan-50", title: "Completion Dashboard", desc: "Check-in rates across org" },
    { href: "/admin/audit-logs", icon: <ClipboardList className="h-5 w-5 text-amber-600" />, bg: "bg-amber-50", title: "Audit Logs", desc: "Track post-approval changes" },
  ]

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4" variants={item}>
        <StatCard icon={<Users className="h-5 w-5 text-indigo-600" />} bg="bg-indigo-50" label="Total Users" value={stats?.totalUsers || 0} />
        <StatCard icon={<Clock className="h-5 w-5 text-amber-600" />} bg="bg-amber-50" label="Pending Approvals" value={stats?.pendingSheets || 0} color="text-amber-600" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} bg="bg-emerald-50" label="Approved Sheets" value={stats?.approvedSheets || 0} color="text-emerald-600" />
        <StatCard icon={<Target className="h-5 w-5 text-violet-600" />} bg="bg-violet-50" label="Total Goals" value={stats?.totalGoals || 0} color="text-violet-600" />
      </motion.div>

      {stats && (
        <motion.div variants={item}>
          <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
            <CardHeader className="border-b border-slate-100 px-6 py-4">
              <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
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
                    <span className={`font-bold ${m.value >= 80 ? "text-emerald-600" : m.value >= 50 ? "text-amber-600" : "text-red-600"}`}>{m.value}%</span>
                  </div>
                  <Progress value={m.value} className="h-2 bg-slate-100"
                    indicatorClassName={m.value >= 80 ? "bg-emerald-500" : m.value >= 50 ? "bg-amber-500" : "bg-red-500"} />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" variants={item}>
        {modules.map(mod => (
          <Link key={mod.href} href={mod.href}>
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group h-full">
              <CardContent className="p-5">
                <div className={`h-10 w-10 rounded-lg ${mod.bg} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                  {mod.icon}
                </div>
                <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{mod.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{mod.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </motion.div>
    </motion.div>
  )
}

/* ─── Shared Sub-components ─────────────────────────────────────────────────── */
function StatCard({ icon, bg, label, value, color = "text-slate-900" }: { icon: React.ReactNode; bg: string; label: string; value: any; color?: string }) {
  return (
    <motion.div variants={item}>
      <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
        <CardContent className="p-5 flex items-center gap-4">
          <div className={`h-10 w-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>{icon}</div>
          <div>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs font-semibold text-slate-500">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ActionCard({ icon, bg, title, desc }: { icon: React.ReactNode; bg: string; title: string; desc: string }) {
  return (
    <Card className="bg-white border-slate-200 shadow-sm rounded-xl hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-9 w-9 rounded-lg ${bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">{title}</p>
          <p className="text-xs text-slate-500">{desc}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
      </CardContent>
    </Card>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-48 gap-3">
      <div className="h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-slate-500">Loading...</p>
    </div>
  )
}

function EmptyState({ icon, title, description, action }: { icon: React.ReactNode; title: string; description: string; action?: React.ReactNode }) {
  return (
    <Card className="bg-white border-slate-200 shadow-sm rounded-xl p-12 text-center">
      <div className="flex justify-center mb-3 text-slate-300">{icon}</div>
      <p className="text-sm font-semibold text-slate-700 mb-1">{title}</p>
      <p className="text-xs text-slate-500 mb-4">{description}</p>
      {action}
    </Card>
  )
}
