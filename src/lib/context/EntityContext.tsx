'use client'

import { createContext, useContext, useState, type Dispatch, type SetStateAction } from 'react'

export type EntityState = {
  assets: string[]
  wallets: string[]
  cases: string[]
}

type EntityContextType = {
  entity: EntityState
  setEntity: Dispatch<SetStateAction<EntityState>>
}

const EntityContext = createContext<EntityContextType | null>(null)

export function EntityProvider({ children }: { children: React.ReactNode }) {
  const [entity, setEntity] = useState<EntityState>({
    assets: [],
    wallets: [],
    cases: [],
  })

  return (
    <EntityContext.Provider value={{ entity, setEntity }}>
      {children}
    </EntityContext.Provider>
  )
}

export function useEntity() {
  const ctx = useContext(EntityContext)
  if (!ctx) throw new Error('EntityContext not found')
  return ctx
}
