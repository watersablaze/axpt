"use client"

import type { Operator, OperatorDecision } from "@/core/types/operator"

function getStateColor(decision?: OperatorDecision) {
  if (decision === "APPROVE") return "border-emerald-500 bg-emerald-500/10"
  if (decision === "DELAY") return "border-yellow-500 bg-yellow-500/10"
  if (decision === "OVERRIDE") return "border-red-500 bg-red-500/10"
  return "border-neutral-700 bg-neutral-900/40"
}

function getDecisionLabel(decision?: OperatorDecision) {
  if (decision === "APPROVE") return "ADVANCING"
  if (decision === "DELAY") return "HOLDING"
  if (decision === "OVERRIDE") return "BLOCKING"
  return "IDLE"
}

function getPermissions(archetype: string) {
  switch (archetype) {
    case "EXECUTOR":
      return { APPROVE: true, DELAY: true, OVERRIDE: false }
    case "ANALYST":
      return { APPROVE: false, DELAY: true, OVERRIDE: false }
    case "GUARDIAN":
      return { APPROVE: false, DELAY: true, OVERRIDE: true }
    default:
      return { APPROVE: false, DELAY: false, OVERRIDE: false }
  }
}

export default function OperatorPanel({
  operators,
  caseId,
}: {
  operators: Operator[]
  caseId: string
}) {

  async function vote(operatorId: string, decision: OperatorDecision) {
    await fetch(`/api/axpt/cases/${caseId}/decide`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ operatorId, decision }),
    })
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-neutral-500 uppercase tracking-wider">
        Council State
      </div>

      <div className="grid grid-cols-3 gap-3">
        {operators.map((op) => {
          const perms = getPermissions(op.archetype)

          return (
            <div
              key={op.operatorId}
              className={`rounded-lg p-3 border transition ${getStateColor(op.decision)}`}
            >
              <div className="text-[10px] text-neutral-400 uppercase">
                {op.archetype}
              </div>

              <div className="text-sm font-medium">
                {op.name}
              </div>

              <div className="mt-2 text-xs font-medium">
                {getDecisionLabel(op.decision)}
              </div>

              {/* ACTIONS */}
              <div className="mt-3 flex gap-2 text-xs">

                <button
                  onClick={() => perms.APPROVE && vote(op.operatorId, "APPROVE")}
                  disabled={!perms.APPROVE}
                  className={`px-2 py-1 rounded ${
                    perms.APPROVE
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                  }`}
                >
                  Approve
                </button>

                <button
                  onClick={() => perms.DELAY && vote(op.operatorId, "DELAY")}
                  disabled={!perms.DELAY}
                  className={`px-2 py-1 rounded ${
                    perms.DELAY
                      ? "bg-yellow-600 hover:bg-yellow-500"
                      : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                  }`}
                >
                  Delay
                </button>

                <button
                  onClick={() => perms.OVERRIDE && vote(op.operatorId, "OVERRIDE")}
                  disabled={!perms.OVERRIDE}
                  className={`px-2 py-1 rounded ${
                    perms.OVERRIDE
                      ? "bg-red-600 hover:bg-red-500"
                      : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                  }`}
                >
                  Override
                </button>

              </div>

              {/* SIGNAL BAR */}
              <div className="mt-2 h-1 rounded bg-white/10 overflow-hidden">
                <div
                  className={`h-full ${
                    op.decision === "APPROVE"
                      ? "bg-emerald-500 w-full"
                      : op.decision === "DELAY"
                      ? "bg-yellow-500 w-2/3"
                      : op.decision === "OVERRIDE"
                      ? "bg-red-500 w-full"
                      : "bg-neutral-700 w-1/3"
                  }`}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}