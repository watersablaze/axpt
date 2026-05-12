'use client'

import { useState, useEffect } from 'react'
import { organismSnapshotStore } from '@/engines/runtime/clientSingletons'

export default function RealityTimelineLayer() {
  const [snapshots, setSnapshots] = useState<any[]>([])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setSnapshots(organismSnapshotStore.getAll())
    }, 500)

    return () => clearInterval(id)
  }, [])

  const current = snapshots[index]

  return (
    <div className="rounded-xl border border-slate-800 bg-black/60 p-4">

      <h2 className="text-slate-300 text-sm uppercase">
        Temporal Reality
      </h2>

      <input
        type="range"
        min={0}
        max={snapshots.length - 1 || 0}
        value={index}
        onChange={(e) => setIndex(Number(e.target.value))}
        className="w-full mt-3"
      />

      {current && (
        <div className="mt-4 text-xs text-slate-400 space-y-1">
          <div>drift: {current.state.drift}</div>
          <div>stability: {current.state.stability}</div>
          <div>risk: {current.state.riskLevel}</div>
        </div>
      )}

    </div>
  )
}
