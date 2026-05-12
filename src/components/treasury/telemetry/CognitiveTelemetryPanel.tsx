"use client"

import { useEffect, useState } from "react"
import { organismSnapshotStore } from "@/engines/runtime/clientSingletons"

export default function CognitiveTelemetryPanel() {
  const [state, setState] = useState<any>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      const latest = organismSnapshotStore.getLatest()
      setState(latest?.state)
    }, 500)

    return () => clearInterval(interval)
  }, [])

  if (!state) return null

  return (
    <div className="border border-emerald-500/30 p-4 rounded">
      <h2 className="text-emerald-300 font-semibold">
        Cognitive State
      </h2>

      <div className="mt-2 text-sm space-y-1">

        <div>Phase: {state.phase}</div>

        <div>
          Drift:
          <span className="text-red-400 ml-2">
            {state.drift.toFixed(3)}
          </span>
        </div>

        <div>
          Decision Pressure:
          {state.decisionPressure.toFixed(3)}
        </div>

        <div>
          Risk Level:
          <span className="text-yellow-300 ml-2">
            {state.riskLevel}
          </span>
        </div>

        <div>
          Stability:
          {state.stability.toFixed(3)}
        </div>

      </div>
    </div>
  )
}
