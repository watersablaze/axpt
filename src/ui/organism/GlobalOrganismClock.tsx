'use client'

import { useEffect, useState } from 'react'
import { organismClock, organismSnapshotStore } from '@/engines/runtime/clientSingletons'

type Tick = {
  timestamp: number
  drift: number
  intensity: number
  stability: number
  liquidity: number
  phase: string
}

export default function GlobalOrganismClock() {
  const [tick, setTick] = useState<Tick | null>(null)
  const [snapshotCount, setSnapshotCount] = useState(0)

  useEffect(() => {
    const unsubscribe = organismClock.subscribe((t) => {
      setTick(t)

      // snapshot awareness layer
      setSnapshotCount(organismSnapshotStore.getAll().length)
    })

    return () => unsubscribe()
  }, [])

  if (!tick) return null

  const pulse = tick.intensity

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-black/70 p-4 text-xs text-slate-200">

      {/* ──────────────────────────────
          ORGANISM HEART HEADER
      ────────────────────────────── */}
      <div className="flex justify-between items-center">
        <div>
          <div className="text-emerald-300 uppercase font-semibold">
            Organism Clock
          </div>

          <div className="text-slate-400 mt-1">
            Phase: {tick.phase}
          </div>
        </div>

        <div className="text-right text-slate-400">
          Snapshots: {snapshotCount}
        </div>
      </div>

      {/* ──────────────────────────────
          HEARTBEAT VISUAL
      ────────────────────────────── */}
      <div
        className="mt-4 h-3 w-full rounded bg-slate-800 overflow-hidden"
      >
        <div
          className="h-full bg-emerald-400 transition-all duration-150"
          style={{
            width: `${pulse * 100}%`,
            filter: `brightness(${1 + pulse})`,
          }}
        />
      </div>

      {/* ──────────────────────────────
          SYSTEM METRICS
      ────────────────────────────── */}
      <div className="mt-4 grid grid-cols-4 gap-2 text-[10px] text-slate-300">

        <div>
          Drift<br />
          {tick.drift.toFixed(2)}
        </div>

        <div>
          Intensity<br />
          {tick.intensity.toFixed(2)}
        </div>

        <div>
          Stability<br />
          {tick.stability.toFixed(2)}
        </div>

        <div>
          Liquidity<br />
          {tick.liquidity.toFixed(2)}
        </div>

      </div>

    </div>
  )
}
