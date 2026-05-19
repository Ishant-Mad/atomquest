"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useRole } from "@/context/role-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Users, Save, Target, ChevronLeft } from "lucide-react"
import Link from "next/link"

const UOM_OPTIONS = ["NUMERIC", "PERCENTAGE", "TIMELINE", "ZERO_BASED"]

export default function CreateSharedGoalPage() {
  const { user, isAuthenticated } = useAuth()
  const { role } = useRole()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [team, setTeam] = useState<any[]>([])
  const [thrustAreas, setThrustAreas] = useState<any[]>([])

  const [goal, setGoal] = useState({
    thrustArea: "",
    title: "",
    description: "",
    uom: "NUMERIC",
    target: "",
    weightage: 10,
    optimizationDirection: ""
  })
  
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])

  useEffect(() => {
    if (!isAuthenticated) return
    if (role === "EMPLOYEE") {
      router.push("/dashboard")
      return
    }

    // Fetch team (mocked here, ideally `/api/users/team/${user.id}`)
    fetch(`http://localhost:5001/api/users`)
      .then(res => res.json())
      .then(data => {
        setTeam(data.filter((u: any) => u.id !== user?.id && u.roles !== "ADMIN"))
      })
      .catch(err => console.error(err))

    fetch("http://localhost:5001/api/thrust-areas")
      .then(res => res.json())
      .then(data => setThrustAreas(data))
      .catch(err => console.error(err))
  }, [isAuthenticated, role, router, user?.id])

  const toggleEmployee = (id: string) => {
    setSelectedEmployees(prev => 
      prev.includes(id) ? prev.filter(eId => eId !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedEmployees.length === 0) {
      toast.error("Please select at least one employee")
      return
    }

    if ((goal.uom === "NUMERIC" || goal.uom === "PERCENTAGE") && !goal.optimizationDirection) {
      toast.error("Please select Optimization Direction for Numeric/Percentage goals.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("http://localhost:5001/api/goal-sheets/shared", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          managerId: user?.id,
          employeeIds: selectedEmployees,
          cycleId: "29aeae5b-531a-4a92-90f1-8e7dee5b0d5c",
          goalData: { ...goal, weightage: Number(goal.weightage) }
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || "Failed to push goal")
      
      toast.success(`Goal successfully pushed to ${selectedEmployees.length} employees!`)
      router.push("/dashboard")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAuthenticated || role === "EMPLOYEE") return null

  return (
    <div className="flex flex-col flex-1 bg-slate-50/50 pb-24">
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">
          
          <div className="mb-8">
            <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-6 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm hover:bg-slate-50">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to Dashboard
            </Link>
            
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Push Shared Goal</h1>
              <p className="text-sm text-slate-500">Define a core objective and cascade it down to selected team members.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Goal Definition Form */}
            <div className="lg:col-span-8">
              <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                  <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                    <Target className="h-4 w-4 text-indigo-600" /> Objective Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-6 md:grid-cols-12">
                    <div className="space-y-2 md:col-span-5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Thrust Area</label>
                      <select
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
                        value={goal.thrustArea}
                        onChange={(e) => setGoal({ ...goal, thrustArea: e.target.value })}
                        required
                      >
                        <option value="" disabled>Select Area</option>
                        {thrustAreas.map(ta => (
                          <option key={ta.id} value={ta.name}>{ta.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2 md:col-span-7">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Title</label>
                      <input
                        required
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
                        placeholder="e.g., Increase user retention by 15% in Q3"
                        value={goal.title}
                        onChange={(e) => setGoal({ ...goal, title: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-12">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Description</label>
                      <textarea
                        required
                        className="w-full min-h-[100px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm resize-y"
                        placeholder="Provide detailed context..."
                        value={goal.description}
                        onChange={(e) => setGoal({ ...goal, description: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-4">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Metric Type</label>
                      <select
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
                        value={goal.uom}
                        onChange={(e) => setGoal({ ...goal, uom: e.target.value, optimizationDirection: "" })}
                      >
                        {UOM_OPTIONS.map(uom => <option key={uom} value={uom}>{uom.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                    
                    <div className="space-y-2 md:col-span-5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Target Value</label>
                      <input
                        required
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm font-mono"
                        placeholder="e.g., 100 or YYYY-MM-DD"
                        value={goal.target}
                        onChange={(e) => setGoal({ ...goal, target: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-3">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Weightage (%)</label>
                      <div className="relative">
                        <input
                          required
                          type="number"
                          min="10"
                          max="100"
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm font-mono font-bold"
                          value={goal.weightage}
                          onChange={(e) => setGoal({ ...goal, weightage: Number(e.target.value) })}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                      </div>
                    </div>

                    {(goal.uom === 'NUMERIC' || goal.uom === 'PERCENTAGE') && (
                      <div className="space-y-3 md:col-span-12 border-t border-slate-100 pt-4 mt-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Optimization Direction</label>
                        <div className="flex gap-4">
                          <label className={`flex-1 flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${goal.optimizationDirection === 'higher_better' ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                            <div>
                              <p className={`text-sm font-semibold ${goal.optimizationDirection === 'higher_better' ? 'text-indigo-700' : 'text-slate-700'}`}>Higher is Better</p>
                              <p className="text-xs text-slate-500 mt-0.5">Maximize this metric</p>
                            </div>
                            <input 
                              type="radio" 
                              name="optDir" 
                              value="higher_better" 
                              checked={goal.optimizationDirection === 'higher_better'}
                              onChange={(e) => setGoal({ ...goal, optimizationDirection: e.target.value })}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300" 
                            />
                          </label>
                          <label className={`flex-1 flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${goal.optimizationDirection === 'lower_better' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                            <div>
                              <p className={`text-sm font-semibold ${goal.optimizationDirection === 'lower_better' ? 'text-blue-700' : 'text-slate-700'}`}>Lower is Better</p>
                              <p className="text-xs text-slate-500 mt-0.5">Minimize this metric</p>
                            </div>
                            <input 
                              type="radio" 
                              name="optDir" 
                              value="lower_better" 
                              checked={goal.optimizationDirection === 'lower_better'}
                              onChange={(e) => setGoal({ ...goal, optimizationDirection: e.target.value })}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" 
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Team Selection Sidebar */}
            <div className="lg:col-span-4">
              <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden bg-white sticky top-8">
                <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                      <Users className="h-4 w-4 text-indigo-600" /> Select Team
                    </CardTitle>
                    <div className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                      {selectedEmployees.length} Selected
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                    {team.length === 0 ? (
                      <div className="p-6 text-center">
                        <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No team members found</p>
                      </div>
                    ) : (
                      team.map((member) => {
                        const isSelected = selectedEmployees.includes(member.id)
                        return (
                          <div
                            key={member.id}
                            className={`flex items-center p-4 cursor-pointer transition-colors ${
                              isSelected ? "bg-indigo-50 border-l-4 border-indigo-600" : "hover:bg-slate-50 border-l-4 border-transparent"
                            }`}
                            onClick={() => toggleEmployee(member.id)}
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-4 cursor-pointer"
                              checked={isSelected}
                              readOnly
                            />
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                              }`}>
                                {(member.firstName?.[0] || "") + (member.lastName?.[0] || "")}
                              </div>
                              <div>
                                <p className={`text-sm font-semibold ${isSelected ? "text-indigo-900" : "text-slate-700"}`}>
                                  {member.firstName} {member.lastName}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">{member.roles}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 right-0 left-64 p-4 bg-white border-t border-slate-200 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-end">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || selectedEmployees.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 shadow-sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Cascading...' : 'Push Shared Goal'}
          </Button>
        </div>
      </div>
    </div>
  )
}
