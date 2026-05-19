"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { useRole } from "@/context/role-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { ChevronLeft, Plus, Trash2, Edit2, Check, X, Tag, ToggleLeft, ToggleRight } from "lucide-react"

export default function AdminThrustAreasPage() {
  const { user, isAuthenticated } = useAuth()
  const { role } = useRole()
  const router = useRouter()
  const [thrustAreas, setThrustAreas] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [showAdd, setShowAdd] = useState(false)

  const fetchAreas = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5001/api/thrust-areas/all")
      if (!res.ok) throw new Error()
      setThrustAreas(await res.json())
    } catch {
      toast.error("Failed to load thrust areas")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) { router.push("/"); return }
    if (role !== "ADMIN") { router.push("/dashboard"); return }
    fetchAreas()
  }, [isAuthenticated, role, router, fetchAreas])

  const handleAdd = async () => {
    if (!newName.trim()) return
    try {
      const res = await fetch("http://localhost:5001/api/thrust-areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() })
      })
      if (!res.ok) throw new Error((await res.json()).error?.message)
      toast.success("Thrust area created")
      setNewName(""); setNewDesc(""); setShowAdd(false)
      fetchAreas()
    } catch (e: any) {
      toast.error(e.message || "Failed to create")
    }
  }

  const handleSaveEdit = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:5001/api/thrust-areas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, description: editDesc })
      })
      if (!res.ok) throw new Error((await res.json()).error?.message)
      toast.success("Updated")
      setEditId(null)
      fetchAreas()
    } catch (e: any) {
      toast.error(e.message || "Failed to update")
    }
  }

  const handleToggle = async (ta: any) => {
    try {
      const res = await fetch(`http://localhost:5001/api/thrust-areas/${ta.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !ta.isActive })
      })
      if (!res.ok) throw new Error()
      toast.success(`Thrust area ${ta.isActive ? 'deactivated' : 'activated'}`)
      fetchAreas()
    } catch {
      toast.error("Failed to toggle")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this thrust area?")) return
    try {
      const res = await fetch(`http://localhost:5001/api/thrust-areas/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json()).error?.message)
      toast.success("Deleted")
      fetchAreas()
    } catch (e: any) {
      toast.error(e.message || "Cannot delete - in use by active goals")
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
                <h1 className="text-2xl font-bold text-slate-900 mb-1">Thrust Areas</h1>
                <p className="text-sm text-slate-500">Manage strategic focus categories for goals.</p>
              </div>
              <Button onClick={() => setShowAdd(!showAdd)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="h-4 w-4 mr-2" /> Add Area
              </Button>
            </div>
          </div>

          {showAdd && (
            <Card className="border-indigo-200 shadow-sm rounded-xl bg-white mb-6">
              <CardContent className="p-6 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Name</label>
                  <input className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="e.g., Operations" value={newName} onChange={e => setNewName(e.target.value)} />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Description (optional)</label>
                  <input className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Brief description" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white">Add</Button>
                  <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {thrustAreas.map(ta => (
                    <div key={ta.id} className={`p-5 flex items-center gap-4 ${!ta.isActive ? 'opacity-60' : ''}`}>
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${ta.isActive ? 'bg-indigo-50' : 'bg-slate-100'}`}>
                        <Tag className={`h-4 w-4 ${ta.isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                      </div>

                      {editId === ta.id ? (
                        <div className="flex-1 flex gap-3">
                          <input className="flex-1 rounded-md border border-indigo-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={editName} onChange={e => setEditName(e.target.value)} />
                          <input className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none"
                            value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description" />
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-8" onClick={() => handleSaveEdit(ta.id)}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditId(null)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800">{ta.name}</p>
                            {ta.description && <p className="text-xs text-slate-500 mt-0.5">{ta.description}</p>}
                          </div>
                          {!ta.isActive && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold">Inactive</span>}
                        </>
                      )}

                      {editId !== ta.id && (
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => { setEditId(ta.id); setEditName(ta.name); setEditDesc(ta.description || '') }}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleToggle(ta)}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
                            {ta.isActive ? <ToggleRight className="h-4 w-4 text-indigo-500" /> : <ToggleLeft className="h-4 w-4" />}
                          </button>
                          <button onClick={() => handleDelete(ta.id)}
                            className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
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
