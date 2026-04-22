type Props = {
  data: {
    averageDivergence: number
    highDivergenceCount: number
    intentDriftRate: number
    mostUnstableIntent: string | null
    byIntent: Array<{
      intent: string
      averageDivergence: number
      count: number
      intentChangedRate: number
    }>
  }
}

export default function ReplayDriftSummaryPanel({ data }: Props) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg">Replay Drift Summary</h2>

      <div className="grid gap-4 lg:grid-cols-4 text-sm mb-6">
        <div>
          <div className="text-neutral-400">Avg Divergence</div>
          <div className="text-cyan-400">
            {(data.averageDivergence * 100).toFixed(0)}%
          </div>
        </div>

        <div>
          <div className="text-neutral-400">High Divergence</div>
          <div className="text-yellow-400">{data.highDivergenceCount}</div>
        </div>

        <div>
          <div className="text-neutral-400">Intent Drift Rate</div>
          <div className="text-red-400">
            {(data.intentDriftRate * 100).toFixed(0)}%
          </div>
        </div>

        <div>
          <div className="text-neutral-400">Most Unstable Intent</div>
          <div className="text-white">
            {data.mostUnstableIntent ?? '—'}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {data.byIntent.length ? (
          data.byIntent.map((row) => (
            <div
              key={row.intent}
              className="border-b border-neutral-800 pb-2 text-sm"
            >
              <div className="font-medium">{row.intent}</div>
              <div className="text-xs text-neutral-400">
                Avg divergence: {(row.averageDivergence * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-neutral-400">
                Intent changed rate: {(row.intentChangedRate * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-neutral-500">
                Samples: {row.count}
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-neutral-500">
            No replay audits yet.
          </div>
        )}
      </div>
    </div>
  )
}