"use client"

import { useAwareness } from "@/lib/realtime/AwarenessProvider"

type Props = {
  variant?: "default" | "strip"
}

export default function GlobalAwarenessPanel({
  variant = "default",
}: Props) {
  const { global, isStale, mode } = useAwareness()
  const data = global

  const severityColor =
    data.severity > 0.7
      ? "text-red-400"
      : data.severity > 0.4
      ? "text-yellow-400"
      : "text-emerald-400"

  const escalationColor =
    data.escalation.level === "CRITICAL"
      ? "text-red-400"
      : data.escalation.level === "DEGRADED"
      ? "text-yellow-400"
      : "text-emerald-400"

  if (variant === "strip") {
    return (
      <div className="rounded-xl border border-neutral-800 bg-black/40 px-4 py-3 mb-3 shadow-[0_0_12px_rgba(0,255,200,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4 min-w-0">
            <span className="uppercase tracking-wide text-neutral-500">
              Global Awareness
            </span>

            <span className={escalationColor}>
              {data.escalation.level}
            </span>

            <span className={severityColor}>
              Severity {(data.severity * 100).toFixed(0)}%
            </span>

            <span className="text-neutral-400">
              Meta: {data.meta.metaState}
            </span>

            <span className="text-neutral-500">
              Avg:{" "}
              {data.meta.avgConfidence != null
                ? `${(data.meta.avgConfidence * 100).toFixed(0)}%`
                : "—"}
            </span>

            <span className="text-neutral-500">
              {mode}
              {isStale ? " • stale" : ""}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {data.degraded && (
              <span className="text-yellow-300">
                degraded payload
              </span>
            )}

            {data.requiresHumanAttention && (
              <span className="text-red-400">
                HUMAN REQUIRED
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-neutral-800 rounded-lg p-5 space-y-4 bg-black/40">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm uppercase text-neutral-500">
          Global Awareness
        </h2>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="text-neutral-400">
            Meta: {data.meta.metaState}
          </span>

          <span className="text-neutral-500">
            Avg:{" "}
            {data.meta.avgConfidence != null
              ? `${(data.meta.avgConfidence * 100).toFixed(0)}%`
              : "—"}
          </span>

          {data.requiresHumanAttention && (
            <span className="text-red-400">
              HUMAN REQUIRED
            </span>
          )}
        </div>
      </div>

      {data.degraded && (
        <div className="rounded border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-300">
          <div className="font-medium uppercase tracking-wide">
            Degraded Payload
          </div>
          <div className="mt-1 text-yellow-200/90">
            {data.issues[0] ?? "Awareness payload is incomplete."}
          </div>
        </div>
      )}

      <div className="text-xs">
        Escalation:{" "}
        <span className={escalationColor}>
          {data.escalation.level}
        </span>
      </div>

      <div className={`text-lg font-semibold ${severityColor}`}>
        Severity {(data.severity * 100).toFixed(0)}%
      </div>

      <div className="text-xs text-neutral-400">
        Mode: {data.dominantMode}
      </div>

      <div className="text-[10px] text-neutral-500">
        Transport: {mode}
        {isStale ? " • STALE" : ""}
      </div>

      <div className="space-y-2">
        {data.topAlerts.length === 0 && (
          <div className="text-xs text-neutral-500">
            No active alerts.
          </div>
        )}

        {data.topAlerts.map((a, i) => (
          <div
            key={i}
            className={`text-xs px-3 py-2 border rounded ${
              a.level === "CRITICAL"
                ? "border-red-500 text-red-400"
                : a.level === "WARNING"
                ? "border-yellow-500 text-yellow-400"
                : "border-blue-500 text-blue-400"
            }`}
          >
            {a.message}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs text-neutral-400">
        <div>Disputes: {data.metrics.disputeCount}</div>
        <div>Low Confidence: {data.metrics.lowConfidence}</div>
        <div>Signals: {data.metrics.totalAlerts}</div>
      </div>
    </div>
  )
}