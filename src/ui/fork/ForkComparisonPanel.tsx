'use client'

import { useForkSystem } from './useForkSystem'

export default function ForkComparisonPanel() {
  const { forks, activeFork } = useForkSystem()

  const selected = forks.find(f => f.forkId === activeFork)

  if (!selected) return null

  return (
    <div className="rounded-xl border border-purple-500/20 bg-black/60 p-4">

      <h2 className="text-sm text-purple-300 uppercase">
        Fork Inspection
      </h2>

      <div className="mt-3 text-xs space-y-1 text-slate-300">

        <div>Drift: {selected.state.drift}</div>
        <div>Intensity: {selected.state.intensity}</div>
        <div>Stability: {selected.state.stability}</div>
        <div>Risk: {selected.state.riskLevel}</div>

      </div>

    </div>
  )
}