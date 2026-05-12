"use client"

import { useUnifiedOrganism } from "@/ui/hooks/useUnifiedOrganism"

export default function UnifiedOrganismFieldPanel() {
  const field = useUnifiedOrganism()

  if (!field) return null

  return (
    <section className="rounded-xl border border-neutral-800 bg-black/60 p-4 text-xs text-slate-200">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-emerald-300 uppercase font-semibold">
            Unified Organism Field
          </h2>

          <p className="text-slate-400 mt-1">
            {field.narrative}
          </p>
        </div>

        <div className="text-right text-slate-400">
          drift: {field.drift.toFixed(2)}
        </div>
      </div>

      {/* ORGANS */}
      <div className="mt-4 grid grid-cols-3 gap-3">

        <div className="rounded border border-emerald-500/20 p-3">
          <div className="text-emerald-300 uppercase text-xs">Treasury</div>
          <div className="mt-2 text-white text-sm">
            liquidity {field.liquidity.toFixed(2)}
          </div>
        </div>

        <div className="rounded border border-blue-500/20 p-3">
          <div className="text-blue-300 uppercase text-xs">Governance</div>
          <div className="mt-2 text-white text-sm">
            stability {field.stability.toFixed(2)}
          </div>
        </div>

        <div className="rounded border border-red-500/20 p-3">
          <div className="text-red-300 uppercase text-xs">Risk</div>
          <div className="mt-2 text-white text-sm">
            risk {field.riskLevel}
          </div>
        </div>

      </div>

      {/* COHERENCE */}
      <div className="mt-5">
        <div className="text-xs text-slate-400 mb-1">
          System Coherence
        </div>

        <div className="h-2 bg-slate-800 rounded">
          <div
            className="h-full bg-emerald-400"
            style={{ width: `${field.stability * 100}%` }}
          />
        </div>
      </div>

    </section>
  )
}