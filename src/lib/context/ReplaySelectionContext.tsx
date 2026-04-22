'use client'

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react'

type ReplaySelectionContextValue = {
  selectedDecisionId: string | null
  setSelectedDecisionId: (decisionId: string | null) => void
}

const ReplaySelectionContext =
  createContext<ReplaySelectionContextValue | null>(null)

export function ReplaySelectionProvider({
  children,
}: {
  children: ReactNode
}) {
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(
    null
  )

  return (
    <ReplaySelectionContext.Provider
      value={{ selectedDecisionId, setSelectedDecisionId }}
    >
      {children}
    </ReplaySelectionContext.Provider>
  )
}

export function useReplaySelection() {
  const context = useContext(ReplaySelectionContext)

  if (!context) {
    throw new Error(
      'useReplaySelection must be used within ReplaySelectionProvider'
    )
  }

  return context
}
