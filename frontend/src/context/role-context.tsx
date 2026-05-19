"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { toast } from "sonner"

export type Role = "EMPLOYEE" | "MANAGER" | "ADMIN"

interface RoleContextType {
  role: Role
  setRole: (role: Role) => void
  isDemoMode: boolean
  toggleDemoMode: () => void
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("EMPLOYEE")
  const [isDemoMode, setIsDemoMode] = useState(true) // Default to true for hackathon

  useEffect(() => {
    // Load from local storage if needed
    const savedRole = localStorage.getItem("atomquest-role") as Role
    if (savedRole && ["EMPLOYEE", "MANAGER", "ADMIN"].includes(savedRole)) {
      setRole(savedRole)
    }
  }, [])

  const handleSetRole = (newRole: Role) => {
    setRole(newRole)
    localStorage.setItem("atomquest-role", newRole)
    toast.success(`Role switched to ${newRole}`)
  }

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole: handleSetRole,
        isDemoMode,
        toggleDemoMode: () => setIsDemoMode(!isDemoMode),
      }}
    >
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider")
  }
  return context
}