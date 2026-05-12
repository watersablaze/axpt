'use client'

import { createContext, useContext } from 'react'
import { useUnifiedOrganism } from '@/ui/hooks/useUnifiedOrganism'
import type { UnifiedOrganismState } from '@/engines/runtime/AXPTUnifiedOrganismFieldEngine'

const OrganismContext = createContext<UnifiedOrganismState | null>(null)

export function OrganismStateProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const state = useUnifiedOrganism()

  return (
    <OrganismContext.Provider value={state}>
      {children}
    </OrganismContext.Provider>
  )
}

export const useOrganismState = () => useContext(OrganismContext)