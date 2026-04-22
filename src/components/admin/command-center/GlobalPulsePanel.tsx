"use client"

import { useAwareness } from "@/lib/realtime/AwarenessProvider"

export default function GlobalPulsePanel() {
  const { command, isLoading, mode } = useAwareness()

  if (isLoading && command.events.length === 0) {
    return (
      <div className="border border-neutral-800 rounded-lg p-4 text-sm text-neutral-500">
        Loading system intelligence...
      </div>
    )
  }

  const intelligence = command.intelligence
  const bottlenecks = command.bottlenecks

  const toneColor =
    intelligence.systemState === "CRITICAL"
      ? "text-red-400"
      : intelligence.systemState.includes("BLOCKED")
      ? "text-yellow-400"
      : "text-emerald-400"

  return (
    <div className="border border-neutral-800 rounded-lg p-5 space-y-5 bg-black/40">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">System Intelligence</h2>
        <span className="text-xs text-neutral-500">{mode} awareness</span>
      </div>

      <div className={`text-sm font-medium ${toneColor}`}>
        ⚠ {intelligence.systemState.replaceAll("_", " ")}
      </div>

      <div className="grid grid-cols-4 gap-4 text-sm">
        <Metric label="Active" value={command.activeCases} />
        <Metric label="Pending Gates" value={command.pendingGates} />
        <Metric label="Escrows Locked" value={command.lockedEscrows} />
        <Metric label="Alerts" value={command.alerts} />
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs text-neutral-400">
        <div>Instability: {intelligence.instabilityScore}</div>
        <div>Throughput Pressure: {intelligence.throughputPressure}</div>
      </div>

      <div className="text-xs text-neutral-400 space-y-1">
        <div>Signatures: {bottlenecks.waitingSignature}</div>
        <div>Artifacts: {bottlenecks.waitingArtifact}</div>
        <div>Escrow Ready: {bottlenecks.escrowPending}</div>
      </div>

      {command.nextActions.length > 0 && (
        <div className="text-sm space-y-1">
          <div className="text-xs text-neutral-500">Next Action</div>
          <div className="text-emerald-400 font-medium">
            {command.nextActions[0].message}
          </div>
        </div>
      )}

      {command.events.length > 0 && (
        <div className="text-xs text-neutral-500">
          Latest: {command.events[0].type}
        </div>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-neutral-500 text-xs">{label}</span>
      <span className="text-lg font-semibold mt-1">{value}</span>
    </div>
  )
}
