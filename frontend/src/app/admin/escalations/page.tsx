"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useRole } from "@/context/role-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { ChevronLeft, AlertTriangle, Clock, Shield, Users, ArrowRight, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import { fetchJsonWithRetry } from "@/lib/api"

const SEVERITY_CONFIG: Record<string, { label: string; bg: string; color: string; icon: any }> = {
  HIGH: { label: 'High', bg: 'bg-red-50', color: 'text-red-700', icon: XCircle },
  MEDIUM: { label: 'Medium', bg: 'bg-amber-50', color: 'text-amber-700', icon: AlertTriangle },
  LOW: { label: 'Low', bg: 'bg-blue-50', color: 'text-blue-700', icon: Clock },
}

const TYPE_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  NO_SUBMISSION: { label: 'Goal Not Submitted', bg: 'bg-red-100', color: 'text-red-700' },
  APPROVAL_DELAYED: { label: 'Approval Delayed', bg: 'bg-amber-100', color: 'text-amber-700' },
  CHECKIN_MISSED: { label: 'Check-in Missed', bg: 'bg-violet-100', color: 'text-violet-700' },
}

export default function AdminEscalationsPage() {
  const { isAuthenticated } = useAuth()
  const { role } = useRole()
  const router = useRouter()
  const [backendStatus, setBackendStatus] = useState<"checking" | "sleeping" | "ready">("checking")
  const [data, setData] = useState({
    rules: [] as any[],
    violations: [] as any[],
    summary: { total: 0, high: 0, medium: 0 },
    cycle: null as any,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState("ALL")

  useEffect(() => {
    let cancelled = false

    const loadEscalations = async () => {
      if (!isAuthenticated) { router.push("/"); return }
      if (role !== "ADMIN") { router.push("/dashboard"); return }

      try {
        const payload = await fetchJsonWithRetry("/api/admin/escalations", { retries: 2, retryDelayMs: 2500 })
        if (!cancelled) {
          setBackendStatus("ready")
          setData({
            rules: Array.isArray(payload?.rules) ? payload.rules : [],
            violations: Array.isArray(payload?.violations) ? payload.violations : [],
            summary: {
              total: payload?.summary?.total || 0,
              high: payload?.summary?.high || 0,
              medium: payload?.summary?.medium || 0,
            },
            cycle: payload?.cycle || null,
          })
          setIsLoading(false)
        }
      } catch {
        if (!cancelled) {
          setBackendStatus("sleeping")
          toast.error("Backend is waking up. Escalations will load in a moment.")
          setTimeout(loadEscalations, 3000)
        }
      }
    }

    loadEscalations()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, role, router])

  if (!isAuthenticated || role !== "ADMIN") return null

  if (isLoading || backendStatus !== "ready") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8 bg-background">
        <div className="w-full max-w-6xl rounded-2xl border border-border bg-card/80 p-6 shadow-sm">
          <div className="inline-flex rounded-md border border-primary/35 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary/90">
            {backendStatus === "sleeping"
              ? "Backend is waking up. Escalations will load in a moment."
              : "Knocking on the backend door... it may be snoozing."}
          </div>

          <div className="mt-6 space-y-4 opacity-35 grayscale animate-pulse pointer-events-none select-none">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="h-24 rounded-xl border border-border bg-muted" />
              <div className="h-24 rounded-xl border border-border bg-muted" />
              <div className="h-24 rounded-xl border border-border bg-muted" />
            </div>
            <div className="h-36 rounded-xl border border-border bg-muted" />
            <div className="h-56 rounded-xl border border-border bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  const filteredViolations = filterType === "ALL"
    ? data.violations
    : data.violations.filter((v: any) => v.type === filterType)

  return (
    <div className="flex flex-col flex-1 bg-background">
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">

          <div className="mb-8">
            <Link href="/admin" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground bg-card border border-border px-3 py-1.5 rounded-full shadow-sm hover:bg-background mb-6">
              <ChevronLeft className="h-4 w-4 mr-1" /> Admin Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-foreground mb-1">Escalation Monitor</h1>
            <p className="text-sm text-muted-foreground">
              Rule-based escalation tracking for {data.cycle?.name || 'the active cycle'}. Auto-flags overdue submissions, delayed approvals, and missed check-ins.
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card className="bg-card border-border shadow-sm rounded-xl">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-black text-red-600">{data.summary?.high || 0}</p>
                  <p className="text-xs font-semibold text-muted-foreground">High Severity</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-sm rounded-xl">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-black text-amber-600">{data.summary?.medium || 0}</p>
                  <p className="text-xs font-semibold text-muted-foreground">Medium Severity</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-sm rounded-xl">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">{data.summary?.total || 0}</p>
                  <p className="text-xs font-semibold text-muted-foreground">Total Escalations</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Escalation Rules */}
          <Card className="border-border shadow-sm rounded-xl bg-card mb-6">
            <CardHeader className="border-b border-border px-6 py-4">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Active Escalation Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {data.rules?.map((rule: any) => (
                  <div key={rule.id} className="p-5 grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${TYPE_CONFIG[rule.id]?.bg || 'bg-secondary'} ${TYPE_CONFIG[rule.id]?.color || 'text-muted-foreground'}`}>
                        {TYPE_CONFIG[rule.id]?.label || rule.id}
                      </span>
                    </div>
                    <div className="col-span-5">
                      <p className="text-sm font-semibold text-foreground">{rule.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Threshold</p>
                      <p className="text-sm font-semibold text-foreground">{rule.threshold}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Chain</p>
                      <p className="text-xs text-muted-foreground">{rule.escalationChain}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Filter + Violations */}
          <div className="flex items-center gap-2 mb-4">
            {["ALL", "NO_SUBMISSION", "APPROVAL_DELAYED", "CHECKIN_MISSED"].map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  filterType === t ? 'bg-primary text-white shadow-sm' : 'bg-card border border-border text-muted-foreground hover:border-primary/30'
                }`}
              >
                {t === "ALL" ? "All" : TYPE_CONFIG[t]?.label || t.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <Card className="border-border shadow-sm rounded-xl overflow-hidden bg-card">
            <CardContent className="p-0">
              {filteredViolations.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
                  <p className="text-muted-foreground font-semibold">No escalations found</p>
                  <p className="text-xs text-muted-foreground mt-1">All employees and managers are within compliance thresholds.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredViolations.map((v: any, i: number) => {
                    const sev = SEVERITY_CONFIG[v.severity] || SEVERITY_CONFIG.MEDIUM
                    const typ = TYPE_CONFIG[v.type]
                    const SevIcon = sev.icon
                    return (
                      <div key={i} className="p-5 grid grid-cols-12 gap-4 items-center hover:bg-background/70 transition-colors">
                        <div className="col-span-1">
                          <div className={`h-8 w-8 rounded-lg ${sev.bg} flex items-center justify-center`}>
                            <SevIcon className={`h-4 w-4 ${sev.color}`} />
                          </div>
                        </div>
                        <div className="col-span-3">
                          <p className="text-sm font-semibold text-foreground">{v.employee}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{v.manager}</span>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${typ?.bg || 'bg-secondary'} ${typ?.color || 'text-muted-foreground'}`}>
                            {typ?.label || v.type}
                          </span>
                        </div>
                        <div className="col-span-4">
                          <p className="text-xs text-muted-foreground">{v.message}</p>
                        </div>
                        <div className="col-span-2 text-right">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${sev.bg} ${sev.color}`}>
                            {v.daysOverdue}d overdue
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
