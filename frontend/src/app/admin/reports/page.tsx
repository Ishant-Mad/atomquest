"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { useRole } from "@/context/role-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { ChevronLeft, Download, Filter, BarChart2 } from "lucide-react"
import { apiUrl } from "@/lib/api"

export default function AdminReportsPage() {
  const { user, isAuthenticated } = useAuth()
  const { role } = useRole()
  const router = useRouter()
  const [reportData, setReportData] = useState<any>(null)
  const [cycles, setCycles] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState({ quarter: "", cycleId: "", employeeId: "", thrustArea: "" })

  useEffect(() => {
    if (!isAuthenticated) { router.push("/"); return }
    if (role !== "ADMIN" && role !== "MANAGER") { router.push("/dashboard"); return }
    // Load cycles and users for filters
    Promise.all([
      fetch(apiUrl("/api/admin/cycles")).then(r => r.json()),
      fetch(apiUrl("/api/users")).then(r => r.json()),
    ]).then(([c, u]) => { setCycles(c); setUsers(u) }).catch(console.error)
  }, [isAuthenticated, role, router])

  const fetchReport = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.quarter) params.set("quarter", filters.quarter)
      if (filters.cycleId) params.set("cycleId", filters.cycleId)
      if (filters.employeeId) params.set("employeeId", filters.employeeId)
      if (filters.thrustArea) params.set("thrustArea", filters.thrustArea)
      const res = await fetch(apiUrl(`/api/admin/reports/achievements?${params.toString()}`))
      if (!res.ok) throw new Error()
      setReportData(await res.json())
    } catch {
      toast.error("Failed to generate report")
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  const handleExportCSV = () => {
    if (!reportData?.rows?.length) return
    const headers = ["Employee", "Email", "Cycle", "Thrust Area", "Goal Title", "UoM", "Target", "Achievement", "Status", "Progress Score", "Weightage", "Quarter"]
    const rows = reportData.rows.map((r: any) => [
      r.employee, r.email, r.cycle, r.thrustArea, r.goalTitle, r.uom,
      r.target, r.achievement, r.status, r.progressScore, r.weightage, r.quarter
    ])
    const csv = [headers, ...rows].map(r => r.map((c: any) => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url
    a.download = `achievement-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click(); URL.revokeObjectURL(url)
    toast.success("Report exported!")
  }

  if (!isAuthenticated || (role !== "ADMIN" && role !== "MANAGER")) return null

  const thrustAreas = Array.from(new Set((reportData?.rows || []).map((r: any) => r.thrustArea))).filter(Boolean)

  return (
    <div className="flex flex-col flex-1 bg-background">
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">

          <div className="mb-8">
            <Link href="/admin" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground bg-card border border-border px-3 py-1.5 rounded-full shadow-sm hover:bg-background mb-6">
              <ChevronLeft className="h-4 w-4 mr-1" /> Admin Dashboard
            </Link>
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">Achievement Reports</h1>
                <p className="text-sm text-muted-foreground">Export planned vs actual achievement data across the organization.</p>
              </div>
              {reportData?.rows?.length > 0 && (
                <Button onClick={handleExportCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Download className="h-4 w-4 mr-2" /> Export CSV
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          <Card className="border-border shadow-sm rounded-xl bg-card mb-6">
            <CardContent className="p-5 flex flex-wrap gap-4 items-end">
              <div className="space-y-1.5 flex-1 min-w-[140px]">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">Quarter</label>
                <select className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none"
                  value={filters.quarter} onChange={e => setFilters(p => ({ ...p, quarter: e.target.value }))}>
                  <option value="">All Quarters</option>
                  {['Q1','Q2','Q3','Q4'].map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 flex-1 min-w-[140px]">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">Cycle</label>
                <select className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none"
                  value={filters.cycleId} onChange={e => setFilters(p => ({ ...p, cycleId: e.target.value }))}>
                  <option value="">All Cycles</option>
                  {cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 flex-1 min-w-[140px]">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">Employee</label>
                <select className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none"
                  value={filters.employeeId} onChange={e => setFilters(p => ({ ...p, employeeId: e.target.value }))}>
                  <option value="">All Employees</option>
                  {users.filter(u => u.roles === 'EMPLOYEE').map(u => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
              </div>
              <Button onClick={fetchReport} disabled={isLoading} className="bg-primary hover:bg-primary/90 text-white">
                <BarChart2 className="h-4 w-4 mr-2" />
                {isLoading ? "Generating..." : "Generate Report"}
              </Button>
            </CardContent>
          </Card>

          {reportData && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="bg-card border-border shadow-sm rounded-xl">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-black text-primary">{reportData.rows.length}</p>
                    <p className="text-xs text-muted-foreground font-semibold mt-1">Total Goals</p>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border shadow-sm rounded-xl">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-black text-emerald-600">
                      {reportData.rows.length > 0
                        ? (reportData.rows.reduce((s: number, r: any) => s + r.progressScore, 0) / reportData.rows.length).toFixed(1)
                        : "N/A"}%
                    </p>
                    <p className="text-xs text-muted-foreground font-semibold mt-1">Avg Progress Score</p>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border shadow-sm rounded-xl">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground font-mono text-[10px]">{new Date(reportData.generatedAt).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground font-semibold mt-2">Generated At</p>
                  </CardContent>
                </Card>
              </div>

              {/* Data Table */}
              <Card className="border-border shadow-sm rounded-xl overflow-hidden bg-card">
                <CardContent className="p-0 overflow-x-auto">
                  {reportData.rows.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">No data found for the selected filters.</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-background border-b border-border">
                        <tr>
                          {["Employee", "Thrust Area", "Goal", "Target", "Achievement", "Q", "Score", "Status"].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {reportData.rows.map((row: any, i: number) => (
                          <tr key={i} className="hover:bg-background transition-colors">
                            <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{row.employee}</td>
                            <td className="px-4 py-3">
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-secondary text-muted-foreground px-2 py-0.5 rounded">{row.thrustArea}</span>
                            </td>
                            <td className="px-4 py-3 text-foreground max-w-[200px] truncate">{row.goalTitle}</td>
                            <td className="px-4 py-3 font-mono text-foreground">{row.target}</td>
                            <td className="px-4 py-3 font-mono text-foreground">{row.achievement}</td>
                            <td className="px-4 py-3 font-bold text-muted-foreground">{row.quarter}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2 min-w-[100px]">
                                <Progress
                                  value={row.progressScore}
                                  className="h-1.5 flex-1 bg-secondary"
                                  indicatorClassName={row.progressScore >= 80 ? "bg-emerald-500" : row.progressScore >= 50 ? "bg-amber-500" : "bg-red-500"}
                                />
                                <span className={`text-xs font-bold w-10 text-right ${row.progressScore >= 80 ? 'text-emerald-600' : row.progressScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                  {row.progressScore.toFixed(0)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                row.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                row.status === 'ON_TRACK' ? 'bg-blue-100 text-blue-700' :
                                'bg-secondary text-muted-foreground'
                              }`}>{row.status.replace('_', ' ')}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
