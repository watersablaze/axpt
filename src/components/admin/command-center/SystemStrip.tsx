"use client"

import { useCommandCenter } from "@/lib/realtime/CommandCenterProvider"

export default function SystemStrip() {

  const {
    activeCases,
    pendingGates,
    lockedEscrows,
    alerts
  } = useCommandCenter()

  return (

    <div className="border border-neutral-800 rounded-lg p-4 flex justify-between text-sm">

      <Metric label="Active Cases" value={activeCases} />
      <Metric label="Pending Gates" value={pendingGates} />
      <Metric label="Locked Escrows" value={lockedEscrows} />
      <Metric label="Alerts" value={alerts} />

    </div>

  )
}

function Metric({ label, value }: { label: string, value: number }) {

  return (

    <div className="flex flex-col">

      <span className="text-neutral-500 text-xs">
        {label}
      </span>

      <span className="text-lg font-semibold mt-1">
        {value}
      </span>

    </div>

  )
}