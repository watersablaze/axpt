"use client"

import { useEffect, useState } from "react"
import { unifiedOrganismFieldEngine } from "@/engines/runtime/clientSingletons"

export default function SystemTelemetryPanel() {
  const [state, setState] = useState<any>(null)

  useEffect(() => {
    const i = setInterval(() => {
      setState(unifiedOrganismFieldEngine.getState())
    }, 250)

    return () => clearInterval(i)
  }, [])

  if (!state) return null

  return (
    <div className="p-4 border border-neutral-800 rounded-xl bg-black/60">
      <div className="text-xs text-slate-400">SYSTEM TELEMETRY</div>

      <div className="mt-2 text-sm space-y-1">
        <div>Drift: {state.drift.toFixed(3)}</div>
        <div>Intensity: {state.intensity.toFixed(3)}</div>
        <div>Stability: {state.stability.toFixed(3)}</div>
        <div>Liquidity: {state.liquidity.toFixed(3)}</div>
        <div>Decision Pressure: {state.decisionPressure.toFixed(3)}</div>
        <div>Risk: {state.riskLevel}</div>
      </div>
    </div>
  )
}
