"use client"

import { useUnifiedOrganism } from "@/ui/hooks/useUnifiedOrganism"

export default function OrganismTopologyMap() {
  const organism = useUnifiedOrganism()

  if (!organism) return null

  const r = organism.riskLevel === "CRITICAL" ? 1 : organism.drift
  const t = organism.liquidity
  const g = organism.stability

  return (
    <div className="relative w-full rounded-xl border border-neutral-800 bg-black/60 p-6 overflow-hidden">

      {/* BACKGROUND FIELD */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(16,185,129,${organism.intensity}), transparent 70%)`,
          filter: `blur(${organism.drift * 20}px)`,
        }}
      />

      {/* TOPOLOGY GRID */}
      <div className="relative grid grid-cols-3 gap-6 text-xs text-white">

        <Node label="RISK" value={r} color="red" pulse={organism.drift} />
        <Node label="TREASURY" value={t} color="emerald" pulse={organism.intensity} />
        <Node label="GOVERNANCE" value={g} color="blue" pulse={organism.stability} />

      </div>
    </div>
  )
}

function Node({
  label,
  value,
  color,
  pulse,
}: {
  label: string
  value: number
  color: "red" | "emerald" | "blue"
  pulse: number
}) {
  const glow =
    color === "red"
      ? "239,68,68"
      : color === "blue"
      ? "59,130,246"
      : "16,185,129"

  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        transform: `scale(${1 + value * 0.1})`,
        filter: `drop-shadow(0 0 ${10 + pulse * 20}px rgba(${glow},0.5))`,
        transition: "all 150ms ease-out",
      }}
    >
      <div className="text-[10px] uppercase opacity-70">{label}</div>

      <div
        className="mt-2 h-3 w-3 rounded-full"
        style={{ backgroundColor: `rgba(${glow},1)` }}
      />

      <div className="mt-1 text-[10px] opacity-60">
        {value.toFixed(2)}
      </div>
    </div>
  )
}