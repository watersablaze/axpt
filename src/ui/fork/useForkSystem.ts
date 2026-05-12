'use client'

import { useEffect, useState } from 'react'
import { forkEngine } from '@/engines/fork/AXPTDeterministicForkEngine'

export type ForkState = ReturnType<typeof forkEngine.fork> | null

export function useForkSystem() {
  const [forks, setForks] = useState<any[]>([])
  const [activeFork, setActiveFork] = useState<string | null>(null)

  const refresh = () => {
    // naive pull model (can upgrade later to event-driven)
    setForks(forkEngine.getAll?.() ?? [])
  }

  useEffect(() => {
    const id = setInterval(refresh, 500)
    return () => clearInterval(id)
  }, [])

  const createFork = (input: any) => {
    const result = forkEngine.fork(input)
    refresh()
    return result
  }

  return {
    forks,
    activeFork,
    setActiveFork,
    createFork,
  }
}