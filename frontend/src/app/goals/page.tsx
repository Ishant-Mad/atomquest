"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { useRole } from "@/context/role-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import {
  PlusCircle, Target, Clock, CheckCircle2, AlertCircle,
  Send, FileText, RefreshCw, ChevronRight, Edit2, BarChart2,
  TrendingUp, Award, Layers
} from "lucide-react"

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  DRAFT:            { label: 'Draft',            color: 'text-slate-600',  bg: 'bg-slate-100',  icon: FileText },
  PENDING_APPROVAL: { label: 'Pending Approval', color: 'text-amber-700',  bg: 'bg-amber-50',   icon: Clock },
  APPROVED:         { label: 'Approved',          color: 'text-emerald-700',bg: 'bg-emerald-50', icon: CheckCircle2 },
  RETURNED:         { label: 'Returned for Rework',color:'text-red-700',   bg: 'bg-red-50',     icon: AlertCircle },
}

export default function MyGoalsPage() {
  const { user, isAuthenticated } = useAuth()
  const { role } = useRole()
  const router = useRouter()
  const [sheets, setSheets] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)

  const fetchSheets = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const res = await fetch(`http://localhost:5001/api/goal-sheets/employee/${user.id}`)
      if (!res.ok) throw new Error("Failed to load")
      const data = await res.json()
      setSheets(data)
    } catch {
      toast.error("Failed to load your goal sheets")
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (!isAuthenticated) { router.push("/"); return }
    fetchSheets()
  }, [isAuthenticated, router, fetchSheets])

  const handleSubmit = async (sheetId: string) => {
    setSubmitting(sheetId)
    try {
      const res = await fetch(`http://localhost:5001/api/goal-sheets/${sheetId}/submit`, { method: "POST" })
      if (!res.ok) throw new Error((await res.json()).error?.message)
      toast.success("Goal sheet submitted for approval!")
      fetchSheets()
    } catch (e: any) {
      toast.error(e.message || "Submission failed")
    } finally {
      setSubmitting(null)
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="flex flex-col flex-1 bg-slate-50/50">
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto">
          
          {/* Header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">My Goals</h1>
              <p className="text-sm text-slate-500">Manage and track your performance objectives for FY 2026.</p>
            </div>
            <Link href="/goals/create">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                <PlusCircle className="h-4 w-4 mr-2" /> New Goal Sheet
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Loading your goal sheets...</p>
            </div>
          ) : sheets.length === 0 ? (
            <Card className="border-slate-200 shadow-sm rounded-xl p-16 text-center bg-white">
              <div className="h-16 w-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Goal Sheets Yet</h3>
              <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
                Create your first goal sheet to start defining your objectives for this performance cycle.
              </p>
              <Link href="/goals/create">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <PlusCircle className="h-4 w-4 mr-2" /> Create Goal Sheet
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-6">
              {sheets.map(sheet => {
                const cfg = STATUS_CONFIG[sheet.status] || STATUS_CONFIG.DRAFT
                const StatusIcon = cfg.icon

                // Compute overall progress
                const goalsWithAchievements = sheet.goals?.filter((g: any) => g.achievements?.length > 0) || []
                const overallScore = sheet.goals?.reduce((sum: number, g: any) => {
                  const latest = g.achievements?.[0]
                  return sum + (latest?.progressScore || 0) * (g.weightage / 100)
                }, 0) || 0

                return (
                  <Card key={sheet.id} className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
                    {/* Sheet Header */}
                    <CardHeader className="bg-slate-50 border-b border-slate-100 px-6 py-4">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <Layers className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base font-bold text-slate-800">
                                {sheet.cycle?.name || 'FY 2026'} Goal Sheet
                              </CardTitle>
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                                <StatusIcon className="h-3 w-3" />
                                {cfg.label}
                              </span>
                            </div>
                            <CardDescription className="text-xs mt-1">
                              {sheet.goals?.length || 0} goal{sheet.goals?.length !== 1 ? 's' : ''} · 
                              {sheet.submittedAt ? ` Submitted ${new Date(sheet.submittedAt).toLocaleDateString()}` : ' Not submitted yet'}
                            </CardDescription>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {sheet.status === 'APPROVED' && (
                            <Link href={`/goals/achievements?sheetId=${sheet.id}`}>
                              <Button size="sm" variant="outline" className="border-slate-200 text-slate-700">
                                <BarChart2 className="h-3.5 w-3.5 mr-1.5" /> Update Achievements
                              </Button>
                            </Link>
                          )}
                          {(sheet.status === 'DRAFT' || sheet.status === 'RETURNED') && (
                            <>
                              <Link href={`/goals/edit?sheetId=${sheet.id}`}>
                                <Button size="sm" variant="outline" className="border-slate-200 text-slate-700">
                                  <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                onClick={() => handleSubmit(sheet.id)}
                                disabled={submitting === sheet.id}
                              >
                                <Send className="h-3.5 w-3.5 mr-1.5" />
                                {submitting === sheet.id ? 'Submitting...' : 'Submit for Approval'}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Overall progress bar (only for approved sheets with data) */}
                      {sheet.status === 'APPROVED' && goalsWithAchievements.length > 0 && (
                        <div className="mt-4 flex items-center gap-3">
                          <span className="text-xs font-semibold text-slate-500 w-28">Overall Progress</span>
                          <Progress
                            value={overallScore}
                            className="flex-1 h-2 bg-slate-200"
                            indicatorClassName={overallScore >= 80 ? "bg-emerald-500" : overallScore >= 50 ? "bg-amber-500" : "bg-red-500"}
                          />
                          <span className="text-sm font-bold text-slate-800 w-12 text-right">{overallScore.toFixed(1)}%</span>
                        </div>
                      )}

                      {/* Returned feedback banner */}
                      {sheet.status === 'RETURNED' && (
                        <div className="mt-3 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                          <span>Your manager has returned this sheet for rework. Please make the necessary changes and resubmit.</span>
                        </div>
                      )}
                    </CardHeader>

                    {/* Goals List */}
                    <CardContent className="p-0">
                      <div className="divide-y divide-slate-100">
                        {sheet.goals?.map((goal: any, idx: number) => {
                          const latest = goal.achievements?.[0]
                          const score = latest?.progressScore || 0

                          return (
                            <div key={goal.id} className="p-5 grid grid-cols-12 gap-4 items-center hover:bg-slate-50/50 transition-colors">
                              {/* Index */}
                              <div className="col-span-1 hidden md:flex items-center justify-center">
                                <div className="h-7 w-7 rounded bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                                  {idx + 1}
                                </div>
                              </div>

                              {/* Goal Info */}
                              <div className="col-span-12 md:col-span-7">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                    {goal.thrustArea}
                                  </span>
                                  {goal.isShared && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                                      Shared
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm font-semibold text-slate-800 mt-1">{goal.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{goal.description}</p>
                              </div>

                              {/* Metrics */}
                              <div className="col-span-12 md:col-span-4 flex items-center gap-4 md:border-l border-slate-100 md:pl-4">
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target</p>
                                  <p className="text-sm font-semibold text-slate-800">{goal.target} <span className="text-xs font-normal text-slate-400">{goal.uom?.replace('_', ' ')}</span></p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Weight</p>
                                  <p className="text-lg font-black text-indigo-600">{goal.weightage}%</p>
                                </div>
                                {latest && (
                                  <div className="flex-1">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Progress</p>
                                    <div className="flex items-center gap-2">
                                      <Progress
                                        value={score}
                                        className="flex-1 h-1.5 bg-slate-100"
                                        indicatorClassName={score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500"}
                                      />
                                      <span className="text-xs font-bold text-slate-700">{score.toFixed(0)}%</span>
                                    </div>
                                  </div>
                                )}
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
