"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useRole } from "@/context/role-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { ChevronLeft, Target, CheckCircle2, Clock, Users, Activity, MessageSquare } from "lucide-react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"

export default function ManagerCheckinsPage() {
  const { user, isAuthenticated } = useAuth()
  const { role } = useRole()
  const router = useRouter()
  
  const [employees, setEmployees] = useState<any[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null)
  const [goalSheets, setGoalSheets] = useState<any[]>([])
  const [feedback, setFeedback] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || role === "EMPLOYEE") {
      router.push("/dashboard")
      return
    }

    // Fetch team
    fetch(`http://localhost:5001/api/users`)
      .then(res => res.json())
      .then(data => {
        setEmployees(data.filter((u: any) => u.id !== user?.id && u.roles !== "ADMIN"))
      })
      .catch(console.error)
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
          quarter: "Q1",
          feedback
        })
      })

      if (!res.ok) throw new Error("Failed to complete check-in")
      
      toast.success("Check-in completed successfully!")
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
    <div className="flex flex-col flex-1 bg-slate-50/50">
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Quarterly Check-ins</h1>
            <p className="text-sm text-slate-500">Conduct meaningful performance conversations and provide structured feedback.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            {/* Team List Sidebar */}
            <div className="lg:col-span-4">
              <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden bg-white">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="text-base font-semibold text-slate-800">Your Team</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100 max-h-[500px] overflow-auto">
                    {employees.map((emp, idx) => (
                      <button
                        key={emp.id}
                        onClick={() => loadEmployeeGoals(emp.id)}
                        className={`w-full text-left p-4 transition-colors flex items-center gap-3 ${
                          selectedEmployee?.id === emp.id 
                          ? 'bg-indigo-50 border-l-4 border-indigo-600' 
                          : 'hover:bg-slate-50 border-l-4 border-transparent'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          selectedEmployee?.id === emp.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {(emp.firstName?.[0] || '') + (emp.lastName?.[0] || '')}
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${selectedEmployee?.id === emp.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                            {emp.firstName} {emp.lastName}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">{emp.roles}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Check-in Content */}
            <div className="lg:col-span-8">
              {!selectedEmployee ? (
                <Card className="shadow-sm border-slate-200 rounded-xl border-dashed bg-transparent h-64 flex flex-col items-center justify-center text-center">
                  <Users className="h-8 w-8 text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium text-slate-700 mb-1">Select a team member</h3>
                  <p className="text-sm text-slate-500">Choose an employee to conduct their quarterly check-in.</p>
                </Card>
              ) : goalSheets.length === 0 ? (
                <Card className="shadow-sm border-slate-200 rounded-xl p-12 text-center bg-white">
                  <Clock className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-700 mb-1">No Approved Goals</h3>
                  <p className="text-sm text-slate-500">
                    {selectedEmployee.firstName} doesn't have an approved goal sheet yet.
                  </p>
                </Card>
              ) : (
                <div className="space-y-6">
                  {goalSheets.map(sheet => {
                    const totalProgress = sheet.goals.reduce((sum: number, g: any) => sum + (g.achievements?.[0]?.progressScore || 0) * (g.weightage / 100), 0);
                    
                    return (
                      <Card key={sheet.id} className="shadow-sm border-slate-200 rounded-xl overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
                          <div>
                            <CardTitle className="text-base font-semibold text-slate-800">{selectedEmployee.firstName}'s Goals</CardTitle>
                            <CardDescription className="text-xs font-medium text-slate-500 mt-1">FY 2026 Cycle</CardDescription>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Cycle Score</p>
                            <p className="text-2xl font-black text-indigo-600">{totalProgress.toFixed(1)}%</p>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="p-0">
                          <div className="divide-y divide-slate-100">
                            {sheet.goals.map((goal: any, i: number) => {
                              const latest = goal.achievements?.[0]
                              const score = latest ? latest.progressScore : 0
                              const actual = latest ? latest.actual : "No data"

                              return (
                                <div key={goal.id} className="p-6">
                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                                    <div className="flex-1">
                                      <h4 className="text-sm font-semibold text-slate-800 mb-1">
                                        {goal.title}
                                        {goal.isShared && (
                                          <span className="ml-2 text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded uppercase font-bold">
                                            Shared
                                          </span>
                                        )}
                                      </h4>
                                      <div className="flex gap-4">
                                        <span className="text-xs text-slate-500">Target: {goal.target} {goal.uom}</span>
                                        <span className="text-xs text-slate-500">Weight: {goal.weightage}%</span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-lg font-bold text-slate-900 block">{score.toFixed(0)}%</span>
                                      <span className="text-xs text-slate-500">Actual: {actual}</span>
                                    </div>
                                  </div>
                                  <Progress value={score} className="h-1.5 bg-slate-100" indicatorClassName={score > 80 ? "bg-emerald-500" : score > 50 ? "bg-amber-500" : "bg-red-500"} />
                                </div>
                              )
                            })}
                          </div>
                          
                          <div className="p-6 bg-slate-50 border-t border-slate-100">
                            <h4 className="font-semibold text-sm text-slate-800 mb-3 flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-indigo-600" /> Manager Feedback (Q1)
                            </h4>
                            <textarea
                              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y mb-4 min-h-[100px]"
                              placeholder="Provide constructive feedback..."
                              value={feedback}
                              onChange={(e) => setFeedback(e.target.value)}
                            />
                            <div className="flex justify-end">
                              <Button 
                                onClick={() => handleConductCheckIn(sheet.id)} 
                                disabled={isSubmitting || !feedback.trim()}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                              >
                                {isSubmitting ? 'Recording...' : 'Complete Q1 Check-in'}
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
