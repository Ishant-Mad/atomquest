"use client"

import { useAuth } from "@/context/auth-context"
import { useRole, Role } from "@/context/role-context"
import { useCycle, CyclePhase } from "@/context/cycle-context"
import { LogOut, User, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

const ROLES: Role[] = ["EMPLOYEE", "MANAGER", "ADMIN"]
const PHASES: CyclePhase[] = ["GOAL_CREATION", "Q1", "Q2", "Q3", "Q4", "REVIEW"]
const PHASE_LABELS: Record<CyclePhase, string> = {
  GOAL_CREATION: "Goal Creation",
  Q1: "Q1",
  Q2: "Q2",
  Q3: "Q3",
  Q4: "Q4",
  REVIEW: "Review",
}

export function Topbar() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const { role, setRole } = useRole()
  const { phase, setPhase } = useCycle()
  const pathname = usePathname()

  if (isLoading || !isAuthenticated || pathname === "/") return null

  const roleIndex = ROLES.indexOf(role)
  const phaseIndex = PHASES.indexOf(phase)

  return (
    <header className="h-14 shrink-0 border-b border-slate-200 bg-white flex items-center px-6 gap-6 justify-between z-30">
      {/* Demo Controls */}
      <div className="flex items-center gap-8">

        {/* Role Slider */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role</span>
          </div>
          <div className="flex items-center bg-slate-100 rounded-full p-0.5 gap-0">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={cn(
                  "px-3 py-1 text-[11px] font-semibold rounded-full transition-all duration-200",
                  role === r
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {r.charAt(0) + r.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Vertical divider */}
        <div className="w-px h-5 bg-slate-200" />

        {/* Cycle Phase Slider */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phase</span>
          </div>
          <div className="flex items-center bg-slate-100 rounded-full p-0.5 gap-0">
            {PHASES.map((p) => (
              <button
                key={p}
                onClick={() => setPhase(p)}
                className={cn(
                  "px-3 py-1 text-[11px] font-semibold rounded-full transition-all duration-200",
                  phase === p
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {PHASE_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
            {(user?.firstName?.[0] || "") + (user?.lastName?.[0] || "")}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-slate-800 leading-none">{user?.firstName} {user?.lastName}</p>
            <p className="text-[10px] text-slate-400 capitalize mt-0.5">{role.toLowerCase()}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}
