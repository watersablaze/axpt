'use client'

import { useForkSystem } from '../fork/useForkSystem'

export default function RealityComparisonLayer() {
  const { forks, activeFork } = useForkSystem()

  const fork = forks.find(f => f.forkId === activeFork)

  if (!fork) {
    return (
      <div className="rounded-xl border border-slate-800 bg-black/60 p-4 text-xs text-slate-500">
        Select a fork to compare reality
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-black/60 p-4">

      <h2 className="text-emerald-300 text-sm uppercase">
        Reality Comparison
      </h2>

      <div className="mt-3 text-xs text-slate-300 space-y-1">

        <div>Drift: {fork.state.drift}</div>
        <div>Intensity: {fork.state.intensity}</div>
        <div>Stability: {fork.state.stability}</div>
        <div>Risk: {fork.state.riskLevel}</div>

      </div>

      <div className="mt-4 text-xs text-purple-300">
        Divergence: {fork.divergenceScore.toFixed(3)}
      </div>

    </div>
  )
}