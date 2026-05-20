"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useRole } from "@/context/role-context"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  Target, Users, AlertCircle, AlertTriangle, CheckCircle2, ChevronRight,
  Settings, ClipboardList, PlusCircle, Clock, TrendingUp,
  BarChart2, Layers, Activity, UserCheck, ArrowRight
} from "lucide-react"
import { motion } from "framer-motion"
import { apiUrl } from "@/lib/api"

/* ── Motion: Impeccable-compliant (quart ease-out, no spring/bounce) ──────── */
const container: any = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, ease: [0.25, 1, 0.5, 1] } }
}
const item: any = {
  hidden: { y: 8, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.35, ease: [0.25, 1, 0.5, 1] } }
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
        <h1 className="text-xl font-heading font-bold text-foreground mb-1">
          {role === "EMPLOYEE" && "My Dashboard"}
          {role === "MANAGER" && "Manager Dashboard"}
          {role === "ADMIN" && "Admin Dashboard"}
        </h1>
        <p className="text-sm text-muted-foreground">
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
    fetch(apiUrl(`/api/goal-sheets/employee/${user.id}`))
      .then(r => r.json())
      .then(d => { setSheets(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user?.id])

  const latestSheet = sheets[0]
  const approvedGoals = sheets.filter(s => s.status === "APPROVED").length
  const overallScore = latestSheet?.goals?.reduce((sum: number, g: any) => {
    const latest = g.achievements?.[0]
    return sum + (latest?.progressScore || 0) * (g.weightage / 100)
  }, 0) || 0

  return (
    <motion.div className="space-y-8" variants={container} initial="hidden" animate="show">
      {/* Metrics row — no card wrapping, breathing room */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-5" variants={item}>
        <MetricBlock label="Goal Sheets" value={sheets.length} accent="primary" />
        <MetricBlock label="Approved" value={approvedGoals} accent="success" />
        <MetricBlock label="Overall Score" value={`${overallScore.toFixed(1)}%`} accent="primary" />
      </motion.div>

      <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-8" variants={item}>
        {/* Goal sheet list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-heading font-semibold text-foreground">My Goal Sheets</h2>
            <Link href="/goals/create">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 text-xs">
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> New Sheet
              </Button>
            </Link>
          </div>

          {loading ? (
            <SkeletonList count={2} />
          ) : sheets.length === 0 ? (
            <EmptyState
              icon={<Target className="h-6 w-6" />}
              title="No goal sheets yet"
              description="Create your first goal sheet to start tracking objectives."
              action={<Link href="/goals/create"><Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">Create Goal Sheet</Button></Link>}
            />
          ) : (
            <div className="space-y-3">
              {sheets.map(sheet => {
                const score = sheet.goals?.reduce((s: number, g: any) => s + (g.achievements?.[0]?.progressScore || 0) * (g.weightage / 100), 0) || 0
                const statusCfg: any = {
                  DRAFT: { label: "Draft", cls: "bg-secondary text-muted-foreground" },
                  PENDING_APPROVAL: { label: "Pending", cls: "bg-amber-50 text-amber-700" },
                  APPROVED: { label: "Approved", cls: "bg-emerald-50 text-emerald-700" },
                  RETURNED: { label: "Returned", cls: "bg-red-50 text-red-700" },
                }
                const s = statusCfg[sheet.status] || statusCfg.DRAFT
                return (
                  <div key={sheet.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors" style={{ transitionDuration: 'var(--duration-normal)', transitionTimingFunction: 'var(--ease-out-quart)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{sheet.cycle?.name || "FY 2026"} Goal Sheet</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{sheet.goals?.length || 0} goals defined</p>
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
                    </div>
                    {sheet.status === "APPROVED" && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                          <span>Progress</span>
                          <span className="font-bold text-foreground tabular-nums">{score.toFixed(1)}%</span>
                        </div>
                        <Progress value={score} className="h-1.5 bg-secondary"
                          indicatorClassName={score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500"} />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Link href="/goals"><Button size="sm" variant="outline" className="h-7 text-xs border-border">View Details</Button></Link>
                      {sheet.status === "APPROVED" && (
                        <Link href={`/goals/achievements?sheetId=${sheet.id}`}>
                          <Button size="sm" className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90">Update Progress</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick actions — no card wrapping */}
        <div className="space-y-3">
          <h2 className="text-sm font-heading font-semibold text-foreground">Quick Actions</h2>
          <NavBlock href="/goals" icon={<Target className="h-4 w-4" />} title="My Goals" desc="View all your objectives" />
          <NavBlock href="/goals/create" icon={<PlusCircle className="h-4 w-4" />} title="New Goal Sheet" desc="Define your objectives" />
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
      fetch(apiUrl(`/api/users/${user.id}/reports`)).then(r => r.json()),
      fetch(apiUrl(`/api/goal-sheets/pending/${user.id}`)).then(r => r.json()),
    ]).then(([teamData, pendingData]) => {
      setReports(teamData)
      setPendingCount(Array.isArray(pendingData) ? pendingData.length : 0)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user?.id])

  const approved = reports.filter(r => r.goalSheets?.[0]?.status === "APPROVED").length

  return (
    <motion.div className="space-y-8" variants={container} initial="hidden" animate="show">
      <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-5" variants={item}>
        <MetricBlock label="Direct Reports" value={reports.length} accent="primary" />
        <MetricBlock label="Pending Approvals" value={pendingCount} accent="warning" />
        <MetricBlock label="Goals Approved" value={approved} accent="success" />
      </motion.div>

      <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-8" variants={item}>
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-heading font-semibold text-foreground">Team Progress</h2>
          {loading ? <SkeletonList count={3} /> : reports.length === 0 ? (
            <EmptyState icon={<Users className="h-6 w-6" />} title="No direct reports" description="No team members are assigned to you yet." />
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden divide-y divide-border">
              {reports.map(member => {
                const sheet = member.goalSheets?.[0]
                const status = sheet?.status || "NO_SHEET"
                const statusCfg: any = {
                  APPROVED: { label: "Approved", cls: "bg-emerald-50 text-emerald-700" },
                  PENDING_APPROVAL: { label: "Pending", cls: "bg-amber-50 text-amber-700" },
                  DRAFT: { label: "Draft", cls: "bg-secondary text-muted-foreground" },
                  RETURNED: { label: "Returned", cls: "bg-red-50 text-red-700" },
                  NO_SHEET: { label: "No Sheet", cls: "bg-secondary text-muted-foreground" },
                }
                const s = statusCfg[status] || statusCfg.NO_SHEET
                return (
                  <div key={member.id} className="p-4 flex items-center gap-3 hover:bg-accent/50 transition-colors" style={{ transitionDuration: 'var(--duration-fast)' }}>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-xs shrink-0">
                      {(member.firstName?.[0] || "") + (member.lastName?.[0] || "")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{member.firstName} {member.lastName}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.cls} shrink-0`}>{s.label}</span>
                    {status === "PENDING_APPROVAL" && (
                      <Link href="/manager/approvals">
                        <Button size="sm" variant="outline" className="h-7 text-xs border-amber-200 text-amber-700 hover:bg-amber-50 shrink-0">Review</Button>
                      </Link>
                    )}
                    {status === "APPROVED" && (
                      <Link href="/manager/checkins">
                        <Button size="sm" variant="outline" className="h-7 text-xs border-border shrink-0">Check-in</Button>
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-heading font-semibold text-foreground">Actions</h2>
          <NavBlock href="/manager/approvals" icon={<UserCheck className="h-4 w-4" />} title={`Pending Approvals (${pendingCount})`} desc="Review goal sheets" />
          <NavBlock href="/manager/checkins" icon={<Activity className="h-4 w-4" />} title="Quarterly Check-ins" desc={`${approved} members ready`} />
          <NavBlock href="/team" icon={<Users className="h-4 w-4" />} title="My Team" desc="Full team overview" />
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
    fetch(apiUrl("/api/admin/stats"))
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <SkeletonList count={4} />

  /* Different visual treatment per module category — breaks the identical-card-grid anti-pattern */
  const primaryModules = [
    { href: "/admin/cycles", icon: <Settings className="h-4 w-4" />, title: "Performance Cycles", desc: "Manage FY cycles and phases" },
    { href: "/admin/users", icon: <Users className="h-4 w-4" />, title: "Org Hierarchy", desc: "Employees and reporting lines" },
    { href: "/admin/goal-sheets", icon: <Layers className="h-4 w-4" />, title: "All Goal Sheets", desc: "Review every employee sheet" },
  ]

  const analysisModules = [
    { href: "/admin/analytics", icon: <TrendingUp className="h-4 w-4" />, title: "Analytics", desc: "QoQ trends and insights" },
    { href: "/admin/reports", icon: <BarChart2 className="h-4 w-4" />, title: "Reports", desc: "Export achievement data" },
    { href: "/admin/completion", icon: <Activity className="h-4 w-4" />, title: "Completion", desc: "Check-in rates across org" },
  ]

  const complianceModules = [
    { href: "/admin/escalations", icon: <AlertTriangle className="h-4 w-4" />, title: "Escalations", desc: "Flag overdue submissions" },
    { href: "/admin/audit-logs", icon: <ClipboardList className="h-4 w-4" />, title: "Audit Logs", desc: "Track post-approval changes" },
  ]

  return (
    <motion.div className="space-y-8" variants={container} initial="hidden" animate="show">
      {/* Metrics — distinct from cards, no icon-tile pattern */}
      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-5" variants={item}>
        <MetricBlock label="Total Users" value={stats?.totalUsers || 0} accent="primary" />
        <MetricBlock label="Pending Approvals" value={stats?.pendingSheets || 0} accent="warning" />
        <MetricBlock label="Approved Sheets" value={stats?.approvedSheets || 0} accent="success" />
        <MetricBlock label="Total Goals" value={stats?.totalGoals || 0} accent="primary" />
      </motion.div>

      {/* Adoption metrics */}
      {stats && (
        <motion.div variants={item} className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-sm font-heading font-semibold text-foreground mb-5">Adoption Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: "Goal Sheet Submission Rate", value: stats.submissionRate },
              { label: "Manager Approval Rate", value: stats.approvalRate },
            ].map(m => (
              <div key={m.label}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className={`font-bold tabular-nums ${m.value >= 80 ? "text-emerald-600" : m.value >= 50 ? "text-amber-600" : "text-red-600"}`}>{m.value}%</span>
                </div>
                <Progress value={m.value} className="h-1.5 bg-secondary"
                  indicatorClassName={m.value >= 80 ? "bg-emerald-500" : m.value >= 50 ? "bg-amber-500" : "bg-red-500"} />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Module groups — different categories have different treatment */}
      <motion.div className="space-y-6" variants={item}>
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Management</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {primaryModules.map(mod => (
              <NavBlock key={mod.href} href={mod.href} icon={mod.icon} title={mod.title} desc={mod.desc} />
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Analysis</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {analysisModules.map(mod => (
              <NavBlock key={mod.href} href={mod.href} icon={mod.icon} title={mod.title} desc={mod.desc} />
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Compliance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {complianceModules.map(mod => (
              <NavBlock key={mod.href} href={mod.href} icon={mod.icon} title={mod.title} desc={mod.desc} />
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Design System Components ──────────────────────────────────────────────── */

/**
 * MetricBlock — replaces the "hero-metric template" (StatCard with icon tile + big number).
 * Impeccable: no icon tile, no card wrapping. Just the data with clear hierarchy.
 */
function MetricBlock({ label, value, accent }: { label: string; value: any; accent: "primary" | "success" | "warning" }) {
  const accentMap = {
    primary: "text-primary",
    success: "text-emerald-600",
    warning: "text-amber-600",
  }
  const borderMap = {
    primary: "border-l-primary",
    success: "border-l-emerald-500",
    warning: "border-l-amber-500",
  }
  return (
    <motion.div variants={item}>
      <div className={`bg-card border border-border ${borderMap[accent]} border-l-2 rounded-lg px-5 py-4`}>
        <p className={`text-2xl font-heading font-bold tabular-nums ${accentMap[accent]}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </motion.div>
  )
}

/**
 * NavBlock — replaces ActionCard. No icon-tile background circle.
 * Icon is inline with text, natural weight. Arrow reveals on hover.
 */
function NavBlock({ href, icon, title, desc }: { href: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link href={href}>
      <div
        className="bg-card border border-border rounded-lg p-4 flex items-center gap-3 hover:border-primary/30 hover:bg-accent/30 cursor-pointer group transition-colors"
        style={{ transitionDuration: 'var(--duration-normal)', transitionTimingFunction: 'var(--ease-out-quart)' }}
      >
        <div className="text-muted-foreground group-hover:text-primary shrink-0 transition-colors">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-all shrink-0 -translate-x-1 group-hover:translate-x-0 opacity-0 group-hover:opacity-100" style={{ transitionDuration: 'var(--duration-normal)', transitionTimingFunction: 'var(--ease-out-quart)' }} />
      </div>
    </Link>
  )
}

/** Skeleton loading — Impeccable: "Skeleton states > spinners" */
function SkeletonList({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-secondary" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-secondary rounded w-1/3" />
              <div className="h-2 bg-secondary rounded w-1/2" />
            </div>
            <div className="h-5 w-16 bg-secondary rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ icon, title, description, action }: { icon: React.ReactNode; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="border border-dashed border-border rounded-lg py-12 px-6 text-center">
      <div className="flex justify-center mb-3 text-muted-foreground/40">{icon}</div>
      <p className="text-sm font-medium text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground mb-4">{description}</p>
      {action}
    </div>
  )
}
