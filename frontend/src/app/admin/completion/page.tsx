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
import { ChevronLeft, CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react"

export default function AdminCompletionPage() {
  const { user, isAuthenticated } = useAuth()
  const { role } = useRole()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [quarter, setQuarter] = useState("Q1")

  const fetchCompletion = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`http://localhost:5001/api/admin/completion?quarter=${quarter}`)
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch {
      toast.error("Failed to load completion data")
    } finally {
      setIsLoading(false)
    }
  }, [quarter])

  useEffect(() => {
    if (!isAuthenticated) { router.push("/"); return }
    if (role !== "ADMIN" && role !== "MANAGER") { router.push("/dashboard"); return }
    fetchCompletion()
  }, [isAuthenticated, role, router, fetchCompletion])

  if (!isAuthenticated || (role !== "ADMIN" && role !== "MANAGER")) return null

  const employees = data?.employees || []
  const completed = employees.filter((e: any) => e.checkInCompleted).length
  const total = employees.length
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="flex flex-col flex-1 bg-background">
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto">

          <div className="mb-8">
            <Link href="/admin" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground bg-card border border-border px-3 py-1.5 rounded-full shadow-sm hover:bg-background mb-6">
              <ChevronLeft className="h-4 w-4 mr-1" /> Admin Dashboard
            </Link>
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">Completion Dashboard</h1>
                <p className="text-sm text-muted-foreground">Monitor check-in completion rates across the organization.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1 shadow-sm">
                  {['Q1','Q2','Q3','Q4'].map(q => (
                    <button key={q} onClick={() => setQuarter(q)}
                      className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${quarter === q ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}>
                      {q}
                    </button>
                  ))}
                </div>
                <Button onClick={fetchCompletion} variant="outline" className="border-border h-9 w-9 p-0">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="bg-card border-border shadow-sm rounded-xl">
              <CardContent className="p-5 text-center">
                <p className="text-3xl font-black text-foreground">{total}</p>
                <p className="text-xs text-muted-foreground font-semibold mt-1">Employees with Approved Sheets</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-sm rounded-xl">
              <CardContent className="p-5 text-center">
                <p className="text-3xl font-black text-emerald-600">{completed}</p>
                <p className="text-xs text-muted-foreground font-semibold mt-1">{quarter} Check-ins Completed</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-sm rounded-xl">
              <CardContent className="p-5">
                <p className={`text-3xl font-black ${completionRate >= 80 ? 'text-emerald-600' : completionRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{completionRate}%</p>
                <p className="text-xs text-muted-foreground font-semibold mt-1">Completion Rate</p>
                <Progress
                  value={completionRate}
                  className="h-1.5 mt-2 bg-secondary"
                  indicatorClassName={completionRate >= 80 ? "bg-emerald-500" : completionRate >= 50 ? "bg-amber-500" : "bg-red-500"}
                />
              </CardContent>
            </Card>
          </div>

          {/* Employees List */}
          <Card className="border-border shadow-sm rounded-xl overflow-hidden bg-card">
            <CardHeader className="border-b border-border px-6 py-4">
              <CardTitle className="text-base font-semibold text-foreground">Employee Status — {quarter}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : employees.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">No approved goal sheets found for this cycle.</div>
              ) : (
                <div className="divide-y divide-border">
                  {employees.map((emp: any) => (
                    <div key={emp.id} className="p-5 flex items-center gap-4">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${emp.checkInCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-secondary text-muted-foreground'}`}>
                        {emp.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{emp.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Reports to: {emp.manager}</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        {emp.hasApprovedSheet && (
                          <div className="text-right">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Progress</p>
                            <p className={`text-sm font-bold ${emp.avgProgress >= 80 ? 'text-emerald-600' : emp.avgProgress >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                              {emp.avgProgress.toFixed(1)}%
                            </p>
                          </div>
                        )}
                        {!emp.hasApprovedSheet ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                            <AlertCircle className="h-3 w-3" /> No Approved Sheet
                          </span>
                        ) : emp.checkInCompleted ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="h-3 w-3" /> Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-full">
                            <XCircle className="h-3 w-3" /> Incomplete
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
