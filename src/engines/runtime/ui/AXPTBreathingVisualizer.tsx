'use client'

import { useEffect, useState } from 'react'
import { useUnifiedOrganism } from '@/ui/hooks/useUnifiedOrganism'

export function AXPTBreathingVisualizer() {
  const state = useUnifiedOrganism()

  if (!state) return null

  const vitals = {
    pressure: state.drift,
    stability: state.stability,
    inflammation: state.mutations / 100,
    adaptation: state.intensity * 100,
    coherence: state.stability > 0.6,
    heartbeat: state.intensity,
  }

  return (
    <div className="organism">
      <div className="heartbeat">♥ {vitals.heartbeat.toFixed(2)}</div>

      <div className="bar">
        <label>Pressure</label>
        <div style={{ width: `${vitals.pressure * 100}%` }} />
      </div>

      <div className="bar">
        <label>Stability</label>
        <div style={{ width: `${vitals.stability * 100}%` }} />
      </div>

      <div className="bar">
        <label>Inflammation</label>
        <div style={{ width: `${vitals.inflammation * 100}%` }} />
      </div>

      <div className="bar">
        <label>Adaptation</label>
        <div style={{ width: `${vitals.adaptation}%` }} />
      </div>

      <div className="coherence">
        {vitals.coherence ? 'COHERENT' : 'DRIFTING'}
      </div>
    </div>
  )
}