"use client"

import { useEffect, useState } from "react"
import { unifiedOrganismFieldEngine } from "@/engines/runtime/clientSingletons"

export default function ReconciliationDriftPanel() {
  const [drift, setDrift] = useState<number>(0)

  useEffect(() => {
    const interval = setInterval(() => {
      const state = unifiedOrganismFieldEngine.getState()
      setDrift(state.drift ?? 0)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="border border-red-500/30 p-4 rounded">
      <h2 className="text-red-300 font-semibold">
        Reconciliation Drift
      </h2>

      <div className="mt-2 text-2xl">
        {drift.toFixed(4)}
      </div>

      <div className="text-xs text-neutral-400">
        system ↔ chain divergence
      </div>
    </div>
  )
}
