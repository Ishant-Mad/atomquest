"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useRole } from "@/context/role-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import {
  Users, ChevronRight, CheckCircle2, Clock, AlertCircle, Target,
  BarChart2, Shield, UserPlus, UserCheck
} from "lucide-react"
import Link from "next/link"

export default function MyTeamPage() {
  const { user, isAuthenticated } = useAuth()
  const { role } = useRole()
  const router = useRouter()
  const [reports, setReports] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchTeam = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const res = await fetch(`http://localhost:5001/api/users/${user.id}/reports`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setReports(data)
    } catch {
      toast.error("Failed to load team data")
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (!isAuthenticated) { router.push("/"); return }
    if (role === "EMPLOYEE") { router.push("/dashboard"); return }
    fetchTeam()
  }, [isAuthenticated, role, router, fetchTeam])

  if (!isAuthenticated || role === "EMPLOYEE") return null

  const pending = reports.filter(r => r.goalSheets?.[0]?.status === 'PENDING_APPROVAL').length
  const approved = reports.filter(r => r.goalSheets?.[0]?.status === 'APPROVED').length
  const draft = reports.filter(r => r.goalSheets?.[0]?.status === 'DRAFT' || !r.goalSheets?.length).length

  return (
    <div className="flex flex-col flex-1 bg-slate-50/50">
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">My Team</h1>
            <p className="text-sm text-slate-500">Overview of your direct reports and their goal progress.</p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">{reports.length}</p>
                  <p className="text-xs font-semibold text-slate-500">Direct Reports</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-black text-amber-600">{pending}</p>
                  <p className="text-xs font-semibold text-slate-500">Pending Approval</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-black text-emerald-600">{approved}</p>
                  <p className="text-xs font-semibold text-slate-500">Goals Approved</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-48 gap-4">
              <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Loading team...</p>
            </div>
          ) : reports.length === 0 ? (
            <Card className="border-slate-200 shadow-sm rounded-xl p-16 text-center bg-white">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Direct Reports</h3>
              <p className="text-slate-500 text-sm">You don't have any direct reports assigned yet.</p>
            </Card>
          ) : (
            <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
              <CardHeader className="border-b border-slate-100 px-6 py-4">
                <CardTitle className="text-base font-semibold text-slate-800">Team Members ({reports.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {reports.map((member, idx) => {
                    const sheet = member.goalSheets?.[0]
                    const status = sheet?.status || 'NO_SHEET'
                    
                    const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
                      APPROVED:         { label: 'Approved',          color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle2 },
                      PENDING_APPROVAL: { label: 'Pending Approval',  color: 'text-amber-700',   bg: 'bg-amber-50',   icon: Clock },
                      DRAFT:            { label: 'Draft',             color: 'text-slate-600',   bg: 'bg-slate-100',  icon: Target },
                      RETURNED:         { label: 'Returned',          color: 'text-red-700',     bg: 'bg-red-50',     icon: AlertCircle },
                      NO_SHEET:         { label: 'No Goal Sheet',     color: 'text-slate-400',   bg: 'bg-slate-50',   icon: AlertCircle },
                    }
                    const cfg = statusConfig[status]
                    const StatusIcon = cfg.icon

                    return (
                      <div key={member.id} className="p-5 flex items-center gap-4 hover:bg-slate-50/70 transition-colors">
                        {/* Avatar */}
                        <div className="h-11 w-11 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm shrink-0">
                          {(member.firstName?.[0] || '') + (member.lastName?.[0] || '')}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{member.firstName} {member.lastName}</p>
                          <p className="text-xs text-slate-500">{member.email}</p>
                        </div>

                        {/* Status */}
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color} shrink-0`}>
                          <StatusIcon className="h-3 w-3" />
                          {cfg.label}
                        </span>

                        {/* Actions */}
                        <div className="flex gap-2 shrink-0">
                          {status === 'PENDING_APPROVAL' && (
                            <Link href="/manager/approvals">
                              <Button size="sm" variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50 h-8 text-xs">
                                Review
                              </Button>
                            </Link>
                          )}
                          {status === 'APPROVED' && (
                            <Link href="/manager/checkins">
                              <Button size="sm" variant="outline" className="border-slate-200 text-slate-700 h-8 text-xs">
                                Check-in
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/manager/approvals">
              <Card className="border-slate-200 shadow-sm rounded-xl bg-white hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                    <UserCheck className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Pending Approvals</p>
                    <p className="text-xs text-slate-500">{pending} sheet{pending !== 1 ? 's' : ''} waiting for review</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 ml-auto group-hover:text-slate-600" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/manager/checkins">
              <Card className="border-slate-200 shadow-sm rounded-xl bg-white hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                    <BarChart2 className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Quarterly Check-ins</p>
                    <p className="text-xs text-slate-500">{approved} member{approved !== 1 ? 's' : ''} ready for check-in</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 ml-auto group-hover:text-slate-600" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
