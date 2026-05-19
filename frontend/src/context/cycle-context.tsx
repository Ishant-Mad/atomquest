"use client"

import React, { createContext, useContext, useState } from "react"
import { toast } from "sonner"

export type CyclePhase = "GOAL_CREATION" | "Q1" | "Q2" | "Q3" | "Q4" | "REVIEW"

interface CycleContextType {
  phase: CyclePhase
  setPhase: (phase: CyclePhase) => void
}

const CycleContext = createContext<CycleContextType | undefined>(undefined)

export function CycleProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<CyclePhase>("GOAL_CREATION")

  const handleSetPhase = (newPhase: CyclePhase) => {
    setPhase(newPhase)
    toast.info(`Time Travel: Advanced to ${newPhase.replace("_", " ")}`)
  }

  return (
    <CycleContext.Provider
      value={{
        phase,
        setPhase: handleSetPhase,
      }}
    >
      {children}
    </CycleContext.Provider>
  )
}

export function useCycle() {
  const context = useContext(CycleContext)
  if (context === undefined) {
    throw new Error("useCycle must be used within a CycleProvider")
  }
  return context
}
