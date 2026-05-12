"use client"

import { useEffect, useState } from "react"

export default function ReconciliationDriftPanel() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const i = setInterval(async () => {
      const res = await fetch("/api/admin/reconciliation")
      const json = await res.json()
      setData(json.data)
    }, 3000)

    return () => clearInterval(i)
  }, [])

  if (!data) return null

  return (
    <div className="p-4 border border-red-500/20 rounded-xl bg-black/60">
      <div className="text-xs text-slate-400">RECONCILIATION DRIFT</div>

      <div className="mt-2 text-xs space-y-1">
        {data.map((d: any, i: number) => (
          <div key={i}>
            Case {d.caseId} → drift {d.driftScore ?? 0}
          </div>
        ))}
      </div>
    </div>
  )
}