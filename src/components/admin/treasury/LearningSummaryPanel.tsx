type Row = {
  scenarioId: string
  sampleCount: number
  successRate: number
  averageImpact: number
  trend: 'UP' | 'DOWN' | 'FLAT'
}

type Props = {
  data?: Row[] | null
}

function normalizeRows(data?: Row[] | null): Row[] {
  return Array.isArray(data) ? data : []
}

function trendColor(t: Row['trend']) {
  if (t === 'UP') return 'text-green-400'
  if (t === 'DOWN') return 'text-red-400'
  return 'text-neutral-400'
}

export default function LearningSummaryPanel({ data }: Props) {
  const rows = normalizeRows(data)
  const best = rows[0]

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg">Strategy Learning</h2>

      {best && (
        <div className="mb-4 text-sm text-green-400">
          Preferred Strategy: {best.scenarioId}
        </div>
      )}

      {rows.length ? (
        <div className="space-y-3">
          {rows.map((r) => (
            <div
              key={r.scenarioId}
              className="border-b border-neutral-800 pb-2 text-sm"
            >
              <div className="flex justify-between">
                <span className="font-medium">{r.scenarioId}</span>
                <span className={trendColor(r.trend)}>
                  {r.trend}
                </span>
              </div>

              <div className="text-xs text-neutral-400">
                Samples: {r.sampleCount}
              </div>

              <div className="text-xs text-green-400">
                Success: {(r.successRate * 100).toFixed(0)}%
              </div>

              <div className="text-xs text-cyan-400">
                Impact: {r.averageImpact.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-neutral-500">
          No learning data yet
        </div>
      )}
    </div>
  )
}