"use client"

import type { UnifiedOrganismState } from '@/engines/runtime/AXPTUnifiedOrganismFieldEngine'

type Props = {
  organism: UnifiedOrganismState | null
}

export default function OrganismLivePanel({ organism }: Props) {
  if (!organism) return null

  const thought = deriveThought(organism)
  const reasoning = deriveReasoning(organism)

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-black/60 p-4">

      {/* HEADER */}
      <div className="flex justify-between">
        <h3 className="text-sm text-emerald-300 uppercase">
          Organism Cognition Stream
        </h3>

        <span className="text-xs text-slate-400">
          {organism.phase}
        </span>
      </div>

      {/* THOUGHT */}
      <div className="mt-3 text-sm text-slate-200">
        {thought}
      </div>

      {/* REASONING */}
      <div className="mt-2 text-xs text-slate-400">
        {reasoning.join(' · ')}
      </div>

      {/* METRICS */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-300">
        <div>drift: {organism.drift.toFixed(2)}</div>
        <div>intensity: {organism.intensity.toFixed(2)}</div>
        <div>mutations: {organism.mutations}</div>
      </div>

    </div>
  )
}

/**
 * 🧠 derived cognition (UI layer only)
 */
function deriveThought(o: UnifiedOrganismState): string {
  if (o.drift > 0.7) return 'System instability rising'
  if (o.intensity > 0.7) return 'High systemic activity detected'
  if (o.stability > 0.8) return 'System coherence stable'
  return 'System in adaptive equilibrium'
}

function deriveReasoning(o: UnifiedOrganismState): string[] {
  const r: string[] = []

  if (o.intensity > 0.6) r.push('execution load rising')
  if (o.mutations > 0) r.push('memory mutation activity present')
  if (o.phase === 'INHALE') r.push('ingesting state')
  if (o.phase === 'EXHALE') r.push('stabilizing output')

  return r.length ? r : ['baseline equilibrium']
}