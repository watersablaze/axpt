"use client"

type OperatorDecision = "APPROVE" | "DELAY" | "OVERRIDE"

type CouncilResult = {
  finalDecision: OperatorDecision | "NO_DECISION"
  confidence: number
  breakdown: Record<OperatorDecision, number>
}

export default function DecisionResolution({
  council,
}: {
  council?: CouncilResult
}) {
  if (!council) return null

  const { finalDecision, confidence, breakdown } = council

  const color =
    finalDecision === "APPROVE"
      ? "text-emerald-400"
      : finalDecision === "DELAY"
      ? "text-yellow-400"
      : finalDecision === "OVERRIDE"
      ? "text-red-400"
      : "text-neutral-400"

  return (
    <div className="border border-neutral-800 rounded p-3 space-y-2">
      <div className="text-xs text-neutral-500">
        COUNCIL RESOLUTION
      </div>

      <div className={`text-sm font-semibold ${color}`}>
        {finalDecision}
      </div>

      <div className="text-xs text-neutral-400">
        Confidence: {(confidence * 100).toFixed(0)}%
      </div>

      <div className="text-xs text-neutral-500">
        Approve: {breakdown.APPROVE.toFixed(1)} |{" "}
        Delay: {breakdown.DELAY.toFixed(1)} |{" "}
        Override: {breakdown.OVERRIDE.toFixed(1)}
      </div>
    </div>
  )
}