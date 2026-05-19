"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useRole } from "@/context/role-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { CheckCircle2, XCircle, Clock, CheckCircle, Edit2, X, Save } from "lucide-react"
import Link from "next/link"

export default function ManagerApprovalsPage() {
  const { user, isAuthenticated } = useAuth()
  const { role } = useRole()
  const router = useRouter()
  const [pendingSheets, setPendingSheets] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingSheet, setEditingSheet] = useState<string | null>(null)
  const [editedGoals, setEditedGoals] = useState<Record<string, any>>({})
  const [isSavingEdits, setIsSavingEdits] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) { router.push("/dashboard"); return }
    if (role === "EMPLOYEE") { router.push("/dashboard"); return }

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

    if (user?.id) fetchPending()
  }, [isAuthenticated, role, router, user?.id])

  const startEditing = (sheet: any) => {
    setEditingSheet(sheet.id)
    const goalEdits: Record<string, any> = {}
    sheet.goals.forEach((g: any) => {
      goalEdits[g.id] = {
        target: g.target,
        weightage: g.weightage,
      }
    })
    setEditedGoals(goalEdits)
  }

  const cancelEditing = () => {
    setEditingSheet(null)
    setEditedGoals({})
  }

  const handleGoalEdit = (goalId: string, field: string, value: any) => {
    setEditedGoals(prev => ({
      ...prev,
      [goalId]: { ...prev[goalId], [field]: value }
    }))
  }

  const saveEditsAndApprove = async (sheet: any) => {
    // Validate total weightage
    const totalWeight = sheet.goals.reduce((sum: number, g: any) => {
      const edited = editedGoals[g.id]
      return sum + Number(edited?.weightage ?? g.weightage)
    }, 0)

    if (totalWeight !== 100) {
      toast.error(`Total weightage is ${totalWeight}%. It must be exactly 100%.`)
      return
    }

    const minValid = sheet.goals.every((g: any) => {
      const edited = editedGoals[g.id]
      return Number(edited?.weightage ?? g.weightage) >= 10
    })
    if (!minValid) {
      toast.error("Each goal must have at least 10% weightage.")
      return
    }

    setIsSavingEdits(true)
    try {
      // First save edits
      const hasEdits = sheet.goals.some((g: any) => {
        const edited = editedGoals[g.id]
        return edited && (edited.target !== g.target || Number(edited.weightage) !== g.weightage)
      })

      if (hasEdits) {
        const editRes = await fetch(`http://localhost:5001/api/goal-sheets/${sheet.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goals: sheet.goals.map((g: any) => ({
              id: g.id,
              thrustArea: g.thrustArea,
              title: g.title,
              description: g.description,
              uom: g.uom,
              target: editedGoals[g.id]?.target ?? g.target,
              weightage: Number(editedGoals[g.id]?.weightage ?? g.weightage),
              optimizationDirection: g.optimizationDirection,
              isShared: g.isShared,
              isPrimaryOwner: g.isPrimaryOwner,
            }))
          })
        })
        if (!editRes.ok) throw new Error("Failed to save edits")
      }

      // Then approve
      const approveRes = await fetch(`http://localhost:5001/api/goal-sheets/${sheet.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerId: user?.id })
      })
      if (!approveRes.ok) throw new Error("Failed to approve")

      toast.success(hasEdits ? "Edits saved & goal sheet approved!" : "Goal sheet approved!")
      setPendingSheets(prev => prev.filter(s => s.id !== sheet.id))
      setEditingSheet(null)
      setEditedGoals({})
    } catch (err: any) {
      toast.error(err.message || "Error processing approval")
    } finally {
      setIsSavingEdits(false)
    }
  }

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
    <div className="flex flex-col flex-1 bg-background">
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-1">Pending Approvals</h1>
            <p className="text-sm text-muted-foreground">Review, provide inline edits to targets/weightages, and approve your team&apos;s objective drafts.</p>
          </div>

          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-64 gap-4">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-muted-foreground font-medium">Loading approvals...</p>
            </div>
          ) : pendingSheets.length === 0 ? (
            <Card className="shadow-sm border-border rounded-xl p-16 text-center max-w-2xl mx-auto bg-card">
              <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Your queue is completely clear. There are no goal sheets pending your approval.
              </p>
              <Link href="/dashboard" passHref legacyBehavior>
                <Button variant="outline" className="shadow-sm border-border text-foreground hover:bg-background">Return to Dashboard</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-6">
              {pendingSheets.map((sheet) => {
                const isEditing = editingSheet === sheet.id
                const employeeName = `${sheet.employee?.firstName || ''} ${sheet.employee?.lastName || ''}`.trim() || sheet.employee?.username || "Unknown Employee"
                const initials = (sheet.employee?.firstName?.[0] || '') + (sheet.employee?.lastName?.[0] || '')

                // Calculate total weight for inline editing validation
                const currentTotalWeight = isEditing
                  ? sheet.goals.reduce((sum: number, g: any) => sum + Number(editedGoals[g.id]?.weightage ?? g.weightage), 0)
                  : sheet.goals.reduce((sum: number, g: any) => sum + g.weightage, 0)

                return (
                  <Card key={sheet.id} className="shadow-sm border-border rounded-xl overflow-hidden bg-card">
                    <CardHeader className="bg-background border-b border-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                          {initials || 'U'}
                        </div>
                        <div>
                          <CardTitle className="text-base font-bold text-foreground">
                            {employeeName}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1.5 mt-1 text-xs font-medium text-muted-foreground">
                            <Clock className="h-3 w-3" /> Submitted {new Date(sheet.submittedAt).toLocaleDateString()}
                            {isEditing && (
                              <span className="ml-2 text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                EDITING MODE — Weightage: {currentTotalWeight}%
                              </span>
                            )}
                          </CardDescription>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        {!isEditing ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-primary hover:bg-primary/10 hover:text-primary border-primary/20"
                              onClick={() => startEditing(sheet)}
                            >
                              <Edit2 className="h-4 w-4 mr-2" /> Edit Targets
                            </Button>
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
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-muted-foreground hover:bg-secondary border-border"
                              onClick={cancelEditing}
                            >
                              <X className="h-4 w-4 mr-2" /> Cancel
                            </Button>
                            <Button
                              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border-0"
                              onClick={() => saveEditsAndApprove(sheet)}
                              disabled={isSavingEdits || currentTotalWeight !== 100}
                            >
                              <Save className="h-4 w-4 mr-2" />
                              {isSavingEdits ? "Saving..." : "Save & Approve"}
                            </Button>
                          </>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="p-0">
                      <div className="divide-y divide-border">
                        {sheet.goals.map((goal: any) => {
                          const edited = isEditing ? editedGoals[goal.id] : null
                          return (
                            <div key={goal.id} className="p-6 hover:bg-background transition-colors grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                              <div className="md:col-span-3">
                                <span className="inline-flex px-2 py-1 rounded bg-secondary text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                  {goal.thrustArea}
                                </span>
                                {goal.isShared && (
                                  <span className="inline-flex ml-2 px-2 py-1 rounded bg-blue-50 text-[10px] font-bold uppercase tracking-wider text-blue-600 border border-blue-100">
                                    Shared
                                  </span>
                                )}
                              </div>

                              <div className="md:col-span-5">
                                <h4 className="text-sm font-semibold text-foreground mb-1">{goal.title}</h4>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {goal.description}
                                </p>
                                {goal.optimizationDirection && (
                                  <p className="text-[10px] font-semibold text-primary mt-2 uppercase tracking-wide">
                                    Optimization: {goal.optimizationDirection.replace('_', ' ')}
                                  </p>
                                )}
                              </div>

                              <div className="md:col-span-4 flex justify-between items-center gap-4 border-l border-border pl-6">
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Target</span>
                                  {isEditing ? (
                                    <input
                                      className="w-24 rounded border border-primary/20 bg-primary/10/50 px-2 py-1 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                      value={edited?.target ?? goal.target}
                                      onChange={e => handleGoalEdit(goal.id, "target", e.target.value)}
                                    />
                                  ) : (
                                    <span className="text-sm font-semibold text-foreground">
                                      {goal.target} <span className="text-xs font-normal text-muted-foreground">{goal.uom}</span>
                                    </span>
                                  )}
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Weight</span>
                                  {isEditing ? (
                                    <div className="relative inline-block">
                                      <input
                                        type="number"
                                        min="10"
                                        max="100"
                                        className="w-16 rounded border border-primary/20 bg-primary/10/50 px-2 py-1 pr-5 text-sm font-black text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                        value={edited?.weightage ?? goal.weightage}
                                        onChange={e => handleGoalEdit(goal.id, "weightage", e.target.value)}
                                      />
                                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-primary/60 font-bold">%</span>
                                    </div>
                                  ) : (
                                    <span className="text-lg font-black text-primary">{goal.weightage}%</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
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
  )
}
