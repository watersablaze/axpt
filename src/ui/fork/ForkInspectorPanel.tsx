'use client'

import { useForkSystem } from './useForkSystem'

export default function ForkInspectorPanel() {
  const { forks } = useForkSystem()

  return (
    <div className="rounded-xl border border-blue-500/20 bg-black/60 p-4">

      <h2 className="text-blue-300 text-sm uppercase">
        Fork Deep State
      </h2>

      <pre className="text-xs text-slate-400 overflow-auto">
        {JSON.stringify(forks, null, 2)}
      </pre>

    </div>
  )
}