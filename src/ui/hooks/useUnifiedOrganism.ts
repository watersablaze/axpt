"use client"

import { useEffect, useState } from "react"
import type { UnifiedOrganismState } from "../../types/organism"

export function useUnifiedOrganism() {
  const [state, setState] = useState<UnifiedOrganismState | null>(null)

  useEffect(() => {
    fetch("/api/organism/state")
      .then(r => r.json())
      .then(setState)
  }, [])

  return state
}
