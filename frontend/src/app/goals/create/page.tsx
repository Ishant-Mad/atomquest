"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import { PlusCircle, Trash2, ChevronLeft, Save, Target, AlignLeft, BarChart3, Scale } from "lucide-react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { apiUrl } from "@/lib/api"

const UOM_OPTIONS = ["NUMERIC", "PERCENTAGE", "TIMELINE", "ZERO_BASED"]

export default function CreateGoalSheetPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [goals, setGoals] = useState([
    { thrustArea: "", title: "", description: "", uom: "NUMERIC", target: "", weightage: 10, optimizationDirection: "" }
  ])
  const [thrustAreas, setThrustAreas] = useState<any[]>([])
  const [activeCycleId, setActiveCycleId] = useState<string>("")

  useEffect(() => {
    if (isAuthenticated) {
      fetch(apiUrl("/api/thrust-areas"))
        .then(res => res.json())
        .then(data => setThrustAreas(data))
        .catch(err => console.error("Failed to load thrust areas", err))
      fetch(apiUrl("/api/admin/stats"))
        .then(res => res.json())
        .then(data => { if (data.activeCycle?.id) setActiveCycleId(data.activeCycle.id) })
        .catch(console.error)
    }
  }, [isAuthenticated])

  if (!isAuthenticated || !user) return null

  const totalWeight = goals.reduce((sum, g) => sum + Number(g.weightage), 0)

  const handleAddGoal = () => {
    if (goals.length >= 8) {
      toast.error("Maximum 8 goals allowed")
      return
    }
    setGoals([...goals, { thrustArea: "", title: "", description: "", uom: "NUMERIC", target: "", weightage: 10, optimizationDirection: "" }])
  }

  const handleRemoveGoal = (index: number) => {
    if (goals.length <= 1) {
      toast.error("At least 1 goal is required")
      return
    }
    setGoals(goals.filter((_, i) => i !== index))
  }

  const handleChange = (index: number, field: string, value: any) => {
    const newGoals = [...goals]
    newGoals[index] = { ...newGoals[index], [field]: value }
    setGoals(newGoals)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (totalWeight !== 100) {
      toast.error(`Total weightage is ${totalWeight}%. It must be exactly 100%.`)
      return
    }
    
    if (goals.some(g => Number(g.weightage) < 10)) {
      toast.error("Every goal must have at least 10% weightage.")
      return
    }

    if (goals.some(g => (g.uom === "NUMERIC" || g.uom === "PERCENTAGE") && !g.optimizationDirection)) {
      toast.error("Please select Optimization Direction for Numeric/Percentage goals.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(apiUrl("/api/goal-sheets"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: user.id,
          cycleId: activeCycleId || "cycle-fy2026",
          goals: goals.map(g => ({ ...g, weightage: Number(g.weightage) }))
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || "Failed to save")
      
      toast.success("Goal sheet saved as draft!")
      router.push("/dashboard")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col bg-background min-h-full">
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto">
          
          <div className="mb-8">
            <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6 bg-card border border-border px-3 py-1.5 rounded-full shadow-sm hover:bg-background">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to Dashboard
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">Draft Goal Sheet</h1>
                <p className="text-sm text-muted-foreground">Define clear, measurable objectives for the upcoming cycle.</p>
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
            {goals.map((goal, idx) => (
              <Card key={idx} className="shadow-sm border-border rounded-xl overflow-hidden bg-card">
                <CardHeader className="bg-background border-b border-border py-4 px-6 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded flex items-center justify-center font-bold text-xs bg-primary/10 text-primary">
                      {idx + 1}
                    </div>
                    <CardTitle className="text-sm font-semibold text-foreground">Objective Definition</CardTitle>
                  </div>
                  {goals.length > 1 && (
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
                      className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                      value={goal.thrustArea}
                      onChange={(e) => handleChange(idx, "thrustArea", e.target.value)}
                    >
                      <option value="" disabled>Select Area</option>
                      {thrustAreas.map(ta => (
                        <option key={ta.id} value={ta.name}>{ta.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2 md:col-span-8">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">Title</label>
                    <input
                      required
                      className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                      placeholder="e.g., Increase user retention by 15% in Q3"
                      value={goal.title}
                      onChange={(e) => handleChange(idx, "title", e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-12">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">Description</label>
                    <textarea
                      required
                      className="w-full min-h-[80px] rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm resize-y"
                      placeholder="Provide detailed context, milestones, and how this will be measured..."
                      value={goal.description}
                      onChange={(e) => handleChange(idx, "description", e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-4">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">Metric Type</label>
                    <select
                      className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
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
                      className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm font-mono"
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

                  {(goal.uom === 'NUMERIC' || goal.uom === 'PERCENTAGE') && (
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
            ))}

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
              {totalWeight === 100 ? 'Ready to save' : 'Weightage must be 100%'}
            </span>
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || totalWeight !== 100}
            className="bg-primary hover:bg-primary/90 text-white px-8"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Draft Sheet'}
          </Button>
        </div>
      </div>
    </div>
  )
}
