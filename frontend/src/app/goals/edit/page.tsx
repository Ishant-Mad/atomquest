"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { PlusCircle, Trash2, ChevronLeft, Save, Target, Scale, Lock } from "lucide-react"
import Link from "next/link"
import { apiUrl } from "@/lib/api"

const UOM_OPTIONS = ["NUMERIC", "PERCENTAGE", "TIMELINE", "ZERO_BASED"]

function EditGoalSheetContent() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const sheetId = searchParams.get("sheetId")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [goals, setGoals] = useState<any[]>([])
  const [thrustAreas, setThrustAreas] = useState<any[]>([])
  const [sheetStatus, setSheetStatus] = useState("")

  useEffect(() => {
    if (!isAuthenticated || !user?.id || !sheetId) return

    Promise.all([
      fetch(apiUrl("/api/thrust-areas")).then(r => r.json()),
      fetch(apiUrl(`/api/goal-sheets/employee/${user.id}`)).then(r => r.json()),
    ]).then(([tas, sheets]) => {
      setThrustAreas(tas)
      const sheet = sheets.find((s: any) => s.id === sheetId)
      if (!sheet) {
        toast.error("Goal sheet not found")
        router.push("/goals")
        return
      }
      if (sheet.status !== "DRAFT" && sheet.status !== "RETURNED") {
        toast.error("This goal sheet cannot be edited")
        router.push("/goals")
        return
      }
      setSheetStatus(sheet.status)
      setGoals(sheet.goals.map((g: any) => ({
        id: g.id,
        thrustArea: g.thrustArea,
        title: g.title,
        description: g.description,
        uom: g.uom,
        target: g.target,
        weightage: g.weightage,
        optimizationDirection: g.optimizationDirection || "",
        isShared: g.isShared || false,
        isPrimaryOwner: g.isPrimaryOwner || false,
      })))
      setIsLoading(false)
    }).catch(() => {
      toast.error("Failed to load data")
      setIsLoading(false)
    })
  }, [isAuthenticated, user?.id, sheetId, router])

  if (!isAuthenticated || !user) return null

  const totalWeight = goals.reduce((sum, g) => sum + Number(g.weightage), 0)

  const handleAddGoal = () => {
    if (goals.length >= 8) {
      toast.error("Maximum 8 goals allowed")
      return
    }
    setGoals([...goals, { thrustArea: "", title: "", description: "", uom: "NUMERIC", target: "", weightage: 10, optimizationDirection: "", isShared: false, isPrimaryOwner: false }])
  }

  const handleRemoveGoal = (index: number) => {
    if (goals[index].isShared) {
      toast.error("Shared goals cannot be removed")
      return
    }
    if (goals.length <= 1) {
      toast.error("At least 1 goal is required")
      return
    }
    setGoals(goals.filter((_, i) => i !== index))
  }

  const handleChange = (index: number, field: string, value: any) => {
    const goal = goals[index]
    // Shared goals (non-primary): only weightage can be changed
    if (goal.isShared && !goal.isPrimaryOwner && field !== "weightage") {
      toast.error("Shared goal: Only weightage can be adjusted")
      return
    }
    const newGoals = [...goals]
    newGoals[index] = { ...newGoals[index], [field]: value }
    setGoals(newGoals)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (totalWeight !== 100) {
      toast.error(`Total weightage is ${totalWeight}%. It must be exactly 100%.`)
      return
    }

    if (goals.some(g => Number(g.weightage) < 10)) {
      toast.error("Every goal must have at least 10% weightage.")
      return
    }

    if (goals.some(g => !g.isShared && (g.uom === "NUMERIC" || g.uom === "PERCENTAGE") && !g.optimizationDirection)) {
      toast.error("Please select Optimization Direction for Numeric/Percentage goals.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(apiUrl(`/api/goal-sheets/${sheetId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goals: goals.map(g => ({
            ...(g.id && { id: g.id }),
            thrustArea: g.thrustArea,
            title: g.title,
            description: g.description,
            uom: g.uom,
            target: g.target,
            weightage: Number(g.weightage),
            optimizationDirection: g.optimizationDirection,
            isShared: g.isShared,
            isPrimaryOwner: g.isPrimaryOwner,
          }))
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || "Failed to save")

      toast.success("Goal sheet updated successfully!")
      router.push("/goals")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading goal sheet...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-background min-h-full">
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto">

          <div className="mb-8">
            <Link href="/goals" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6 bg-card border border-border px-3 py-1.5 rounded-full shadow-sm hover:bg-background">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to Goals
            </Link>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-foreground">Edit Goal Sheet</h1>
                  {sheetStatus === "RETURNED" && (
                    <span className="text-xs font-bold bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full">Returned for Rework</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Modify your objectives before resubmitting for approval.</p>
              </div>

              <div className="bg-card border border-border p-4 rounded-xl shadow-sm min-w-[250px]">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="h-3 w-3" /> Total Weightage
                  </span>
                  <span className={`text-xl font-black ${totalWeight === 100 ? 'text-emerald-600' : totalWeight > 100 ? 'text-red-500' : 'text-amber-500'}`}>
                    {totalWeight}%
                  </span>
                </div>
                <Progress
                  value={totalWeight > 100 ? 100 : totalWeight}
                  className="h-1.5 bg-secondary"
                  indicatorClassName={totalWeight === 100 ? 'bg-emerald-500' : totalWeight > 100 ? 'bg-red-500' : 'bg-amber-500'}
                />
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {goals.map((goal, idx) => {
              const isSharedReadOnly = goal.isShared && !goal.isPrimaryOwner
              return (
                <Card key={idx} className="shadow-sm border-border rounded-xl overflow-hidden bg-card">
                  <CardHeader className="bg-background border-b border-border py-4 px-6 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded flex items-center justify-center font-bold text-xs bg-primary/10 text-primary">
                        {idx + 1}
                      </div>
                      <CardTitle className="text-sm font-semibold text-foreground">
                        {isSharedReadOnly ? "Shared Objective (Read-Only)" : "Objective Definition"}
                      </CardTitle>
                      {goal.isShared && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded flex items-center gap-1">
                          <Lock className="h-2.5 w-2.5" /> Shared
                        </span>
                      )}
                    </div>
                    {!goal.isShared && goals.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-red-600 hover:bg-red-50 h-8 px-2"
                        onClick={() => handleRemoveGoal(idx)}
                      >
                        <Trash2 className="h-4 w-4 mr-1.5" /> Remove
                      </Button>
                    )}
                  </CardHeader>

                  <CardContent className="p-6 grid gap-6 md:grid-cols-12">
                    <div className="space-y-2 md:col-span-4">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider">Thrust Area</label>
                      <select
                        required
                        disabled={isSharedReadOnly}
                        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        value={goal.thrustArea}
                        onChange={(e) => handleChange(idx, "thrustArea", e.target.value)}
                      >
                        <option value="" disabled>Select Area</option>
                        {thrustAreas.map((ta: any) => (
                          <option key={ta.id} value={ta.name}>{ta.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2 md:col-span-8">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider">Title</label>
                      <input
                        required
                        disabled={isSharedReadOnly}
                        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="e.g., Increase user retention by 15% in Q3"
                        value={goal.title}
                        onChange={(e) => handleChange(idx, "title", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-12">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider">Description</label>
                      <textarea
                        required
                        disabled={isSharedReadOnly}
                        className="w-full min-h-[80px] rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm resize-y disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="Provide detailed context..."
                        value={goal.description}
                        onChange={(e) => handleChange(idx, "description", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-4">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider">Metric Type</label>
                      <select
                        disabled={isSharedReadOnly}
                        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        value={goal.uom}
                        onChange={(e) => handleChange(idx, "uom", e.target.value)}
                      >
                        {UOM_OPTIONS.map(uom => <option key={uom} value={uom}>{uom.replace('_', ' ')}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2 md:col-span-5">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider">Target Value</label>
                      <input
                        required
                        disabled={isSharedReadOnly}
                        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder={goal.uom === 'PERCENTAGE' ? '100' : goal.uom === 'TIMELINE' ? 'YYYY-MM-DD' : 'Target value'}
                        value={goal.target}
                        onChange={(e) => handleChange(idx, "target", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-3">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wider">Weightage (%)</label>
                      <div className="relative">
                        <input
                          required
                          type="number"
                          min="10"
                          max="100"
                          className="w-full rounded-md border border-border bg-card px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm font-mono font-bold"
                          value={goal.weightage}
                          onChange={(e) => handleChange(idx, "weightage", e.target.value)}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">%</span>
                      </div>
                    </div>

                    {!isSharedReadOnly && (goal.uom === 'NUMERIC' || goal.uom === 'PERCENTAGE') && (
                      <div className="space-y-3 md:col-span-12 border-t border-border pt-4 mt-2">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider">Optimization Direction</label>
                        <div className="flex gap-4">
                          <label className={`flex-1 flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${goal.optimizationDirection === 'higher_better' ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-border bg-card hover:bg-background'}`}>
                            <div>
                              <p className={`text-sm font-semibold ${goal.optimizationDirection === 'higher_better' ? 'text-primary' : 'text-foreground'}`}>Higher is Better</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Goal is to maximize this metric</p>
                            </div>
                            <input
                              type="radio"
                              name={`optDir-${idx}`}
                              value="higher_better"
                              checked={goal.optimizationDirection === 'higher_better'}
                              onChange={(e) => handleChange(idx, "optimizationDirection", e.target.value)}
                              className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                            />
                          </label>
                          <label className={`flex-1 flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${goal.optimizationDirection === 'lower_better' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-border bg-card hover:bg-background'}`}>
                            <div>
                              <p className={`text-sm font-semibold ${goal.optimizationDirection === 'lower_better' ? 'text-blue-700' : 'text-foreground'}`}>Lower is Better</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Goal is to minimize this metric</p>
                            </div>
                            <input
                              type="radio"
                              name={`optDir-${idx}`}
                              value="lower_better"
                              checked={goal.optimizationDirection === 'lower_better'}
                              onChange={(e) => handleChange(idx, "optimizationDirection", e.target.value)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}

            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed border-2 border-slate-300 bg-transparent py-8 text-muted-foreground hover:text-foreground hover:bg-secondary hover:border-slate-400"
              onClick={handleAddGoal}
              disabled={goals.length >= 8}
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Add Another Goal
            </Button>
          </form>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="sticky bottom-0 p-4 bg-card/95 backdrop-blur border-t border-border z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              {totalWeight === 100 ? '✓ Ready to save' : 'Weightage must be 100%'}
            </span>
          </div>
          <Button
            onClick={() => handleSubmit()}
            disabled={isSubmitting || totalWeight !== 100}
            className="bg-primary hover:bg-primary/90 text-white px-8"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function EditGoalSheetPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <EditGoalSheetContent />
    </Suspense>
  )
}
