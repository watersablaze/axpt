'use client'

import RealityTimelineLayer from './RealityTimelineLayer'
import RealityForkLayer from './RealityForkLayer'
import RealityComparisonLayer from './RealityComparisonLayer'
import RealityInspectorPanel from './RealityInspectorPanel'

export default function RealitySimulationConsole() {
  return (
    <div className="space-y-6 p-4">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-emerald-300">
          Reality Simulation Console
        </h1>
        <p className="text-xs text-slate-400">
          Temporal + Fork + Organism unified simulation layer
        </p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <RealityTimelineLayer />

        <RealityForkLayer />

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <RealityComparisonLayer />

        <RealityInspectorPanel />

      </div>

    </div>
  )
}