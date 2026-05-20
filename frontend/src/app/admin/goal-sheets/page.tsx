"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { useRole } from "@/context/role-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { ChevronLeft, Unlock, CheckCircle2, Clock, AlertCircle, FileText, Layers, Filter } from "lucide-react"
import { apiUrl } from "@/lib/api"

const STATUS_OPTIONS = ["ALL", "DRAFT", "PENDING_APPROVAL", "APPROVED", "RETURNED"]

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:            { label: 'Draft',             color: 'text-muted-foreground',   bg: 'bg-secondary' },
  PENDING_APPROVAL: { label: 'Pending Approval',  color: 'text-amber-700',   bg: 'bg-amber-50' },
  APPROVED:         { label: 'Approved',           color: 'text-emerald-700', bg: 'bg-emerald-50' },
  RETURNED:         { label: 'Returned',           color: 'text-red-700',     bg: 'bg-red-50' },
}

export default function AdminGoalSheetsPage() {
  const { user, isAuthenticated } = useAuth()
  const { role } = useRole()
  const router = useRouter()
  const [sheets, setSheets] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [unlockId, setUnlockId] = useState<string | null>(null)
  const [justification, setJustification] = useState("")
  const [isUnlocking, setIsUnlocking] = useState(false)

  const fetchSheets = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "ALL") params.set("status", statusFilter)
      const res = await fetch(apiUrl(`/api/admin/goal-sheets?${params.toString()}`))
      if (!res.ok) throw new Error()
      setSheets(await res.json())
    } catch {
      toast.error("Failed to load goal sheets")
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    if (!isAuthenticated) { router.push("/"); return }
    if (role !== "ADMIN") { router.push("/dashboard"); return }
    fetchSheets()
  }, [isAuthenticated, role, router, fetchSheets])

  const handleUnlock = async (sheetId: string) => {
    if (!justification.trim()) {
      toast.error("Justification is required")
      return
    }
    setIsUnlocking(true)
    try {
      const res = await fetch(apiUrl(`/api/admin/goal-sheets/${sheetId}/unlock`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: user?.id, justification })
      })
      if (!res.ok) throw new Error((await res.json()).error?.message)
      toast.success("Goal sheet unlocked. Employee can now edit it.")
      setUnlockId(null)
      setJustification("")
      fetchSheets()
    } catch (e: any) {
      toast.error(e.message || "Failed to unlock")
    } finally {
      setIsUnlocking(false)
    }
  }

  if (!isAuthenticated || role !== "ADMIN") return null

  return (
    <div className="flex flex-col flex-1 bg-background">
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">

          <div className="mb-8">
            <Link href="/admin" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground bg-card border border-border px-3 py-1.5 rounded-full shadow-sm hover:bg-background mb-6">
              <ChevronLeft className="h-4 w-4 mr-1" /> Admin Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-foreground mb-1">All Goal Sheets</h1>
            <p className="text-sm text-muted-foreground">Org-wide view of all employee goal sheets. Unlock approved sheets for exceptional edits.</p>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            {STATUS_OPTIONS.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  statusFilter === s ? 'bg-primary text-white shadow-sm' : 'bg-card border border-border text-muted-foreground hover:border-primary/30'
                }`}>
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sheets.length === 0 ? (
            <Card className="border-border shadow-sm rounded-xl p-12 text-center bg-card">
              <Layers className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No goal sheets found</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {sheets.map(sheet => {
                const cfg = STATUS_CONFIG[sheet.status] || STATUS_CONFIG.DRAFT
                return (
                  <Card key={sheet.id} className="border-border shadow-sm rounded-xl overflow-hidden bg-card">
                    <CardHeader className="bg-background border-b border-border px-6 py-4">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                            {(sheet.employee?.firstName?.[0] || '') + (sheet.employee?.lastName?.[0] || '')}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-sm font-bold text-foreground">
                                {sheet.employee?.firstName} {sheet.employee?.lastName}
                              </CardTitle>
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                                {cfg.label}
                              </span>
                            </div>
                            <CardDescription className="text-xs mt-0.5">
                              {sheet.cycle?.name} · {sheet.goals?.length} goals
                              {sheet.approvedAt && ` · Approved ${new Date(sheet.approvedAt).toLocaleDateString()}`}
                            </CardDescription>
                          </div>
                        </div>
                        {sheet.status === 'APPROVED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-200 text-amber-700 hover:bg-amber-50"
                            onClick={() => setUnlockId(unlockId === sheet.id ? null : sheet.id)}
                          >
                            <Unlock className="h-3.5 w-3.5 mr-1.5" /> Unlock
                          </Button>
                        )}
                      </div>

                      {/* Unlock Dialog */}
                      {unlockId === sheet.id && (
                        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-sm font-semibold text-amber-800 mb-3">
                            Provide a justification for unlocking this approved goal sheet:
                          </p>
                          <textarea
                            className="w-full rounded-md border border-amber-300 bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 min-h-[80px] resize-y"
                            placeholder="e.g., Employee's role changed; goals need to be updated to reflect new responsibilities."
                            value={justification}
                            onChange={e => setJustification(e.target.value)}
                          />
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => handleUnlock(sheet.id)} disabled={isUnlocking}>
                              {isUnlocking ? 'Unlocking...' : 'Confirm Unlock'}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setUnlockId(null); setJustification("") }}>Cancel</Button>
                          </div>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-border">
                        {sheet.goals?.slice(0, 3).map((goal: any) => (
                          <div key={goal.id} className="px-6 py-3 flex items-center gap-4">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground bg-secondary px-2 py-0.5 rounded shrink-0">{goal.thrustArea}</span>
                            <p className="text-sm text-foreground flex-1 truncate">{goal.title}</p>
                            <span className="text-xs font-bold text-primary shrink-0">{goal.weightage}%</span>
                          </div>
                        ))}
                        {sheet.goals?.length > 3 && (
                          <div className="px-6 py-2 text-xs text-muted-foreground font-medium">
                            +{sheet.goals.length - 3} more goals...
                          </div>
                        )}
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
