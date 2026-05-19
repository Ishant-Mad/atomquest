"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { useRole } from "@/context/role-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { ChevronLeft, FileText, Download, Filter } from "lucide-react"

export default function AdminAuditLogsPage() {
  const { user, isAuthenticated } = useAuth()
  const { role } = useRole()
  const router = useRouter()
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({ field: "", from: "", to: "" })

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.field) params.set("field", filters.field)
      if (filters.from) params.set("from", filters.from)
      if (filters.to) params.set("to", filters.to)
      const res = await fetch(`http://localhost:5001/api/admin/audit-logs?${params.toString()}`)
      if (!res.ok) throw new Error()
      setLogs(await res.json())
    } catch {
      toast.error("Failed to load audit logs")
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    if (!isAuthenticated) { router.push("/"); return }
    if (role !== "ADMIN") { router.push("/dashboard"); return }
    fetchLogs()
  }, [isAuthenticated, role, router, fetchLogs])

  const handleExportCSV = () => {
    const headers = ["Timestamp", "Employee", "Action", "Field", "Old Value", "New Value", "Justification"]
    const rows = logs.map(l => [
      new Date(l.timestamp).toISOString(),
      `${l.goalSheet?.employee?.firstName || ''} ${l.goalSheet?.employee?.lastName || ''}`,
      l.action, l.field, l.oldValue, l.newValue, l.justification || ""
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Exported!")
  }

  if (!isAuthenticated || role !== "ADMIN") return null

  const actionColors: Record<string, string> = {
    ADMIN_UNLOCK: "bg-violet-100 text-violet-700",
    GOAL_EDIT: "bg-amber-100 text-amber-700",
    STATUS_CHANGE: "bg-blue-100 text-blue-700",
  }

  return (
    <div className="flex flex-col flex-1 bg-background">
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">

          <div className="mb-8">
            <Link href="/admin" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground bg-card border border-border px-3 py-1.5 rounded-full shadow-sm hover:bg-background mb-6">
              <ChevronLeft className="h-4 w-4 mr-1" /> Admin Dashboard
            </Link>
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">Audit Logs</h1>
                <p className="text-sm text-muted-foreground">Immutable record of all post-approval changes to goal sheets.</p>
              </div>
              <Button onClick={handleExportCSV} variant="outline" className="border-border">
                <Download className="h-4 w-4 mr-2" /> Export CSV
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="border-border shadow-sm rounded-xl bg-card mb-6">
            <CardContent className="p-4 flex flex-wrap gap-4 items-end">
              <div className="space-y-1.5 flex-1 min-w-[150px]">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">Field</label>
                <input className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm focus:outline-none"
                  placeholder="e.g., status" value={filters.field} onChange={e => setFilters(p => ({ ...p, field: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">From</label>
                <input type="date" className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm focus:outline-none"
                  value={filters.from} onChange={e => setFilters(p => ({ ...p, from: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">To</label>
                <input type="date" className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm focus:outline-none"
                  value={filters.to} onChange={e => setFilters(p => ({ ...p, to: e.target.value }))} />
              </div>
              <Button onClick={fetchLogs} variant="outline" className="border-border">
                <Filter className="h-4 w-4 mr-2" /> Apply
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm rounded-xl overflow-hidden bg-card">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : logs.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No audit log entries found.</p>
                  <p className="text-xs text-muted-foreground mt-1">Changes made after goal approval will appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {logs.map(log => (
                    <div key={log.id} className="p-5 grid grid-cols-12 gap-4 items-start hover:bg-background/70 transition-colors">
                      <div className="col-span-12 md:col-span-3">
                        <p className="text-xs font-mono text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</p>
                        <p className="text-sm font-semibold text-foreground mt-1">
                          {log.goalSheet?.employee?.firstName} {log.goalSheet?.employee?.lastName}
                        </p>
                      </div>
                      <div className="col-span-12 md:col-span-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${actionColors[log.action] || 'bg-secondary text-muted-foreground'}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">{log.field}</p>
                      </div>
                      <div className="col-span-12 md:col-span-3 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase w-16">Before</span>
                          <span className="text-xs bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-mono">{log.oldValue}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase w-16">After</span>
                          <span className="text-xs bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-mono">{log.newValue}</span>
                        </div>
                      </div>
                      <div className="col-span-12 md:col-span-4">
                        {log.justification && (
                          <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-100 px-3 py-2 rounded-md italic">
                            "{log.justification}"
                          </p>
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
