"use client"

import { resolveCouncil, OperatorDecision } from "@/core/automation/council"

type Operator = {
  operatorId: string
  name: string
  archetype: string
  decision?: OperatorDecision
  successRate?: number
}

export default function AdaptiveCouncilPanel({
  operators,
}: {
  operators: Operator[]
}) {
  const council = resolveCouncil(operators)

  return (
    <div className="border border-neutral-800 rounded-lg p-4 space-y-4">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="text-sm font-semibold text-neutral-300">
          Adaptive Council
        </div>

        <div className="text-xs text-neutral-400">
          Confidence {(council.confidence * 100).toFixed(0)}%
        </div>
      </div>

      {/* FINAL DECISION */}
      <div className="text-lg font-bold text-cyan-400">
        {council.finalDecision ?? "NO DECISION"}
      </div>

      {/* INFLUENCE MAP */}
<div className="space-y-2">
  {operators.map((op) => {
    const reputation = op.successRate ?? 1

    return (
      <div
        key={op.operatorId}
        className="space-y-1"
      >
        <div className="flex justify-between text-xs">
          <span>
            {op.name} ({op.archetype})
          </span>

          <span>
            {op.decision ?? "—"} | {(reputation * 100).toFixed(0)}%
          </span>
        </div>

        <div className="h-2 bg-neutral-900 rounded">
          <div
            className="h-2 bg-cyan-500 rounded"
            style={{
              width: `${Math.min(reputation * 100, 100)}%`,
            }}
          />
        </div>
      </div>
    )
  })}
</div>

      {/* BREAKDOWN */}
      <div className="text-xs text-neutral-400 space-y-1">
        {Object.entries(council.breakdown).map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <span>{k}</span>
            <span>{v.toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* REASON */}
      <div className="text-xs text-neutral-500">
        {council.reason}
      </div>

    </div>
  )
}