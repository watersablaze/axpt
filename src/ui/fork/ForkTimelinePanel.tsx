'use client'

import { useForkSystem } from './useForkSystem'

export default function ForkTimelinePanel() {
  const { forks, setActiveFork } = useForkSystem()

  return (
    <div className="rounded-xl border border-slate-800 bg-black/60 p-4 space-y-2">

      <h2 className="text-sm text-slate-300 uppercase">
        Active Forks
      </h2>

      {forks.map((f, i) => (
        <div
          key={i}
          onClick={() => setActiveFork(f.forkId)}
          className="cursor-pointer border border-slate-700 p-2 hover:border-emerald-500"
        >
          <div className="text-xs text-emerald-300">
            {f.forkId}
          </div>

          <div className="text-xs text-slate-400">
            divergence: {f.divergenceScore.toFixed(3)}
          </div>
        </div>
      ))}
    </div>
  )
}