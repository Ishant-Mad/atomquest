"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useRole } from "@/context/role-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Settings, Plus, Trash2, CheckCircle2, Circle, ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function AdminCyclesPage() {
  const { user, isAuthenticated } = useAuth()
  const { role } = useRole()
  const router = useRouter()
  const [cycles, setCycles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", year: new Date().getFullYear().toString() })
  const [isSaving, setIsSaving] = useState(false)

  const fetchCycles = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5001/api/admin/cycles")
      if (!res.ok) throw new Error()
      setCycles(await res.json())
    } catch {
      toast.error("Failed to load cycles")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) { router.push("/"); return }
    if (role !== "ADMIN") { router.push("/dashboard"); return }
    fetchCycles()
  }, [isAuthenticated, role, router, fetchCycles])

  const handleCreate = async () => {
    if (!form.name || !form.year) return
    setIsSaving(true)
    try {
      const res = await fetch("http://localhost:5001/api/admin/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error((await res.json()).error?.message)
      toast.success("Cycle created and activated!")
      setShowForm(false)
      setForm({ name: "", year: new Date().getFullYear().toString() })
      fetchCycles()
    } catch (e: any) {
      toast.error(e.message || "Failed to create cycle")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSetActive = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:5001/api/admin/cycles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true })
      })
      if (!res.ok) throw new Error()
      toast.success("Cycle set as active")
      fetchCycles()
    } catch {
      toast.error("Failed to update cycle")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this cycle? This cannot be undone.")) return
    try {
      const res = await fetch(`http://localhost:5001/api/admin/cycles/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Cycle deleted")
      fetchCycles()
    } catch {
      toast.error("Failed to delete cycle")
    }
  }

  if (!isAuthenticated || role !== "ADMIN") return null

  return (
    <div className="flex flex-col flex-1 bg-slate-50/50">
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto">

          <div className="mb-8">
            <Link href="/admin" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm hover:bg-slate-50 mb-6">
              <ChevronLeft className="h-4 w-4 mr-1" /> Admin Dashboard
            </Link>
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">Performance Cycles</h1>
                <p className="text-sm text-slate-500">Manage fiscal year cycles and their phases.</p>
              </div>
              <Button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="h-4 w-4 mr-2" /> New Cycle
              </Button>
            </div>
          </div>

          {/* Create Form */}
          {showForm && (
            <Card className="border-indigo-200 shadow-sm rounded-xl bg-white mb-6">
              <CardHeader className="border-b border-slate-100 px-6 py-4">
                <CardTitle className="text-base font-semibold text-slate-800">Create New Cycle</CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Cycle Name</label>
                  <input
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
                    placeholder="e.g., FY 2027"
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Year</label>
                  <input
                    type="number"
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm font-mono"
                    value={form.year}
                    onChange={e => setForm(prev => ({ ...prev, year: e.target.value }))}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={handleCreate} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {isSaving ? "Creating..." : "Create & Activate"}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cycles List */}
          {isLoading ? (
            <div className="flex items-center justify-center h-48 gap-4">
              <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
              <CardContent className="p-0">
                {cycles.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">No performance cycles yet.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {cycles.map(cycle => {
                      const phases = JSON.parse(cycle.phases || '[]')
                      return (
                        <div key={cycle.id} className="p-5 flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${cycle.isActive ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                            {cycle.isActive
                              ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                              : <Circle className="h-5 w-5 text-slate-400" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-800">{cycle.name}</p>
                              {cycle.isActive && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Active</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{phases.length} phases · Year {cycle.year}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {!cycle.isActive && (
                              <Button size="sm" variant="outline" className="border-slate-200 text-slate-700 h-8 text-xs" onClick={() => handleSetActive(cycle.id)}>
                                Set Active
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2" onClick={() => handleDelete(cycle.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
