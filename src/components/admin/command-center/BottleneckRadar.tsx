"use client"

import { useCommandCenter } from "@/lib/realtime/CommandCenterProvider"

export default function BottleneckRadar() {

  const { bottlenecks } = useCommandCenter()

  return (

    <div className="border border-neutral-800 rounded-lg p-4">

      <h2 className="text-sm font-semibold mb-3">
        Bottleneck Radar
      </h2>

      <div className="space-y-2 text-sm">

        <Row label="Waiting on Signature" value={bottlenecks.waitingSignature} color="text-yellow-400" />
        <Row label="Waiting on Artifact" value={bottlenecks.waitingArtifact} color="text-blue-400" />
        <Row label="Escrow Pending" value={bottlenecks.escrowPending} color="text-red-400" />

      </div>

    </div>
  )
}

function Row({ label, value, color }: any) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className={color}>{value}</span>
    </div>
  )
}