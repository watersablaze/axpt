"use client"

import { useEffect, useState } from "react"

export default function ChainActivityPanel() {
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    const i = setInterval(async () => {
      const res = await fetch("/api/chain/events")
      const json = await res.json()
      setEvents(json.data ?? [])
    }, 5000)

    return () => clearInterval(i)
  }, [])

  return (
    <div className="p-4 border border-emerald-500/20 rounded-xl bg-black/60">
      <div className="text-xs text-slate-400">CHAIN ACTIVITY</div>

      <div className="mt-2 text-xs space-y-1">
        {events.slice(0, 10).map((e, i) => (
          <div key={i}>
            {e.type} → block {e.blockNumber}
          </div>
        ))}
      </div>
    </div>
  )
}