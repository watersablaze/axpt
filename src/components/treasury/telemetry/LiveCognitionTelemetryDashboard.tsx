"use client"

import { useEffect, useState } from "react"
import {
  organismSnapshotStore,
  unifiedOrganismFieldEngine,
} from "@/engines/runtime/clientSingletons"
import { executionIntentQueue } from "@/engines/execution/queue/AXPTExecutionIntentQueue"

export default function LiveCognitiveTelemetryDashboard() {
  const [organism, setOrganism] = useState<any>(null)
  const [queue, setQueue] = useState<any[]>([])
  const [feedback, setFeedback] = useState<any>(null)
  const [chain, setChain] = useState<any[]>([])

  /**
   * 🫀 LIVE SYSTEM SUBSCRIPTION
   */
  useEffect(() => {
    const interval = setInterval(async () => {

      // 1. ORGANISM STATE
      const state = unifiedOrganismFieldEngine.getState()
      setOrganism(state)

      // 2. EXECUTION QUEUE SNAPSHOT
      setQueue((executionIntentQueue as any).queue ?? [])

      // 3. CLIENT-SIDE FEEDBACK INTERPRETATION
      setFeedback({
        delta: {
          pressureIndex: state.decisionPressure,
          driftSignal: state.drift,
          liquidityBias: state.liquidity - 0.5,
        },
      })

      setChain(
        organismSnapshotStore
          .getAll()
          .slice(-20)
          .reverse()
          .map((snapshot) => ({
            type: snapshot.source ?? "CLIENT_CLOCK",
            blockNumber: snapshot.tickIndex,
          }))
      )

    }, 250)

    return () => clearInterval(interval)
  }, [])

  if (!organism) return null

  return (
    <div className="w-full grid gap-6 text-white">

      {/* ──────────────────────────────
          🧠 HEADER
      ────────────────────────────── */}
      <div className="border border-neutral-800 rounded-xl p-4 bg-black/60">
        <div className="text-sm uppercase tracking-widest text-emerald-300">
          AXPT Cognitive Telemetry Core
        </div>

        <div className="text-xs text-slate-400 mt-1">
          Real-time organism → execution → chain → cognition loop
        </div>
      </div>

      {/* ──────────────────────────────
          🫀 ORGANISM STATE
      ────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">

        <div className="p-4 rounded-xl border border-emerald-500/20 bg-black/60">
          <div className="text-xs text-slate-400">Organism Drift</div>
          <div className="text-2xl text-emerald-300">
            {organism.drift.toFixed(3)}
          </div>

          <div className="text-xs mt-2 text-slate-400">
            Stability: {organism.stability.toFixed(2)}
          </div>

          <div className="text-xs text-slate-400">
            Liquidity: {organism.liquidity.toFixed(2)}
          </div>
        </div>

        {/* ──────────────────────────────
            ⚙️ EXECUTION QUEUE
        ────────────────────────────── */}
        <div className="p-4 rounded-xl border border-blue-500/20 bg-black/60">
          <div className="text-xs text-slate-400">
            Execution Queue Depth
          </div>

          <div className="text-2xl text-blue-300">
            {queue.length}
          </div>

          <div className="text-xs mt-2 text-slate-400">
            Pending: {queue.filter(q => q.status === "PENDING").length}
          </div>

          <div className="text-xs text-slate-400">
            Approved: {queue.filter(q => q.status === "APPROVED").length}
          </div>
        </div>

      </div>

      {/* ──────────────────────────────
          🔗 CHAIN ACTIVITY
      ────────────────────────────── */}
      <div className="p-4 rounded-xl border border-purple-500/20 bg-black/60">
        <div className="text-xs text-slate-400">
          Chain Activity (Last 20 Events)
        </div>

        <div className="mt-2 space-y-1 text-xs">
          {chain.map((e, i) => (
            <div key={i} className="text-slate-300">
              • {e.type ?? "EVENT"} — block {e.blockNumber ?? "?"}
            </div>
          ))}
        </div>
      </div>

      {/* ──────────────────────────────
          🧠 COGNITIVE FEEDBACK
      ────────────────────────────── */}
      <div className="p-4 rounded-xl border border-amber-500/20 bg-black/60">
        <div className="text-xs text-slate-400">
          Cognitive Feedback Loop
        </div>

        {feedback && (
          <div className="mt-2 text-xs space-y-1">
            <div>Pressure Index: {feedback.delta.pressureIndex.toFixed(3)}</div>
            <div>Drift Signal: {feedback.delta.driftSignal.toFixed(3)}</div>
            <div>Liquidity Bias: {feedback.delta.liquidityBias.toFixed(3)}</div>
          </div>
        )}
      </div>

    </div>
  )
}
