"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useRole } from "@/context/role-context"
import { useCycle } from "@/context/cycle-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { Target, CheckCircle2, Clock, Users, Activity, MessageSquare } from "lucide-react"
import { Progress } from "@/components/ui/progress"

const QUARTER_OPTIONS = ["Q1", "Q2", "Q3", "Q4"] as const
type Quarter = typeof QUARTER_OPTIONS[number]

export default function ManagerCheckinsPage() {
  const { user, isAuthenticated } = useAuth()
  const { role } = useRole()
  const { phase } = useCycle()
  const router = useRouter()

  const [employees, setEmployees] = useState<any[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null)
  const [goalSheets, setGoalSheets] = useState<any[]>([])
  const [feedback, setFeedback] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Dynamic quarter from phase selector or manual override
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter>(() => {
    if (phase === "Q1" || phase === "Q2" || phase === "Q3" || phase === "Q4") return phase as Quarter
    return "Q1"
  })

  // Sync quarter when phase changes
  useEffect(() => {
    if (phase === "Q1" || phase === "Q2" || phase === "Q3" || phase === "Q4") {
      setSelectedQuarter(phase as Quarter)
    }
  }, [phase])

  useEffect(() => {
    if (!isAuthenticated || role === "EMPLOYEE") {
      router.push("/dashboard")
      return
    }

    // Fetch ONLY direct reports (not all users)
    if (user?.id) {
      fetch(`http://localhost:5001/api/users/${user.id}/reports`)
        .then(res => res.json())
        .then(data => {
          setEmployees(Array.isArray(data) ? data : [])
          setIsLoading(false)
        })
        .catch(() => {
          setIsLoading(false)
        })
    }
  }, [isAuthenticated, role, router, user?.id])

  const loadEmployeeGoals = async (empId: string) => {
    try {
      const res = await fetch(`http://localhost:5001/api/goal-sheets/employee/${empId}`)
      if (!res.ok) throw new Error("Failed to load goals")
      const data = await res.json()

      const approvedSheets = data.filter((s: any) => s.status === "APPROVED")
      setGoalSheets(approvedSheets)

      const emp = employees.find(e => e.id === empId)
      setSelectedEmployee(emp)
      setFeedback("")
    } catch (err) {
      toast.error("Failed to load employee data")
    }
  }

  const handleConductCheckIn = async (sheetId: string) => {
    if (!feedback.trim()) {
      toast.error("Please provide feedback for this check-in")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`http://localhost:5001/api/check-ins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          managerId: user?.id,
          employeeId: selectedEmployee.id,
          goalSheetId: sheetId,
          quarter: selectedQuarter,
          feedback
        })
      })

      if (!res.ok) throw new Error("Failed to complete check-in")

      toast.success(`${selectedQuarter} Check-in completed for ${selectedEmployee.firstName}!`)
      setFeedback("")
      setSelectedEmployee(null)
    } catch (err) {
      toast.error("Error conducting check-in")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAuthenticated || role === "EMPLOYEE") return null

  return (
    <div className="flex flex-col flex-1 bg-background">
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">

          <div className="mb-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">Quarterly Check-ins</h1>
                <p className="text-sm text-muted-foreground">Conduct meaningful performance conversations and provide structured feedback.</p>
              </div>

              {/* Quarter Selector */}
              <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1 shadow-sm">
                {QUARTER_OPTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => setSelectedQuarter(q)}
                    className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${selectedQuarter === q ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            {/* Team List Sidebar */}
            <div className="lg:col-span-4">
              <Card className="shadow-sm border-border rounded-xl overflow-hidden bg-card">
                <CardHeader className="border-b border-border pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-foreground">Your Direct Reports</CardTitle>
                    <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {employees.length}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : employees.length === 0 ? (
                    <div className="p-6 text-center">
                      <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No direct reports assigned</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border max-h-[500px] overflow-auto">
                      {employees.map((emp) => {
                        const sheetStatus = emp.goalSheets?.[0]?.status
                        return (
                          <button
                            key={emp.id}
                            onClick={() => loadEmployeeGoals(emp.id)}
                            className={`w-full text-left p-4 transition-colors flex items-center gap-3 ${
                              selectedEmployee?.id === emp.id
                              ? 'bg-primary/10 border-l-4 border-primary'
                              : 'hover:bg-background border-l-4 border-transparent'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              selectedEmployee?.id === emp.id ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
                            }`}>
                              {(emp.firstName?.[0] || '') + (emp.lastName?.[0] || '')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold ${selectedEmployee?.id === emp.id ? 'text-foreground' : 'text-foreground'}`}>
                                {emp.firstName} {emp.lastName}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {sheetStatus === "APPROVED" ? (
                                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">Approved</span>
                                ) : sheetStatus ? (
                                  <span className="text-[10px] font-bold bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">{sheetStatus.replace('_', ' ')}</span>
                                ) : (
                                  <span className="text-[10px] font-bold bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">No Sheet</span>
                                )}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Check-in Content */}
            <div className="lg:col-span-8">
              {!selectedEmployee ? (
                <Card className="shadow-sm border-border rounded-xl border-dashed bg-transparent h-64 flex flex-col items-center justify-center text-center">
                  <Users className="h-8 w-8 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-1">Select a team member</h3>
                  <p className="text-sm text-muted-foreground">Choose a direct report to conduct their {selectedQuarter} check-in.</p>
                </Card>
              ) : goalSheets.length === 0 ? (
                <Card className="shadow-sm border-border rounded-xl p-12 text-center bg-card">
                  <Clock className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-1">No Approved Goals</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedEmployee.firstName} doesn&apos;t have an approved goal sheet yet.
                  </p>
                </Card>
              ) : (
                <div className="space-y-6">
                  {goalSheets.map(sheet => {
                    const totalProgress = sheet.goals.reduce((sum: number, g: any) => {
                      const qAch = g.achievements?.find((a: any) => a.quarter === selectedQuarter)
                      return sum + (qAch?.progressScore || 0) * (g.weightage / 100)
                    }, 0)

                    return (
                      <Card key={sheet.id} className="shadow-sm border-border rounded-xl overflow-hidden bg-card">
                        <CardHeader className="bg-background border-b border-border pb-4 flex flex-row items-center justify-between">
                          <div>
                            <CardTitle className="text-base font-semibold text-foreground">{selectedEmployee.firstName}&apos;s Goals</CardTitle>
                            <CardDescription className="text-xs font-medium text-muted-foreground mt-1">{sheet.cycle?.name || 'FY 2026'} Cycle · {selectedQuarter} Check-in</CardDescription>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{selectedQuarter} Score</p>
                            <p className="text-2xl font-black text-primary">{totalProgress.toFixed(1)}%</p>
                          </div>
                        </CardHeader>

                        <CardContent className="p-0">
                          <div className="divide-y divide-border">
                            {sheet.goals.map((goal: any) => {
                              const qAch = goal.achievements?.find((a: any) => a.quarter === selectedQuarter)
                              const latest = qAch || goal.achievements?.[0]
                              const score = qAch ? qAch.progressScore : 0
                              const actual = qAch ? qAch.actual : "No data"

                              return (
                                <div key={goal.id} className="p-6">
                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                                    <div className="flex-1">
                                      <h4 className="text-sm font-semibold text-foreground mb-1">
                                        {goal.title}
                                        {goal.isShared && (
                                          <span className="ml-2 text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded uppercase font-bold">
                                            Shared
                                          </span>
                                        )}
                                      </h4>
                                      <div className="flex gap-4">
                                        <span className="text-xs text-muted-foreground">Target: {goal.target} {goal.uom}</span>
                                        <span className="text-xs text-muted-foreground">Weight: {goal.weightage}%</span>
                                        {goal.optimizationDirection && (
                                          <span className="text-xs text-muted-foreground">({goal.optimizationDirection.replace('_', ' ')})</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-lg font-bold text-foreground block">{score.toFixed(0)}%</span>
                                      <span className="text-xs text-muted-foreground">Actual: {actual}</span>
                                    </div>
                                  </div>
                                  <Progress value={score} className="h-1.5 bg-secondary" indicatorClassName={score > 80 ? "bg-emerald-500" : score > 50 ? "bg-amber-500" : "bg-red-500"} />
                                </div>
                              )
                            })}
                          </div>

                          <div className="p-6 bg-background border-t border-border">
                            <h4 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-primary" /> Manager Feedback ({selectedQuarter})
                            </h4>
                            <textarea
                              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y mb-4 min-h-[100px]"
                              placeholder={`Provide constructive feedback for ${selectedEmployee.firstName}'s ${selectedQuarter} performance...`}
                              value={feedback}
                              onChange={(e) => setFeedback(e.target.value)}
                            />
                            <div className="flex justify-end">
                              <Button
                                onClick={() => handleConductCheckIn(sheet.id)}
                                disabled={isSubmitting || !feedback.trim()}
                                className="bg-primary hover:bg-primary/90 text-white shadow-sm"
                              >
                                {isSubmitting ? 'Recording...' : `Complete ${selectedQuarter} Check-in`}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
