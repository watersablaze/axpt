'use client'

import { useState } from 'react'
import { useForkSystem } from './useForkSystem'

export default function ForkLauncherPanel() {
  const { createFork } = useForkSystem()

  const [forkId, setForkId] = useState('')
  const [drift, setDrift] = useState(0)
  const [intensity, setIntensity] = useState(0)

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-black/60 p-4 space-y-4">

      <h2 className="text-emerald-300 text-sm uppercase">
        Create Deterministic Fork
      </h2>

      <input
        className="w-full bg-black border border-slate-700 p-2 text-sm"
        placeholder="Fork ID"
        value={forkId}
        onChange={(e) => setForkId(e.target.value)}
      />

      <div>
        <label className="text-xs text-slate-400">Drift</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={drift}
          onChange={(e) => setDrift(Number(e.target.value))}
        />
      </div>

      <div>
        <label className="text-xs text-slate-400">Intensity</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value))}
        />
      </div>

      <button
        className="w-full bg-emerald-600 py-2 text-sm"
        onClick={() =>
          createFork({
            forkId,
            baseSnapshotId: 'latest',
            overrides: { drift, intensity },
          })
        }
      >
        Spawn Fork
      </button>
    </div>
  )
}