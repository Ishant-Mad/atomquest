"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { useRole } from "@/context/role-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { ChevronLeft, Users, Plus, Edit2, Trash2, Check, X, UserCheck, UserX } from "lucide-react"

export default function AdminUsersPage() {
  const { user, isAuthenticated } = useAuth()
  const { role } = useRole()
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<any>({})
  const [showAdd, setShowAdd] = useState(false)
  const [newUser, setNewUser] = useState({ username: "", email: "", firstName: "", lastName: "", roles: "EMPLOYEE", managerId: "" })

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5001/api/admin/users")
      if (!res.ok) throw new Error()
      setUsers(await res.json())
    } catch {
      toast.error("Failed to load users")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) { router.push("/"); return }
    if (role !== "ADMIN") { router.push("/dashboard"); return }
    fetchUsers()
  }, [isAuthenticated, role, router, fetchUsers])

  const handleAdd = async () => {
    if (!newUser.username || !newUser.email || !newUser.firstName || !newUser.lastName) {
      toast.error("All fields are required")
      return
    }
    try {
      const res = await fetch("http://localhost:5001/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newUser, managerId: newUser.managerId || null })
      })
      if (!res.ok) throw new Error((await res.json()).error?.message)
      toast.success("User created (default password: Password123!)")
      setShowAdd(false)
      setNewUser({ username: "", email: "", firstName: "", lastName: "", roles: "EMPLOYEE", managerId: "" })
      fetchUsers()
    } catch (e: any) {
      toast.error(e.message || "Failed to create user")
    }
  }

  const handleSaveEdit = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:5001/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData)
      })
      if (!res.ok) throw new Error((await res.json()).error?.message)
      toast.success("User updated")
      setEditId(null)
      fetchUsers()
    } catch (e: any) {
      toast.error(e.message || "Failed to update")
    }
  }

  const handleDeactivate = async (id: string) => {
    if (!confirm("Deactivate this user? Their goal sheets will be preserved.")) return
    try {
      const res = await fetch(`http://localhost:5001/api/admin/users/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("User deactivated")
      fetchUsers()
    } catch {
      toast.error("Failed to deactivate user")
    }
  }

  const managers = users.filter(u => u.roles === 'MANAGER' || u.roles === 'ADMIN')

  const roleColors: Record<string, string> = {
    ADMIN: "bg-violet-100 text-violet-700",
    MANAGER: "bg-primary/10 text-primary",
    EMPLOYEE: "bg-secondary text-muted-foreground",
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
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">Org Hierarchy</h1>
                <p className="text-sm text-muted-foreground">Manage employees, roles, and reporting relationships.</p>
              </div>
              <Button onClick={() => setShowAdd(!showAdd)} className="bg-primary hover:bg-primary/90 text-white">
                <Plus className="h-4 w-4 mr-2" /> Add User
              </Button>
            </div>
          </div>

          {/* Add Form */}
          {showAdd && (
            <Card className="border-primary/20 shadow-sm rounded-xl bg-card mb-6">
              <CardHeader className="border-b border-border px-6 py-4">
                <CardTitle className="text-base font-semibold text-foreground">Add New User</CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { key: "firstName", label: "First Name", placeholder: "John" },
                  { key: "lastName", label: "Last Name", placeholder: "Smith" },
                  { key: "username", label: "Username", placeholder: "jsmith" },
                  { key: "email", label: "Email", placeholder: "john@company.com" },
                ].map(f => (
                  <div key={f.key} className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">{f.label}</label>
                    <input
                      className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder={f.placeholder}
                      value={(newUser as any)[f.key]}
                      onChange={e => setNewUser(prev => ({ ...prev, [f.key]: e.target.value }))}
                    />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">Role</label>
                  <select className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm focus:outline-none"
                    value={newUser.roles} onChange={e => setNewUser(prev => ({ ...prev, roles: e.target.value }))}>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">Reports To</label>
                  <select className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm focus:outline-none"
                    value={newUser.managerId} onChange={e => setNewUser(prev => ({ ...prev, managerId: e.target.value }))}>
                    <option value="">No Manager</option>
                    {managers.map(m => (
                      <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-3 flex gap-2 justify-end pt-2 border-t border-border">
                  <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90 text-white">Create User</Button>
                  <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Users Table */}
          <Card className="border-border shadow-sm rounded-xl overflow-hidden bg-card">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {users.map(u => (
                    <div key={u.id} className={`p-4 flex items-center gap-4 ${!u.isActive ? 'opacity-50' : ''}`}>
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                        {(u.firstName?.[0] || '') + (u.lastName?.[0] || '')}
                      </div>

                      {editId === u.id ? (
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                          <input className="rounded-md border border-border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            value={editData.firstName || ''} onChange={e => setEditData((p: any) => ({ ...p, firstName: e.target.value }))} placeholder="First Name" />
                          <input className="rounded-md border border-border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            value={editData.lastName || ''} onChange={e => setEditData((p: any) => ({ ...p, lastName: e.target.value }))} placeholder="Last Name" />
                          <select className="rounded-md border border-border px-3 py-1.5 text-sm focus:outline-none"
                            value={editData.roles || ''} onChange={e => setEditData((p: any) => ({ ...p, roles: e.target.value }))}>
                            <option value="EMPLOYEE">Employee</option>
                            <option value="MANAGER">Manager</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                          <select className="rounded-md border border-border px-3 py-1.5 text-sm focus:outline-none"
                            value={editData.managerId || ''} onChange={e => setEditData((p: any) => ({ ...p, managerId: e.target.value || null }))}>
                            <option value="">No Manager</option>
                            {managers.filter(m => m.id !== u.id).map(m => (
                              <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                            ))}
                          </select>
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 col-span-1" onClick={() => handleSaveEdit(u.id)}>
                            <Check className="h-3.5 w-3.5 mr-1" /> Save
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditId(null)}>
                            <X className="h-3.5 w-3.5 mr-1" /> Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">{u.firstName} {u.lastName}</p>
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${roleColors[u.roles]}`}>{u.roles}</span>
                              {!u.isActive && <span className="text-[10px] font-bold text-muted-foreground uppercase">Inactive</span>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{u.email} · Reports to: {u.manager ? `${u.manager.firstName} ${u.manager.lastName}` : 'No one'}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-muted-foreground">{u._count?.directReports || 0} reports · {u._count?.goalSheets || 0} sheets</p>
                          </div>
                        </>
                      )}

                      {editId !== u.id && (
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => { setEditId(u.id); setEditData({ firstName: u.firstName, lastName: u.lastName, roles: u.roles, managerId: u.managerId || '' }) }}
                            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          {u.isActive && u.id !== user?.id && (
                            <button onClick={() => handleDeactivate(u.id)}
                              className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
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
