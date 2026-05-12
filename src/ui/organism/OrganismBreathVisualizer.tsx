'use client'

import { useOrganismState } from './OrganismStateProvider'

export function OrganismBreathVisualizer() {
  const state = useOrganismState()

  if (!state) return null

  return (
    <div className="organism">
      <div className={`breath ${state.breathPhase.toLowerCase()}`}>
        <div
          className="core"
          style={{
            transform: `scale(${1 + state.breathIntensity})`,
          }}
        />

        <div className="metrics">
          <div>DRIFT: {state.drift.toFixed(3)}</div>
          <div>STABILITY: {state.stability.toFixed(3)}</div>
          <div>MUTATIONS: {state.mutationCount}</div>
          <div>PRESSURE: {state.evolutionPressure.toFixed(3)}</div>
        </div>

        <div className="status">{state.lastExecutionStatus}</div>
      </div>
    </div>
  )
}