"use client"

import { useEffect, useState } from "react"

type CaseItem = {
  caseId: string
  expected: number
  actual: number
  status: string
  anomalies: string[]
  actions: string[]
}

export default function ReconciliationPage() {
  const [data, setData] = useState<CaseItem[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    const res = await fetch("/api/admin/reconciliation")
    const json = await res.json()
    setData(json)
  }

  const triggerAction = async (caseId: string, action: string) => {
    setLoading(true)

    await fetch("/api/admin/actions", {
      method: "POST",
      body: JSON.stringify({ caseId, action }),
      headers: { "Content-Type": "application/json" },
    })

    await load()
    setLoading(false)
  }

  const undoLastAction = async (caseId: string) => {
    setLoading(true)

    await fetch("/api/admin/actions/undo", {
      method: "POST",
      body: JSON.stringify({ caseId }),
      headers: { "Content-Type": "application/json" },
    })

    await load()
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Case Reconciliation Engine
      </h1>

      {data.map((c) => (
        <div key={c.caseId} className="border border-neutral-800 p-4 rounded">

          <div className="font-semibold mb-2">
            Case: {c.caseId}
          </div>

          <div className="text-sm">Expected: {c.expected} USDT</div>
          <div className="text-sm">Actual: {c.actual} USDT</div>

          <div className="mt-2">
            Status:
            <span className="ml-2 font-semibold">
              {c.status}
            </span>
          </div>

          {/* ⚠️ Anomalies */}
          {c.anomalies?.length > 0 && (
            <div className="mt-3 text-red-400 text-sm">
              ⚠ {c.anomalies.join(", ")}
            </div>
          )}

          {/* 🧠 Suggested Actions */}
          {c.actions?.length > 0 && (
            <div className="mt-3 text-sm">
              <div className="font-semibold">Suggested Actions:</div>
              <ul className="list-disc ml-5 mt-1">
                {c.actions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          {/* ⚙️ EXECUTION BUTTONS */}
          <div className="mt-4 flex gap-2 flex-wrap">

            <button
              onClick={() => triggerAction(c.caseId, "LOCK_ESCROW")}
              className="px-3 py-1 bg-green-600 rounded"
              disabled={loading}
            >
              Lock
            </button>

            <button
              onClick={() => triggerAction(c.caseId, "RELEASE_ESCROW")}
              className="px-3 py-1 bg-blue-600 rounded"
              disabled={loading}
            >
              Release
            </button>

            <button
              onClick={() => triggerAction(c.caseId, "FLAG_REVIEW")}
              className="px-3 py-1 bg-red-600 rounded"
              disabled={loading}
            >
              Flag
            </button>

            <button
              onClick={() => undoLastAction(c.caseId)}
              className="px-3 py-1 bg-yellow-600 rounded"
              disabled={loading}
            >
              Undo Last Action
            </button>

          </div>

        </div>
      ))}
    </div>
  )
}