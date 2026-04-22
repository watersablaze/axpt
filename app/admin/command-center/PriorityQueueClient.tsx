"use client"

import { useState } from "react"

type QueueItem = {
  id: string
  caseId: string
  type: string
  priorityScore: number
  escalated?: boolean
  actions?: string[]
}

export default function PriorityQueueClient({
  initialData,
}: {
  initialData: QueueItem[]
}) {
  console.log("CLIENT INITIAL DATA:", initialData)

  const [items, setItems] = useState(initialData)
  const [loading, setLoading] = useState<string | null>(null)

  async function claim(caseId: string) {
    setLoading(caseId)

    const res = await fetch("/api/admin/queue/lock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        caseId,
        operatorId: "dev-operator",
      }),
    })

    const data = await res.json()
    setLoading(null)

    if (!data.ok) {
      alert(`Locked by ${data.lockedBy}`)
      return
    }

    alert("Lock acquired")
  }

  async function execute(caseId: string, action: string) {
    setLoading(caseId)

    const res = await fetch("/api/admin/actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        caseId,
        action,
        operatorId: "dev-operator",
      }),
    })

    const data = await res.json()
    setLoading(null)

    if (!res.ok) {
      alert(data.error || "Action failed")
      return
    }

    alert(`${action} executed`)

    setItems((prev) => prev.filter((i) => i.caseId !== caseId))
  }

  async function enableAutomation(caseId: string) {
    await fetch("/api/admin/cases/toggle-automation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        caseId,
        enabled: true,
      }),
    })

    alert("Automation enabled")
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Priority Queue</h2>

      {items.length === 0 && (
        <div className="text-sm text-neutral-500">
          No active actions
        </div>
      )}

      {items.map((item) => (
        <div
          key={item.id}
          className="border border-neutral-800 p-4 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">
                Case {item.caseId}
              </div>

              <div className="text-sm text-neutral-400">
                {item.type}
              </div>

              <div className="text-xs text-neutral-500 mt-1">
                Score: {item.priorityScore.toFixed(2)}
              </div>

              {item.escalated && (
                <div className="text-xs text-red-400 mt-1">
                  🔥 Escalated
                </div>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">

              {/* CLAIM */}
              <button
                disabled={loading === item.caseId}
                className="rounded bg-emerald-600 px-3 py-1 text-sm disabled:opacity-50"
                onClick={() => claim(item.caseId)}
              >
                {loading === item.caseId ? "..." : "Claim"}
              </button>

              {/* ACTION BUTTONS */}
              {item.actions?.map((action) => (
                <button
                  key={action}
                  className="rounded bg-blue-600 px-3 py-1 text-sm"
                  onClick={() => execute(item.caseId, action)}
                >
                  {action}
                </button>
              ))}

              {/* AUTOMATION TOGGLE */}
              <button
                className="text-xs border px-2 py-1 rounded"
                onClick={() => enableAutomation(item.caseId)}
              >
                Enable Auto
              </button>

            </div>
          </div>
        </div>
      ))}
    </div>
  )
}