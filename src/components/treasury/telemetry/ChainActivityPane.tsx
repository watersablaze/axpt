"use client"

import { useEffect, useState } from "react"
import { organismSnapshotStore } from "@/engines/runtime/clientSingletons"

export default function ChainActivityPanel() {
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      setEvents(
        organismSnapshotStore
          .getAll()
          .slice(-10)
          .reverse()
          .map((snapshot) => ({
            type: snapshot.source ?? "CLIENT_CLOCK",
          }))
      )
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="border border-purple-500/30 p-4 rounded">
      <h2 className="text-purple-300 font-semibold">
        Chain Activity
      </h2>

      <div className="mt-2 text-xs space-y-1">

        {events.slice(-10).map((e, i) => (
          <div key={i} className="opacity-80">
            {e.type}
          </div>
        ))}

      </div>
    </div>
  )
}
