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
      fetch("http://localhost:5001/api/admin/cycles").then(r => r.json()),
      fetch("http://localhost:5001/api/users").then(r => r.json()),
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
      const res = await fetch(`http://localhost:5001/api/admin/reports/achievements?${params.toString()}`)
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
    <div className="flex flex-col flex-1 bg-slate-50/50">
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">

          <div className="mb-8">
            <Link href="/admin" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm hover:bg-slate-50 mb-6">
              <ChevronLeft className="h-4 w-4 mr-1" /> Admin Dashboard
            </Link>
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">Achievement Reports</h1>
                <p className="text-sm text-slate-500">Export planned vs actual achievement data across the organization.</p>
              </div>
              {reportData?.rows?.length > 0 && (
                <Button onClick={handleExportCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Download className="h-4 w-4 mr-2" /> Export CSV
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          <Card className="border-slate-200 shadow-sm rounded-xl bg-white mb-6">
            <CardContent className="p-5 flex flex-wrap gap-4 items-end">
              <div className="space-y-1.5 flex-1 min-w-[140px]">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quarter</label>
                <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none"
                  value={filters.quarter} onChange={e => setFilters(p => ({ ...p, quarter: e.target.value }))}>
                  <option value="">All Quarters</option>
                  {['Q1','Q2','Q3','Q4'].map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 flex-1 min-w-[140px]">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Cycle</label>
                <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none"
                  value={filters.cycleId} onChange={e => setFilters(p => ({ ...p, cycleId: e.target.value }))}>
                  <option value="">All Cycles</option>
                  {cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 flex-1 min-w-[140px]">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Employee</label>
                <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none"
                  value={filters.employeeId} onChange={e => setFilters(p => ({ ...p, employeeId: e.target.value }))}>
                  <option value="">All Employees</option>
                  {users.filter(u => u.roles === 'EMPLOYEE').map(u => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
              </div>
              <Button onClick={fetchReport} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <BarChart2 className="h-4 w-4 mr-2" />
                {isLoading ? "Generating..." : "Generate Report"}
              </Button>
            </CardContent>
          </Card>

          {reportData && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-black text-indigo-600">{reportData.rows.length}</p>
                    <p className="text-xs text-slate-500 font-semibold mt-1">Total Goals</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-black text-emerald-600">
                      {reportData.rows.length > 0
                        ? (reportData.rows.reduce((s: number, r: any) => s + r.progressScore, 0) / reportData.rows.length).toFixed(1)
                        : "N/A"}%
                    </p>
                    <p className="text-xs text-slate-500 font-semibold mt-1">Avg Progress Score</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-slate-400 font-mono text-[10px]">{new Date(reportData.generatedAt).toLocaleString()}</p>
                    <p className="text-xs text-slate-500 font-semibold mt-2">Generated At</p>
                  </CardContent>
                </Card>
              </div>

              {/* Data Table */}
              <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
                <CardContent className="p-0 overflow-x-auto">
                  {reportData.rows.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">No data found for the selected filters.</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          {["Employee", "Thrust Area", "Goal", "Target", "Achievement", "Q", "Score", "Status"].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData.rows.map((row: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{row.employee}</td>
                            <td className="px-4 py-3">
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{row.thrustArea}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate">{row.goalTitle}</td>
                            <td className="px-4 py-3 font-mono text-slate-700">{row.target}</td>
                            <td className="px-4 py-3 font-mono text-slate-700">{row.achievement}</td>
                            <td className="px-4 py-3 font-bold text-slate-600">{row.quarter}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2 min-w-[100px]">
                                <Progress
                                  value={row.progressScore}
                                  className="h-1.5 flex-1 bg-slate-100"
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
                                'bg-slate-100 text-slate-600'
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
