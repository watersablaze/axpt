"use client"

import { useUnifiedOrganism } from "@/ui/hooks/useUnifiedOrganism"

export default function UnifiedPulsePanel() {
  const pulse = useUnifiedOrganism()

  if (!pulse) return null

  const drift = pulse.drift
  const intensity = pulse.intensity
  const health = pulse.stability

  return (
    <section className="rounded-2xl border border-emerald-500/20 bg-black/60 p-5 text-slate-100">

      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm uppercase tracking-widest text-emerald-300">
            AXPT Organism Pulse
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            System cognition derived from unified organism state
          </p>
        </div>

        <div className="text-xs text-slate-400">
          {pulse.phase}
        </div>
      </div>

      {/* COGNITION */}
      <div className="mt-4 text-xs text-slate-400 space-y-1">
        <div>• drift pressure: {drift.toFixed(2)}</div>
        <div>• mutation load: {pulse.mutations}</div>
        <div>• decision pressure: {pulse.decisionPressure.toFixed(2)}</div>
      </div>

      {/* METRICS */}
      <div className="mt-5 grid grid-cols-3 gap-3 text-xs">

        <Metric label="Drift" value={drift} color="red" />
        <Metric label="Intensity" value={intensity} color="amber" />
        <Metric label="Health" value={health} color="emerald" />

      </div>

      {/* FLOW */}
      <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-slate-300">

        <div>Liquidity: {pulse.liquidity.toFixed(2)}</div>
        <div>Risk: {pulse.riskLevel}</div>
        <div>Mutations: {pulse.mutations}</div>
        <div>Decision Pressure: {pulse.decisionPressure.toFixed(2)}</div>

      </div>

      {/* FOOTER */}
      <div className="mt-5 border-t border-slate-800 pt-3 text-xs text-slate-500">
        System in unified deterministic state
      </div>

    </section>
  )
}

function Metric({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: "red" | "amber" | "emerald"
}) {
  const bar =
    color === "red"
      ? "bg-red-400"
      : color === "amber"
      ? "bg-amber-300"
      : "bg-emerald-400"

  return (
    <div>
      <div className="text-slate-400">{label}</div>
      <div className="mt-2 h-2 rounded bg-slate-800">
        <div
          className={`h-full rounded ${bar}`}
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  )
}