"use client"

type Operator = {
  operatorId: string
  name: string
  archetype: string
  decision?: "APPROVE" | "DELAY" | "OVERRIDE"
  successRate?: number
}

export default function OperatorIntelligencePanel({
  operators,
}: {
  operators: Operator[]
}) {
  return (
    <div className="space-y-3">
      <div className="text-xs uppercase text-neutral-500">
        Operator Intelligence
      </div>

      {operators.map((op) => {
        const reputation = op.successRate ?? 1

        return (
          <div
            key={op.operatorId}
            className="border border-neutral-800 rounded-lg p-4 space-y-2"
          >
            {/* HEADER */}
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">
                {op.name}
              </div>

              <div className="text-xs text-neutral-400">
                {op.archetype}
              </div>
            </div>

            {/* DECISION */}
            <div className="text-xs">
              Decision:{" "}
              <span className="font-semibold">
                {op.decision ?? "—"}
              </span>
            </div>

            {/* REPUTATION BAR */}
            <div className="space-y-1">
              <div className="text-[10px] text-neutral-500">
                Reputation
              </div>

              <div className="h-1.5 bg-neutral-800 rounded overflow-hidden">
                <div
                  className="bg-emerald-400 h-full"
                  style={{
                    width: `${Math.min(reputation * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* SCORE */}
            <div className="text-[10px] text-neutral-400">
              {(reputation * 100).toFixed(0)}%
            </div>
          </div>
        )
      })}
    </div>
  )
}