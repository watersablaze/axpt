"use client"

import { resolveCouncil, OperatorDecision } from "@/core/automation/council"

type Operator = {
  operatorId: string
  name: string
  archetype: string
  decision?: OperatorDecision
}

export default function CouncilInfluencePanel({
  operators,
}: {
  operators: Operator[]
}) {
  const council = resolveCouncil(operators)

  return (
    <div className="border border-neutral-800 rounded-lg p-4 space-y-4">

      {/* HEADER */}
      <div className="text-sm font-semibold text-neutral-300">
        Council Resolution
      </div>

      {/* FINAL DECISION */}
      <div className="flex justify-between items-center">
        <div className="text-lg font-bold text-cyan-400">
          {council.finalDecision ?? "NO DECISION"}
        </div>

        <div className="text-xs text-neutral-400">
          Confidence: {(council.confidence * 100).toFixed(0)}%
        </div>
      </div>

      {/* BREAKDOWN */}
      <div className="space-y-2 text-xs">
        {Object.entries(council.breakdown).map(([decision, score]) => (
          <div key={decision} className="flex justify-between">
            <span>{decision}</span>
            <span>{score.toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* OPERATORS */}
      <div className="space-y-2">
        {operators.map((op) => (
          <div
            key={op.operatorId}
            className="flex justify-between border border-neutral-800 rounded px-2 py-1 text-xs"
          >
            <div>
              {op.name} <span className="text-neutral-500">({op.archetype})</span>
            </div>

            <div className="text-neutral-300">
              {op.decision ?? "—"}
            </div>
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