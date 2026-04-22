"use client"

import PanelWrapper from "@/components/admin/system/PanelWrapper"
import { useAwareness } from "@/lib/realtime/AwarenessProvider"

export default function EventStreamPanel() {
  const {
    command: { events },
  } = useAwareness()

  if (!events || events.length === 0) return null

return (
    <PanelWrapper
      title="Live Event Stream"
      isEmpty={!events || events.length === 0}
    >
      <div className="relative">

        <div className="max-h-[320px] overflow-y-auto pr-2 space-y-2 text-xs">

          {events?.slice(0, 50).map((e, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-neutral-500 whitespace-nowrap">
                {new Date(e.createdAt).toLocaleTimeString()}
              </span>

              <span className="text-cyan-400">
                {e.type}
              </span>
            </div>
          ))}

        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black to-transparent" />

      </div>
    </PanelWrapper>
  )
}
