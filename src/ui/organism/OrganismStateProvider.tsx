'use client'

import { createContext, useContext } from 'react'
import { usePathname } from 'next/navigation'
import { useUnifiedOrganism } from '@/ui/hooks/useUnifiedOrganism'
import type { UnifiedOrganismState } from '@/engines/runtime/AXPTUnifiedOrganismFieldEngine'

const OrganismContext = createContext<UnifiedOrganismState | null>(null)

function AdminOrganismState({
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

export function OrganismStateProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAdmin =
    pathname === '/admin' ||
    pathname.startsWith('/admin/')

  if (!isAdmin) {
    return (
      <OrganismContext.Provider value={null}>
        {children}
      </OrganismContext.Provider>
    )
  }

  return <AdminOrganismState>{children}</AdminOrganismState>
}

export const useOrganismState = () => useContext(OrganismContext)
