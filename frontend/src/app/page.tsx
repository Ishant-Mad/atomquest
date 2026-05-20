"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useRole, Role } from "@/context/role-context"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Target, User, Shield, Users } from "lucide-react"
import { apiUrl } from "@/lib/api"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [backendStatus, setBackendStatus] = useState<"checking" | "sleeping" | "ready">("checking")
  const { login } = useAuth()
  const { setRole } = useRole()
  const router = useRouter()

  const backendReady = backendStatus === "ready"

  // Always start fresh on login page — clear any stale session immediately
  useEffect(() => {
    localStorage.removeItem("atomquest-token")
    localStorage.removeItem("atomquest-user")
    localStorage.removeItem("atomquest-role")

    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    const probeBackend = async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 1800)

      try {
        const res = await fetch(apiUrl("/api/health"), {
          cache: "no-store",
          signal: controller.signal,
        })

        if (!cancelled && res.ok) {
          setBackendStatus("ready")
          return
        }

        throw new Error("Backend asleep")
      } catch {
        if (!cancelled) {
          setBackendStatus("sleeping")
          retryTimer = setTimeout(probeBackend, 3500)
        }
      } finally {
        clearTimeout(timeoutId)
      }
    }

    probeBackend()

    return () => {
      cancelled = true
      if (retryTimer) clearTimeout(retryTimer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error?.message || "Login failed")
      }

      login(data.token, data.user)
      setRole(data.user.roles as Role)
      router.push("/dashboard")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Demo auto-fill and login
  const quickLogin = async (demoRole: string) => {
    setUsername(demoRole)
    setPassword("Password123!")
    setIsLoading(true)

    try {
      const res = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: demoRole, password: "Password123!" })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error?.message || "Login failed")
      }

      login(data.token, data.user)
      setRole(data.user.roles as Role)
      router.push("/dashboard")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const demoPersonas = [
    { role: "employee", label: "Employee", desc: "Priya Sharma", icon: User },
    { role: "manager", label: "Manager", desc: "Ananya Kumar", icon: Users },
    { role: "admin", label: "Admin", desc: "System Admin", icon: Shield },
  ]

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{
          opacity: backendReady ? 1 : 0.72,
          y: 0,
          filter: backendReady ? "grayscale(0%)" : "grayscale(1%)",
        }}
        transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
        className="w-full max-w-[420px]"
      >
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2.5 rounded-lg">
              <Target className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight text-foreground">AtomQuest</span>
          </div>
        </div>

        {/* Sign in form */}
        <div className="bg-card border border-border rounded-xl p-6 relative overflow-hidden">
          <div className="mb-4">
            <div
              className={`inline-flex max-w-full rounded-md border px-2.5 py-1 text-[11px] font-medium transition-all duration-300 ${
                backendReady
                  ? "border-primary/40 bg-primary/8 text-primary shadow-[0_0_0_1px_rgba(0,0,0,0.02)]"
                  : "border-primary/35 bg-primary/5 text-primary/90"
              }`}
            >
              {backendReady
                ? "Ready to go! The backend has woken up and is back on duty."
                : backendStatus === "sleeping"
                  ? "Backend is on a free-tier nap. We&apos;re knocking softly. Please have patience."
                  : "Knocking on the backend door... it may be snoozing."}
            </div>
          </div>

          <div className={!backendReady ? "pointer-events-none select-none opacity-30 blur-[1px] transition duration-300" : "transition duration-300"}>
          <form onSubmit={handleLogin}>
            <div className="mb-6">
              <h1 className="text-lg font-heading font-semibold text-foreground">Sign in to your account</h1>
              <p className="text-sm text-muted-foreground mt-1">Enter your credentials to access your workspace.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                  placeholder="e.g. employee"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ transitionDuration: 'var(--duration-fast)' }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ transitionDuration: 'var(--duration-fast)' }}
                />
              </div>

              <Button className="w-full font-medium bg-primary text-primary-foreground hover:bg-primary/90" type="submit" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>

          {/* Demo quick login */}
          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3 font-medium">Quick demo access</p>
            <div className="grid grid-cols-3 gap-2">
              {demoPersonas.map(p => (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => quickLogin(p.role)}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border border-border bg-background hover:border-primary/30 hover:bg-accent/30 transition-colors text-center group"
                  style={{ transitionDuration: 'var(--duration-normal)', transitionTimingFunction: 'var(--ease-out-quart)' }}
                >
                  <p.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xs font-semibold text-foreground">{p.label}</span>
                  <span className="text-[10px] text-muted-foreground">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
