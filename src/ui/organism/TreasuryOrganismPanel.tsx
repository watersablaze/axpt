'use client'

import { useEffect, useState } from 'react'
import {
  type UnifiedOrganismState,
} from '@/engines/runtime/AXPTUnifiedOrganismFieldEngine'
import { useBreathInterpolation } from '@/ui/hooks/useBreathInterpolation'
import { useUnifiedOrganism } from '../hooks/useUnifiedOrganism';

export function TreasuryOrganismPanel() {
  const state = useUnifiedOrganism()

  /**
   * ──────────────────────────────
   * NORMALIZED VISUAL SIGNALS
   * ──────────────────────────────
   */
  const smooth = useBreathInterpolation(state ?? {
    timestamp: 0,
    drift: 0,
    intensity: 0,
    stability: 0,
    liquidity: 0,
    phase: "EXHALE",
    mutations: 0,
    riskLevel: "LOW",
    decisionPressure: 0,
    breath: {
      phase: "EXHALE",
      drift: 0,
      intensity: 0,
      mutations: 0,
      stability: 0,
      timestamp: 0,
    },
    breathPhase: "EXHALE",
    breathIntensity: 0,
    mutationCount: 0,
    evolutionPressure: 0,
    lastExecutionStatus: "IDLE",
  })
  const liquidity = Math.max(0, Math.min(1, smooth.liquidity ?? 0))
  const intensity = Math.max(0, Math.min(1, smooth.intensity ?? 0))
  const stability = Math.max(0, Math.min(1, smooth.stability ?? 0))

  if (!state) return null


  /**
   * ──────────────────────────────
   * SYSTEM INTERPRETATION LAYER
   * ──────────────────────────────
   */
  const riskLabel =
    state.riskLevel === 'CRITICAL'
      ? 'Critical treasury organism risk'
      : state.riskLevel === 'HIGH'
        ? 'Elevated treasury pressure'
        : state.riskLevel === 'MEDIUM'
          ? 'Treasury flow under watch'
          : 'Treasury flow stable'

    return (
      <section
        className="rounded border border-emerald-500/20 bg-slate-950/70 p-4 text-sm text-slate-100"
        style={{
          boxShadow: `0 0 ${12 + intensity * 28}px rgba(16, 185, 129, ${
            0.16 + intensity * 0.34
          })`,

          // 🫀 THIS IS WHERE YOUR BREATH LAYER GOES
          transform: `scale(${1 + intensity * 0.01})`,
          filter: `brightness(${1 + intensity * 0.2})`,
          transition: 'transform 120ms ease-out, filter 120ms ease-out',
        }}
      >
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-200">
            Organism Treasury Pulse
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            {riskLabel}
          </p>
        </div>

        <div className="rounded border border-slate-700 px-3 py-1 text-xs">
          {state.riskLevel}
        </div>
      </div>

      {/* METRICS */}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {/* LIQUIDITY */}
        <div>
          <div className="text-xs text-slate-400">Liquidity</div>
          <div className="mt-2 h-2 rounded bg-slate-800">
            <div
              className="h-full rounded bg-cyan-300"
              style={{ width: `${liquidity * 100}%` }}
            />
          </div>
        </div>

        {/* STABILITY */}
        <div>
          <div className="text-xs text-slate-400">System Stability</div>
          <div className="mt-2 h-2 rounded bg-slate-800">
            <div
              className="h-full rounded bg-emerald-400"
              style={{ width: `${stability * 100}%` }}
            />
          </div>
        </div>

        {/* RISK */}
        <div>
          <div className="text-xs text-slate-400">Risk Level</div>
          <div className="mt-2 h-2 rounded bg-slate-800">
            <div
              className="h-full rounded bg-amber-300"
              style={{ width: `${riskWidth(state.riskLevel)}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function riskWidth(riskLevel: UnifiedOrganismState['riskLevel']) {
  if (riskLevel === 'CRITICAL') return 100
  if (riskLevel === 'HIGH') return 75
  if (riskLevel === 'MEDIUM') return 45
  return 18
}
