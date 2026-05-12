"use client"

import { useEffect, useState } from "react"
import { organismClock } from "@/engines/runtime/clientSingletons"
import { executionIntentQueue } from "@/engines/execution/queue/AXPTExecutionIntentQueue"

type QueueState = {
  total: number
  pending: number
  approved: number
  blocked: number
  executed: number
}

export default function ExecutionControlPanel() {
  const [queueState, setQueueState] = useState<QueueState>({
    total: 0,
    pending: 0,
    approved: 0,
    blocked: 0,
    executed: 0,
  })

  /**
   * 🧠 LIVE QUEUE INTROSPECTION (TEMPORARY INTERNAL HOOK)
   * later replaced by deterministic queue snapshot engine
   */
  useEffect(() => {
    const id = setInterval(() => {
      const queue = (executionIntentQueue as any).queue ?? []

      const state: QueueState = {
        total: queue.length,
        pending: queue.filter((q: any) => q.status === "PENDING").length,
        approved: queue.filter((q: any) => q.status === "APPROVED").length,
        blocked: queue.filter((q: any) => q.status === "BLOCKED").length,
        executed: queue.filter((q: any) => q.status === "EXECUTED").length,
      }

      setQueueState(state)
    }, 500)

    return () => clearInterval(id)
  }, [])

  const pauseClock = () => organismClock.stop()
  const startClock = () => organismClock.start()

  const flushQueue = () => {
    // ⚠️ TEMPORARY IMPERATIVE HOOK (WILL MOVE INTO SNAPSHOT STORE LAYER)
    ;(executionIntentQueue as any).queue = []
  }

  return (
    <section className="rounded-xl border border-yellow-500/20 bg-black/60 p-4 text-xs text-slate-200">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-yellow-300 uppercase font-semibold">
            Execution Control Console
          </h2>
          <p className="text-slate-400 mt-1">
            Runtime intervention layer (deterministic gate control)
          </p>
        </div>

        <div className="text-right text-slate-400">
          queue: {queueState.total}
        </div>
      </div>

      {/* QUEUE STATE */}
      <div className="mt-4 grid grid-cols-4 gap-2 text-[11px]">

        <div className="p-2 border border-slate-700 rounded">
          Pending<br />
          <span className="text-white">{queueState.pending}</span>
        </div>

        <div className="p-2 border border-slate-700 rounded">
          Approved<br />
          <span className="text-green-300">{queueState.approved}</span>
        </div>

        <div className="p-2 border border-slate-700 rounded">
          Blocked<br />
          <span className="text-red-300">{queueState.blocked}</span>
        </div>

        <div className="p-2 border border-slate-700 rounded">
          Executed<br />
          <span className="text-blue-300">{queueState.executed}</span>
        </div>

      </div>

      {/* CONTROL ACTIONS */}
      <div className="mt-5 flex flex-wrap gap-2">

        <button
          onClick={startClock}
          className="px-3 py-1 bg-green-600 rounded text-white"
        >
          Resume Clock
        </button>

        <button
          onClick={pauseClock}
          className="px-3 py-1 bg-red-600 rounded text-white"
        >
          Pause Clock
        </button>

        <button
          onClick={flushQueue}
          className="px-3 py-1 bg-yellow-600 rounded text-black"
        >
          Flush Queue
        </button>

      </div>

      {/* SAFETY FOOTER */}
      <div className="mt-4 text-[10px] text-slate-500 border-t border-slate-800 pt-2">
        ⚠ This layer will later be bound to AXPT Governor permissions + Execution Seal rules
      </div>

    </section>
  )
}
