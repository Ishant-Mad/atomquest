"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useRole } from "@/context/role-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { ChevronLeft, BarChart2, TrendingUp, Target, Users, Activity, Layers } from "lucide-react"
import Link from "next/link"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart
} from "recharts"

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6']
const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8', PENDING_APPROVAL: '#f59e0b', APPROVED: '#10b981', RETURNED: '#ef4444'
}

export default function AdminAnalyticsPage() {
  const { isAuthenticated } = useAuth()
  const { role } = useRole()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) { router.push("/"); return }
    if (role !== "ADMIN") { router.push("/dashboard"); return }

    fetch("http://localhost:5001/api/admin/analytics")
      .then(r => r.json())
      .then(d => { setData(d); setIsLoading(false) })
      .catch(() => { toast.error("Failed to load analytics"); setIsLoading(false) })
  }, [isAuthenticated, role, router])

  if (!isAuthenticated || role !== "ADMIN") return null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) return null

  const statusData = data.statusDistribution?.map((s: any) => ({
    name: s.status.replace('_', ' '),
    value: s.count,
    fill: STATUS_COLORS[s.status] || '#94a3b8'
  })) || []

  return (
    <div className="flex flex-col flex-1 bg-background">
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">

          <div className="mb-8">
            <Link href="/admin" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground bg-card border border-border px-3 py-1.5 rounded-full shadow-sm hover:bg-background mb-6">
              <ChevronLeft className="h-4 w-4 mr-1" /> Admin Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-foreground mb-1">Analytics & Insights</h1>
            <p className="text-sm text-muted-foreground">
              Quarter-on-Quarter trends, goal distribution analysis, and manager effectiveness metrics for {data.cycle?.name || 'the active cycle'}.
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KpiCard icon={<Target className="h-5 w-5 text-primary" />} bg="bg-primary/10" label="Total Goals" value={data.totalGoals} />
            <KpiCard icon={<Layers className="h-5 w-5 text-primary" />} bg="bg-primary/10" label="Thrust Areas" value={data.thrustAreaDistribution?.length || 0} color="text-primary" />
            <KpiCard icon={<Users className="h-5 w-5 text-emerald-600" />} bg="bg-emerald-50" label="Managers Tracked" value={data.managerEffectiveness?.length || 0} color="text-emerald-600" />
            <KpiCard
              icon={<TrendingUp className="h-5 w-5 text-primary" />}
              bg="bg-primary/10"
              label="Avg Q1 Score"
              value={`${data.qoqTrends?.[0]?.avgScore || 0}%`}
              color="text-primary"
            />
          </div>

          {/* Charts Row 1: QoQ Trends + Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* QoQ Achievement Trends */}
            <Card className="border-border shadow-sm rounded-xl bg-card">
              <CardHeader className="border-b border-border px-6 py-4">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Quarter-on-Quarter Achievement Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={data.qoqTrends}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="quarter" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                      formatter={(value: any, name: any) => [`${value}%`, name === 'avgScore' ? 'Avg Score' : name]}
                    />
                    <Area type="monotone" dataKey="avgScore" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Goal Sheet Status */}
            <Card className="border-border shadow-sm rounded-xl bg-card">
              <CardHeader className="border-b border-border px-6 py-4">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-600" /> Goal Sheet Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusData.map((entry: any, index: number) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2: Thrust Area + UoM Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Thrust Area Distribution */}
            <Card className="border-border shadow-sm rounded-xl bg-card">
              <CardHeader className="border-b border-border px-6 py-4">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-primary" /> Goals by Thrust Area
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.thrustAreaDistribution} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} width={100} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {data.thrustAreaDistribution?.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* UoM Distribution */}
            <Card className="border-border shadow-sm rounded-xl bg-card">
              <CardHeader className="border-b border-border px-6 py-4">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" /> Goals by Measurement Type
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={data.uomDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="count"
                      nameKey="name"
                      label={({ name, value }: any) => `${String(name).replace('_', ' ')}: ${value}`}
                    >
                      {data.uomDistribution?.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Manager Effectiveness Table */}
          <Card className="border-border shadow-sm rounded-xl overflow-hidden bg-card mb-6">
            <CardHeader className="border-b border-border px-6 py-4">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-amber-600" /> Manager Effectiveness Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data.managerEffectiveness?.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">No manager data available</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-background border-b border-border">
                    <tr>
                      {["Manager", "Direct Reports", "Completed Check-ins", "Completion Rate"].map(h => (
                        <th key={h} className="text-left px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.managerEffectiveness?.map((m: any) => (
                      <tr key={m.id} className="hover:bg-background transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                              {m.name.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <span className="font-semibold text-foreground">{m.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground font-mono">{m.directReports}</td>
                        <td className="px-6 py-4 text-muted-foreground font-mono">{m.completedCheckIns}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Progress
                              value={m.completionRate}
                              className="flex-1 h-1.5 bg-secondary max-w-[120px]"
                              indicatorClassName={m.completionRate >= 80 ? "bg-emerald-500" : m.completionRate >= 50 ? "bg-amber-500" : "bg-red-500"}
                            />
                            <span className={`text-xs font-bold ${m.completionRate >= 80 ? 'text-emerald-600' : m.completionRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                              {m.completionRate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* Heatmap */}
          {data.heatmapData?.length > 0 && (
            <Card className="border-border shadow-sm rounded-xl overflow-hidden bg-card">
              <CardHeader className="border-b border-border px-6 py-4">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4 text-red-600" /> Check-in Completion Heatmap (by Team × Quarter)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left px-4 py-2 text-xs font-bold text-muted-foreground uppercase">Team Lead</th>
                        {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
                          <th key={q} className="text-center px-4 py-2 text-xs font-bold text-muted-foreground uppercase">{q}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.heatmapData.map((row: any) => (
                        <tr key={row.manager}>
                          <td className="px-4 py-3 font-semibold text-foreground">{row.manager}</td>
                          {row.quarters.map((q: any) => {
                            const pct = q.total > 0 ? Math.round((q.completions / q.total) * 100) : 0
                            const bg = pct >= 80 ? 'bg-emerald-100 text-emerald-800' : pct >= 50 ? 'bg-amber-100 text-amber-800' : pct > 0 ? 'bg-red-100 text-red-800' : 'bg-background text-muted-foreground'
                            return (
                              <td key={q.quarter} className="px-4 py-3 text-center">
                                <span className={`inline-flex items-center justify-center w-16 h-8 rounded-md text-xs font-bold ${bg}`}>
                                  {q.completions}/{q.total}
                                </span>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function KpiCard({ icon, bg, label, value, color = "text-foreground" }: { icon: React.ReactNode; bg: string; label: string; value: any; color?: string }) {
  return (
    <Card className="bg-card border-border shadow-sm rounded-xl">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`h-10 w-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>{icon}</div>
        <div>
          <p className={`text-2xl font-black ${color}`}>{value}</p>
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
