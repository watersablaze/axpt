"use client"

import { useEffect, useState } from "react"

export default function CognitiveTracePanel() {
  const [trace, setTrace] = useState<any[]>([])

  useEffect(() => {
    const i = setInterval(async () => {
      const res = await fetch("/api/admin/cognitive-trace")
      const json = await res.json()
      setTrace(json.data ?? [])
    }, 4000)

    return () => clearInterval(i)
  }, [])

  return (
    <div className="p-4 border border-slate-700 rounded-xl bg-black/60">
      <div className="text-xs text-slate-400">COGNITIVE TRACE</div>

      <div className="mt-2 text-xs space-y-1">
        {trace.slice(0, 10).map((t, i) => (
          <div key={i}>
            {t.intent} → {t.reasoning?.slice?.(0, 1)?.[0] ?? "—"}
          </div>
        ))}
      </div>
    </div>
  )
}