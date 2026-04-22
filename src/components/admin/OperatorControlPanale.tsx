"use client"

import { useTransition } from "react"

type Operator = {
  operatorId: string
  name: string
}

export default function OperatorControlPanel({
  caseId,
  operators,
}: {
  caseId: string
  operators: Operator[]
}) {
  const [pending, start] = useTransition()

  function decide(
    operatorId: string,
    decision: "APPROVE" | "DELAY" | "OVERRIDE"
  ) {
    start(async () => {
      await fetch("/api/admin/operators/decide", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          caseId,
          operatorId,
          decision,
        }),
      })

      window.location.reload()
    })
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-neutral-500 uppercase">
        Operator Controls
      </div>

      {operators.map((op) => (
        <div
          key={op.operatorId}
          className="flex items-center justify-between border border-neutral-800 rounded-lg p-3"
        >
          <div className="text-sm">{op.name}</div>

          <div className="flex gap-2 text-xs">
            <button
              onClick={() => decide(op.operatorId, "APPROVE")}
              className="px-2 py-1 bg-emerald-600 rounded"
            >
              Approve
            </button>

            <button
              onClick={() => decide(op.operatorId, "DELAY")}
              className="px-2 py-1 bg-yellow-600 rounded"
            >
              Delay
            </button>

            <button
              onClick={() => decide(op.operatorId, "OVERRIDE")}
              className="px-2 py-1 bg-red-600 rounded"
            >
              Override
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}