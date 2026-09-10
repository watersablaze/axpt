"use client"

import {
  createContext,
  useContext,
} from "react"

import { useCommunicationsStream } from "./useCommunicationsStream"

type CommunicationsRealtimeState =
  ReturnType<
    typeof useCommunicationsStream
  >

const CommunicationsContext =
  createContext<
    CommunicationsRealtimeState | null
  >(null)

export function CommunicationsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const state =
    useCommunicationsStream()

  return (
    <CommunicationsContext.Provider
      value={state}
    >
      {children}
    </CommunicationsContext.Provider>
  )
}

export function useCommunicationsRealtime() {
  const context =
    useContext(
      CommunicationsContext
    )

  if (!context) {
    throw new Error(
      "useCommunicationsRealtime must be used inside CommunicationsProvider"
    )
  }

  return context
}
