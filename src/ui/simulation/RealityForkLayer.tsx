'use client'

import ForkLauncherPanel from '../fork/ForkLauncherPanel'
import ForkTimelinePanel from '../fork/ForkTimelinePanel'

export default function RealityForkLayer() {
  return (
    <div className="rounded-xl border border-purple-500/20 bg-black/60 p-4 space-y-4">

      <h2 className="text-purple-300 text-sm uppercase">
        Forked Realities
      </h2>

      <ForkLauncherPanel />

      <ForkTimelinePanel />

    </div>
  )
}