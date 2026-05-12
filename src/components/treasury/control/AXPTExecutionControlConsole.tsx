"use client"

import { useEffect, useState } from "react"
import { executionIntentQueue } from "@/engines/execution/queue/AXPTExecutionIntentQueue"
import {
  organismClock,
  unifiedOrganismFieldEngine,
  type ClientOrganismSnapshot,
} from "@/engines/runtime/clientSingletons"

type SystemState = {
  paused: boolean
  escrowOnly: boolean
  riskOverride: number
  maxTransfer: number
}

export default function AXPTExecutionControlConsole() {

  const [state, setState] = useState<SystemState>({
    paused: false,
    escrowOnly: false,
    riskOverride: 0.7,
    maxTransfer: 10000,
  })

  const [organism, setOrganism] = useState<ClientOrganismSnapshot | null>(null)
  const [queueSize, setQueueSize] = useState(0)

  /**
   * 🫀 LIVE FEED
   */
  useEffect(() => {
    organismClock.start()

    const unsubscribe = organismClock.subscribe((tick) => {
      setOrganism(tick.state ?? unifiedOrganismFieldEngine.getState())
      setQueueSize((executionIntentQueue as any).queue?.length ?? 0)
    })

    return () => unsubscribe()
  }, [])

  /**
   * ⚡ CIRCUIT CONTROL
   */
  const togglePause = () => {
    setState(s => ({ ...s, paused: !s.paused }))

    if (!state.paused) {
      organismClock.stop()
    } else {
      organismClock.start()
    }
  }

  const toggleEscrowOnly = () => {
    setState(s => ({ ...s, escrowOnly: !s.escrowOnly }))
  }

  const updateRiskOverride = (value: number) => {
    setState(s => ({ ...s, riskOverride: value }))
  }

  return (
    <div className="w-full grid gap-6 text-white">

      {/* ──────────────────────────────
          HEADER
      ────────────────────────────── */}
      <div className="p-4 border border-red-500/20 rounded-xl bg-black/70">
        <div className="text-red-300 text-sm uppercase tracking-widest">
          AXPT Execution Control Console
        </div>

        <div className="text-xs text-slate-400 mt-1">
          Direct system authority layer — production critical
        </div>
      </div>

      {/* ──────────────────────────────
          LIVE SYSTEM SNAPSHOT
      ────────────────────────────── */}
      <div className="grid md:grid-cols-3 gap-4">

        <div className="p-4 rounded-xl border border-emerald-500/20 bg-black/60">
          <div className="text-xs text-slate-400">Organism Risk</div>
          <div className="text-xl text-emerald-300">
            {organism?.riskLevel ?? "—"}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-blue-500/20 bg-black/60">
          <div className="text-xs text-slate-400">Execution Queue</div>
          <div className="text-xl text-blue-300">
            {queueSize}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-purple-500/20 bg-black/60">
          <div className="text-xs text-slate-400">Decision Pressure</div>
          <div className="text-xl text-purple-300">
            {organism?.decisionPressure?.toFixed(3) ?? "—"}
          </div>
        </div>

      </div>

      {/* ──────────────────────────────
          CIRCUIT BREAKERS
      ────────────────────────────── */}
      <div className="p-4 border border-red-500/30 rounded-xl bg-black/60">

        <div className="text-xs text-slate-400 mb-3">
          Circuit Control
        </div>

        <div className="flex gap-3 flex-wrap">

          <button
            onClick={togglePause}
            className={`px-3 py-1 rounded ${
              state.paused ? "bg-red-600" : "bg-emerald-600"
            }`}
          >
            {state.paused ? "RESUME SYSTEM" : "PAUSE SYSTEM"}
          </button>

          <button
            onClick={toggleEscrowOnly}
            className={`px-3 py-1 rounded ${
              state.escrowOnly ? "bg-yellow-600" : "bg-blue-600"
            }`}
          >
            {state.escrowOnly ? "FULL MODE" : "ESCROW ONLY"}
          </button>

        </div>

      </div>

      {/* ──────────────────────────────
          RISK GOVERNOR
      ────────────────────────────── */}
      <div className="p-4 border border-amber-500/20 rounded-xl bg-black/60">

        <div className="text-xs text-slate-400 mb-2">
          Risk Override Threshold: {state.riskOverride.toFixed(2)}
        </div>

        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={state.riskOverride}
          onChange={(e) => updateRiskOverride(parseFloat(e.target.value))}
          className="w-full"
        />

      </div>

    </div>
  )
}
