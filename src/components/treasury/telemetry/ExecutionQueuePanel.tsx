"use client"

import { useEffect, useState } from "react"
import { executionIntentQueue } from "@/engines/execution/queue/AXPTExecutionIntentQueue"

export default function ExecutionQueuePanel() {
  const [queue, setQueue] = useState<any[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      setQueue((executionIntentQueue as any).queue ?? [])
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="border border-blue-500/30 p-4 rounded h-full">
      <h2 className="text-blue-300 font-semibold">
        Execution Queue
      </h2>

      <div className="mt-2 space-y-2 text-xs">

        {queue.map((q) => (
          <div key={q.id} className="border border-neutral-700 p-2 rounded">

            <div>Mode: {q.suggestedMode}</div>
            <div>Status: {q.status}</div>
            <div>Amount: {q.amountBaseUnits?.toString()}</div>

          </div>
        ))}

      </div>
    </div>
  )
}