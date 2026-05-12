'use client'

import { forkEngine } from '@/engines/fork/AXPTDeterministicForkEngine'

export default function RealityInspectorPanel() {
  const forks = forkEngine.getFork?.('all') ?? []

  return (
    <div className="rounded-xl border border-blue-500/20 bg-black/60 p-4">

      <h2 className="text-blue-300 text-sm uppercase">
        Causal Inspection
      </h2>

      <pre className="text-xs text-slate-400 mt-3 overflow-auto">
        {JSON.stringify(forks, null, 2)}
      </pre>

    </div>
  )
}