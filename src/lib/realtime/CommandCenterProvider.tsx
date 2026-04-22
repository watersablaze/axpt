"use client"

import { createContext, useContext } from "react"
import { useCommandCenterStream } from "./useCommandCenterStream"

type CommandCenterState = ReturnType<typeof useCommandCenterStream>

const CommandCenterContext = createContext<CommandCenterState | null>(null)

export function CommandCenterProvider({ children }: { children: React.ReactNode }) {

  const state = useCommandCenterStream()

  return (
    <CommandCenterContext.Provider value={state}>
      {children}
    </CommandCenterContext.Provider>
  )
}

export function useCommandCenter() {
  const ctx = useContext(CommandCenterContext)

  if (!ctx) {
    throw new Error("useCommandCenter must be used inside CommandCenterProvider")
  }

  return ctx
}