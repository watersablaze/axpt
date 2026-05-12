"use client"

import { useState } from "react"
import { forkEngine } from "@/engines/fork/AXPTDeterministicForkEngine"

export default function ForkSimulationPanel() {
  const [result, setResult] = useState<any>(null)

  const runFork = () => {
    const r = forkEngine.fork({
      forkId: crypto.randomUUID(),
      baseSnapshotId: "latest",
      overrides: {
        drift: Math.random(),
        intensity: Math.random(),
      },
    })

    setResult(r)
  }

  return (
    <div className="p-4 border border-purple-500/20 rounded-xl bg-black/60">
      <div className="text-xs text-slate-400">FORK SIMULATION</div>

      <button
        onClick={runFork}
        className="mt-2 px-3 py-1 bg-purple-600 rounded text-xs"
      >
        Run Fork
      </button>

      {result && (
        <div className="mt-2 text-xs">
          Divergence: {result.divergenceScore.toFixed(3)}
        </div>
      )}
    </div>
  )
}