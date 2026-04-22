"use client"

import { createContext, useContext, useState, ReactNode } from "react"

type Operator = {
  id: string
  name: string
  archetype: string
}

type OperatorContextType = {
  operator: Operator | null
  setOperator: (op: Operator) => void
}

const OperatorContext = createContext<OperatorContextType | null>(null)

export function OperatorProvider({ children }: { children: ReactNode }) {
  const [operator, setOperator] = useState<Operator | null>(null)

  return (
    <OperatorContext.Provider value={{ operator, setOperator }}>
      {children}
    </OperatorContext.Provider>
  )
}

export function useOperator() {
  const ctx = useContext(OperatorContext)
  if (!ctx) throw new Error("useOperator must be used within OperatorProvider")
  return ctx
}