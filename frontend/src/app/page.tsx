"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useRole, Role } from "@/context/role-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Target } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const { setRole } = useRole()
  const router = useRouter()

  // Always start fresh on login page — clear any stale session immediately
  useEffect(() => {
    localStorage.removeItem("atomquest-token")
    localStorage.removeItem("atomquest-user")
    localStorage.removeItem("atomquest-role")
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch("http://localhost:5001/api/auth/login", {
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
      const res = await fetch("http://localhost:5001/api/auth/login", {
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

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[400px]"
      >
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-lg border border-primary/20">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight">AtomQuest</span>
          </div>
        </div>
        
        <Card className="border-border bg-card shadow-sm rounded-xl overflow-hidden">
          <form onSubmit={handleLogin}>
            <CardHeader className="space-y-1.5 pb-6">
              <CardTitle className="text-xl font-semibold tracking-tight text-foreground">Sign in to your account</CardTitle>
              <CardDescription className="text-sm">
                Enter your credentials to access your workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-foreground" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                  placeholder="e.g. employee"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium leading-none text-foreground" htmlFor="password">
                    Password
                  </label>
                </div>
                <input
                  id="password"
                  type="password"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-border mt-2">
                <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Demo Quick Login</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button type="button" variant="secondary" size="sm" className="h-8 text-xs font-medium" onClick={() => quickLogin("employee")}>Employee</Button>
                  <Button type="button" variant="secondary" size="sm" className="h-8 text-xs font-medium" onClick={() => quickLogin("manager")}>Manager</Button>
                  <Button type="button" variant="secondary" size="sm" className="h-8 text-xs font-medium" onClick={() => quickLogin("admin")}>Admin</Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2 pb-6">
              <Button className="w-full font-medium" type="submit" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
