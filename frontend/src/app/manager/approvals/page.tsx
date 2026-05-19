"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useRole } from "@/context/role-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { ChevronLeft, CheckCircle2, XCircle, Clock, CheckCircle, Users } from "lucide-react"
import Link from "next/link"

export default function ManagerApprovalsPage() {
  const { user, isAuthenticated } = useAuth()
  const { role } = useRole()
  const router = useRouter()
  const [pendingSheets, setPendingSheets] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/dashboard")
      return
    }
    
    if (role === "EMPLOYEE") {
      router.push("/dashboard")
      return
    }

    const fetchPending = async () => {
      try {
        const res = await fetch(`http://localhost:5001/api/goal-sheets/pending/${user?.id}`)
        if (!res.ok) throw new Error("Failed to load")
        const data = await res.json()
        setPendingSheets(data)
      } catch (error) {
        toast.error("Failed to load pending approvals")
      } finally {
        setIsLoading(false)
      }
    }

    if (user?.id) {
      fetchPending()
    }
  }, [isAuthenticated, role, router, user?.id])

  const handleApprove = async (sheetId: string) => {
    try {
      const res = await fetch(`http://localhost:5001/api/goal-sheets/${sheetId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerId: user?.id })
      })
      if (!res.ok) throw new Error("Failed to approve")
      toast.success("Goal sheet approved successfully!")
      setPendingSheets(prev => prev.filter(s => s.id !== sheetId))
    } catch (err: any) {
      toast.error(err.message || "Error approving goal sheet")
    }
  }

  const handleReturn = async (sheetId: string) => {
    try {
      const res = await fetch(`http://localhost:5001/api/goal-sheets/${sheetId}/return`, {
        method: "POST"
      })
      if (!res.ok) throw new Error("Failed to return")
      toast.success("Returned to employee for rework")
      setPendingSheets(prev => prev.filter(s => s.id !== sheetId))
    } catch (err: any) {
      toast.error(err.message || "Error returning goal sheet")
    }
  }

  if (!isAuthenticated || role === "EMPLOYEE") return null

  return (
    <div className="flex flex-col flex-1 bg-slate-50/50">
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Pending Approvals</h1>
            <p className="text-sm text-slate-500">Review, provide feedback, and approve your team's objective drafts.</p>
          </div>

          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-64 gap-4">
              <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-slate-500 font-medium">Loading approvals...</p>
            </div>
          ) : pendingSheets.length === 0 ? (
            <Card className="shadow-sm border-slate-200 rounded-xl p-16 text-center max-w-2xl mx-auto bg-white">
              <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">All Caught Up!</h3>
              <p className="text-slate-500 text-sm mb-6">
                Your queue is completely clear. There are no goal sheets pending your approval.
              </p>
              <Link href="/dashboard" passHref legacyBehavior>
                <Button variant="outline" className="shadow-sm border-slate-200 text-slate-700 hover:bg-slate-50">Return to Dashboard</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-6">
              {pendingSheets.map((sheet, sheetIndex) => (
                <Card key={sheet.id} className="shadow-sm border-slate-200 rounded-xl overflow-hidden bg-white">
                  <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm">
                        {(sheet.employee?.name?.[0] || sheet.employee?.username?.[0] || 'U')}
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold text-slate-800">
                          {sheet.employee?.name || sheet.employee?.username || "Unknown Employee"}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1.5 mt-1 text-xs font-medium text-slate-500">
                          <Clock className="h-3 w-3" /> Submitted {new Date(sheet.submittedAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200" 
                        onClick={() => handleReturn(sheet.id)}
                      >
                        <XCircle className="h-4 w-4 mr-2" /> Return
                      </Button>
                      <Button 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border-0"
                        onClick={() => handleApprove(sheet.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" /> Approve
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                      {sheet.goals.map((goal: any, idx: number) => (
                        <div key={goal.id} className="p-6 hover:bg-slate-50 transition-colors grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                          <div className="md:col-span-3">
                            <span className="inline-flex px-2 py-1 rounded bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">
                              {goal.thrustArea}
                            </span>
                            {goal.isShared && (
                              <span className="inline-flex ml-2 px-2 py-1 rounded bg-blue-50 text-[10px] font-bold uppercase tracking-wider text-blue-600 border border-blue-100">
                                Shared
                              </span>
                            )}
                          </div>
                          
                          <div className="md:col-span-6">
                            <h4 className="text-sm font-semibold text-slate-900 mb-1">{goal.title}</h4>
                            <p className="text-xs text-slate-500 line-clamp-2">
                              {goal.description}
                            </p>
                            {(goal.optimizationDirection) && (
                              <p className="text-[10px] font-semibold text-indigo-600 mt-2 uppercase tracking-wide">
                                Optimization: {goal.optimizationDirection.replace('_', ' ')}
                              </p>
                            )}
                          </div>
                          
                          <div className="md:col-span-3 flex justify-between items-center gap-4 border-l border-slate-100 pl-6">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Target</span>
                              <span className="text-sm font-semibold text-slate-900">{goal.target} <span className="text-xs font-normal text-slate-500">{goal.uom}</span></span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Weight</span>
                              <span className="text-lg font-black text-indigo-600">{goal.weightage}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
