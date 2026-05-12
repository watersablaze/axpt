'use client'

import type { UnifiedOrganismState } from '@/engines/runtime/AXPTUnifiedOrganismFieldEngine'

type FlowNode = {
  id: string
  label: string
  intensity: number
  drift: number
  activity: number
}

type FlowEdge = {
  from: string
  to: string
  weight: number
  turbulence: number
}

type CausalFlowLayerProps = {
  organism: UnifiedOrganismState | null
}

export default function CausalFlowLayer({ organism }: CausalFlowLayerProps) {
  if (!organism) return null

  /**
   * 🧠 NORMALIZED SIGNALS
   */
  const drift = clamp(organism.drift)
  const intensity = clamp(organism.intensity)
  const decisionPressure = clamp(organism.decisionPressure)
  const phase = organism.phase

  /**
   * 🧬 ORGAN SYSTEM MAP (CAUSAL GRAPH)
   */
  const nodes: FlowNode[] = [
    {
      id: 'risk',
      label: 'RISK',
      intensity: decisionPressure,
      drift,
      activity: decisionPressure * (1 + drift),
    },
    {
      id: 'governance',
      label: 'GOVERNANCE',
      intensity: intensity * 0.9,
      drift,
      activity: decisionPressure * 0.8 + drift,
    },
    {
      id: 'twin',
      label: 'TWIN',
      intensity: intensity * 0.7,
      drift,
      activity: decisionPressure * 0.6 + drift,
    },
    {
      id: 'treasury',
      label: 'TREASURY',
      intensity: intensity * 1.1,
      drift,
      activity: decisionPressure,
    },
  ]

  /**
   * 🔗 CAUSAL EDGES (FLOW OF DECISION PRESSURE)
   */
  const edges: FlowEdge[] = [
    { from: 'risk', to: 'governance', weight: 0.9, turbulence: decisionPressure },
    { from: 'twin', to: 'governance', weight: 0.7, turbulence: drift },
    { from: 'governance', to: 'treasury', weight: 1.0, turbulence: decisionPressure },
    { from: 'risk', to: 'treasury', weight: 0.4, turbulence: decisionPressure },
  ]

  return (
    <div className="relative w-full rounded-xl border border-emerald-500/10 bg-black/60 p-6 overflow-hidden">

      {/* HEADER */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-widest text-emerald-300">
          Causal Flow Layer
        </h3>

        <span className="text-xs text-slate-400">
          phase: {phase}
        </span>
      </div>

      {/* FIELD */}
      <div className="relative h-[240px] w-full">

        {/* BACKGROUND GRID (SYSTEM SPACE) */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #10b981 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* EDGES (CAUSAL FLOW LINES) */}
        <svg className="absolute inset-0 w-full h-full">
          {edges.map((edge, i) => (
            <line
              key={i}
              x1={position(edge.from).x}
              y1={position(edge.from).y}
              x2={position(edge.to).x}
              y2={position(edge.to).y}
              stroke="rgba(16,185,129,0.25)"
              strokeWidth={1 + edge.weight * 2}
              style={{
                opacity: 0.3 + edge.turbulence * 0.7,
                transition: 'all 120ms ease-out',
              }}
            />
          ))}
        </svg>

        {/* NODES */}
        {nodes.map((node) => (
          <div
            key={node.id}
            className="absolute flex items-center justify-center rounded-full border border-emerald-400/30 text-[10px] text-emerald-200"
            style={{
              ...position(node.id),
              width: 52 + node.intensity * 20,
              height: 52 + node.intensity * 20,
              transform: `translate(-50%, -50%) scale(${1 + node.activity * 0.2})`,
              boxShadow: `0 0 ${10 + node.activity * 30}px rgba(16,185,129,${
                0.1 + node.activity * 0.4
              })`,
              transition: 'all 120ms ease-out',
              background: `rgba(16,185,129,${0.05 + node.drift * 0.15})`,
            }}
          >
            {node.label}
          </div>
        ))}

      </div>

      {/* FOOTER SIGNAL */}
      <div className="mt-4 text-[11px] text-slate-500">
        pressure: {decisionPressure.toFixed(3)} · drift: {drift.toFixed(3)} · phase:{' '}
        {phase}
      </div>
    </div>
  )
}

/**
 * 🧭 LAYOUT MAPPER (CAUSAL SPACE COORDINATES)
 */
function position(id: string) {
  const map: Record<string, { x: string; y: string }> = {
    risk: { x: '20%', y: '30%' },
    twin: { x: '20%', y: '70%' },
    governance: { x: '55%', y: '50%' },
    treasury: { x: '85%', y: '50%' },
  }

  return map[id] ?? { x: '50%', y: '50%' }
}

/**
 * 🔧 SAFETY CLAMP
 */
function clamp(v: number) {
  return Math.max(0, Math.min(1, v))
}
