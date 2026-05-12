"use client"

import { useEffect, useState } from "react"
import { executionIntentQueue } from "@/engines/execution/queue/AXPTExecutionIntentQueue"

export default function ExecutionFlowPanel() {
  const [queue, setQueue] = useState<any[]>([])

  useEffect(() => {
    const i = setInterval(() => {
      setQueue((executionIntentQueue as any).queue ?? [])
    }, 300)

    return () => clearInterval(i)
  }, [])

  return (
    <div className="p-4 border border-blue-500/20 rounded-xl bg-black/60">
      <div className="text-xs text-slate-400">EXECUTION QUEUE</div>

      <div className="mt-2 space-y-1 text-xs">
        {queue.slice(-10).map((q, i) => (
          <div key={i}>
            {q.status} → {q.assetCode} ({q.amountBaseUnits?.toString?.()})
          </div>
        ))}
      </div>
    </div>
  )
}