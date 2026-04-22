"use client"

import PanelWrapper from "@/components/admin/system/PanelWrapper"
import { useAwareness } from "@/lib/realtime/AwarenessProvider"

type Bucket = {
  status: string
  count: number
}

export default function CaseHeatmap() {
  const { items, isLoading } = useAwareness()

  if (isLoading && items.length === 0) {
    return (
      <PanelWrapper title="Case Distribution" isEmpty>
        <div className="text-xs text-neutral-500">Loading case distribution...</div>
      </PanelWrapper>
    )
  }

  if (items.length === 0) {
    return (
      <PanelWrapper title="Case Distribution" isEmpty>
        <div className="text-xs text-neutral-500">No case data available.</div>
      </PanelWrapper>
    )
  }

  const buckets = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1
    return acc
  }, {})

  const data: Bucket[] = Object.entries(buckets).map(([status, count]) => ({
    status,
    count,
  }))

  const max = Math.max(...data.map((d) => d.count), 1)

  return (
    <PanelWrapper title="Case Distribution">
      <div className="space-y-3">
        {data.map((row) => {
          const width = `${(row.count / max) * 100}%`

          return (
            <div key={row.status} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-400">{row.status}</span>
                <span className="font-mono text-white">{row.count}</span>
              </div>

              <div className="h-2 rounded bg-neutral-900 overflow-hidden">
                <div
                  className="h-full rounded bg-cyan-400/70"
                  style={{ width }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </PanelWrapper>
  )
}