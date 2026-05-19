"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Save, ChevronLeft, BarChart2, TrendingUp } from "lucide-react"
import Link from "next/link"

const QUARTER_OPTIONS = ['Q1', 'Q2', 'Q3', 'Q4']
const STATUS_OPTIONS = ['NOT_STARTED', 'ON_TRACK', 'COMPLETED']

function AchievementsContent() {
  const { user, isAuthenticated } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const sheetId = searchParams.get("sheetId")

  const [sheet, setSheet] = useState<any>(null)
  const [quarter, setQuarter] = useState("Q1")
  const [achievements, setAchievements] = useState<Record<string, { actual: string; status: string }>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const fetchSheet = useCallback(async () => {
    if (!sheetId || !user?.id) return
    setIsLoading(true)
    try {
      const res = await fetch(`http://localhost:5001/api/goal-sheets/employee/${user.id}`)
      if (!res.ok) throw new Error()
      const sheets = await res.json()
      const found = sheets.find((s: any) => s.id === sheetId)
      if (found) {
        setSheet(found)
        // Pre-fill existing achievements for selected quarter
        const initial: Record<string, { actual: string; status: string }> = {}
        for (const goal of found.goals || []) {
          const existing = goal.achievements?.find((a: any) => a.quarter === quarter)
          initial[goal.id] = { actual: existing?.actual || "", status: existing?.status || "NOT_STARTED" }
        }
        setAchievements(initial)
      }
    } catch {
      toast.error("Failed to load sheet")
    } finally {
      setIsLoading(false)
    }
  }, [sheetId, user?.id, quarter])

  useEffect(() => {
    if (!isAuthenticated) { router.push("/"); return }
    if (!sheetId) { router.push("/goals"); return }
    fetchSheet()
  }, [isAuthenticated, sheetId, router, fetchSheet])

  const handleSave = async () => {
    setIsSaving(true)
    let errors = 0
    for (const goal of sheet?.goals || []) {
      const ach = achievements[goal.id]
      if (!ach?.actual) continue

      // For shared goals that aren't primary owner, skip
      if (goal.isShared && !goal.isPrimaryOwner) continue

      try {
        const res = await fetch("http://localhost:5001/api/achievements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goalId: goal.id,
            quarter,
            actual: ach.actual,
            status: ach.status
          })
        })
        if (!res.ok) errors++
      } catch {
        errors++
      }
    }

    setIsSaving(false)
    if (errors === 0) {
      toast.success(`${quarter} achievements saved!`)
      fetchSheet()
    } else {
      toast.error(`${errors} achievement(s) failed to save`)
    }
  }

  if (!isAuthenticated) return null
  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!sheet) return (
    <div className="p-8 text-center text-muted-foreground">Goal sheet not found.</div>
  )

  return (
    <div className="flex flex-col flex-1 bg-background">
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto">

          <div className="mb-8">
            <Link href="/goals" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground bg-card border border-border px-3 py-1.5 rounded-full shadow-sm hover:bg-background mb-6">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to Goals
            </Link>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">Update Achievements</h1>
                <p className="text-sm text-muted-foreground">Record your quarterly progress for each objective.</p>
              </div>

              {/* Quarter Selector */}
              <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1 shadow-sm">
                {QUARTER_OPTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => setQuarter(q)}
                    className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${quarter === q ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {sheet.goals?.map((goal: any, idx: number) => {
              const ach = achievements[goal.id] || { actual: "", status: "NOT_STARTED" }
              const isReadOnly = goal.isShared && !goal.isPrimaryOwner

              // Compute score preview
              let scorePreview = 0
              if (ach.actual) {
                if (goal.uom === 'ZERO_BASED') scorePreview = parseFloat(ach.actual) === 0 ? 100 : 0
                else if (goal.uom === 'TIMELINE') {
                  scorePreview = new Date(ach.actual) <= new Date(goal.target) ? 100 : 0
                } else if (goal.optimizationDirection === 'lower_better') {
                  const t = parseFloat(goal.target), a = parseFloat(ach.actual)
                  scorePreview = a > 0 ? Math.min((t / a) * 100, 150) : 100
                } else {
                  const t = parseFloat(goal.target), a = parseFloat(ach.actual)
                  scorePreview = t > 0 ? Math.min((a / t) * 100, 150) : 0
                }
              }

              return (
                <Card key={goal.id} className="border-border shadow-sm rounded-xl overflow-hidden bg-card">
                  <CardHeader className="bg-background border-b border-border py-4 px-6 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-2">{goal.thrustArea}</span>
                        {goal.isShared && <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">Shared{!goal.isPrimaryOwner ? ' (Read-only)' : ''}</span>}
                        <CardTitle className="text-sm font-semibold text-foreground mt-0.5">{goal.title}</CardTitle>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Target</p>
                      <p className="text-sm font-semibold text-foreground">{goal.target} <span className="text-xs text-muted-foreground">{goal.uom?.replace('_', ' ')}</span></p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Weight: {goal.weightage}%</p>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider">Actual Achievement</label>
                        {goal.uom === 'TIMELINE' ? (
                          <input
                            type="date"
                            disabled={isReadOnly}
                            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            value={ach.actual}
                            onChange={e => setAchievements(prev => ({ ...prev, [goal.id]: { ...prev[goal.id], actual: e.target.value } }))}
                          />
                        ) : (
                          <input
                            type={goal.uom === 'ZERO_BASED' ? 'number' : 'number'}
                            disabled={isReadOnly}
                            placeholder={goal.uom === 'PERCENTAGE' ? '0-100' : 'Enter value'}
                            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                            value={ach.actual}
                            onChange={e => setAchievements(prev => ({ ...prev, [goal.id]: { ...prev[goal.id], actual: e.target.value } }))}
                          />
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider">Status</label>
                        <select
                          disabled={isReadOnly}
                          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                          value={ach.status}
                          onChange={e => setAchievements(prev => ({ ...prev, [goal.id]: { ...prev[goal.id], status: e.target.value } }))}
                        >
                          <option value="NOT_STARTED">Not Started</option>
                          <option value="ON_TRACK">On Track</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </div>
                    </div>

                    {/* Progress preview */}
                    {ach.actual && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                          <span className="font-semibold">Progress Score Preview</span>
                          <span className={`font-bold text-sm ${scorePreview >= 80 ? 'text-emerald-600' : scorePreview >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                            {Math.min(scorePreview, 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={Math.min(scorePreview, 100)}
                          className="h-1.5 bg-secondary"
                          indicatorClassName={scorePreview >= 80 ? "bg-emerald-500" : scorePreview >= 50 ? "bg-amber-500" : "bg-red-500"}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 text-white px-8"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : `Save ${quarter} Achievements`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AchievementsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <AchievementsContent />
    </Suspense>
  )
}
