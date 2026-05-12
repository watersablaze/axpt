'use client'

import { useEffect, useState } from 'react'
import { organismSnapshotStore } from '@/engines/runtime/clientSingletons'

type Snapshot = {
  timestamp?: number
  tickIndex?: number
  source?: string
  state?: any
  tickId?: string
}

export default function TemporalDebugPanel() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [index, setIndex] = useState<number>(0)

  useEffect(() => {
    const id = setInterval(() => {
      setSnapshots(organismSnapshotStore.getAll())
    }, 500)

    return () => clearInterval(id)
  }, [])

  const current = snapshots[index]

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-emerald-300">
          Temporal Organism Debug Layer
        </h1>
        <p className="text-xs text-slate-400">
          Replay system state across time slices
        </p>
      </div>

      {/* TIME SCRUBBER */}
      <div className="space-y-2">
        <input
          type="range"
          min={0}
          max={snapshots.length - 1 || 0}
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          className="w-full"
        />

        <div className="text-xs text-slate-400">
          Snapshot: {index} / {snapshots.length}
        </div>
      </div>

      {/* CORE VISUALIZATION */}
      {current && (
        <div className="rounded-xl border border-emerald-500/20 bg-black/60 p-4">

          <div className="flex justify-between">
            <div className="text-sm text-emerald-300">
              Organism State @ {current.timestamp ?? current.tickIndex ?? "client"}
            </div>

            <div className="text-xs text-slate-400">
              phase: {current.state?.phase ?? "STATIC"}
            </div>
          </div>

          {/* DRIFT */}
          <Metric label="Drift" value={current.state?.drift ?? 0} />

          {/* INTENSITY */}
          <Metric label="Intensity" value={current.state?.intensity ?? 0} />

          {/* STABILITY */}
          <Metric label="Stability" value={current.state?.stability ?? 0} />

          {/* LIQUIDITY */}
          <Metric label="Liquidity" value={current.state?.liquidity ?? 0} />

          {/* RISK */}
          <div className="mt-4 text-xs text-slate-300">
            Risk: {current.state?.riskLevel ?? "LOW"}
          </div>

        </div>
      )}
    </div>
  )
}

function Metric({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="mt-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="h-2 bg-slate-800 rounded">
        <div
          className="h-full bg-emerald-400"
          style={{ width: `${(value ?? 0) * 100}%` }}
        />
      </div>
    </div>
  )
}
