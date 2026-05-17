import { normalizeObject } from '@/components/admin/treasury/contracts/panel'

type IntentDriftRow = {
  intent: string
  averageDivergence: number
  count: number
  intentChangedRate: number
}

type ReplayDriftSummaryData = {
  averageDivergence: number
  highDivergenceCount: number
  intentDriftRate: number
  mostUnstableIntent: string | null
  byIntent: IntentDriftRow[]
}

type Props = {
  data?: Partial<ReplayDriftSummaryData> | null
}

const DEFAULT_DATA: ReplayDriftSummaryData = {
  averageDivergence: 0,
  highDivergenceCount: 0,
  intentDriftRate: 0,
  mostUnstableIntent: null,
  byIntent: [],
}

function normalizeData(
  data?: Partial<ReplayDriftSummaryData> | null
): ReplayDriftSummaryData {
  const normalized = normalizeObject(data, DEFAULT_DATA)

  return {
    ...normalized,
    byIntent: Array.isArray(data?.byIntent)
      ? data.byIntent
      : [],
  }
}

export default function ReplayDriftSummaryPanel({
  data,
}: Props) {
  const normalized = normalizeData(data)

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg">Replay Drift Summary</h2>

      <div className="mb-6 grid gap-4 text-sm lg:grid-cols-4">
        <div>
          <div className="text-neutral-400">Avg Divergence</div>
          <div className="text-cyan-400">
            {(normalized.averageDivergence * 100).toFixed(0)}%
          </div>
        </div>

        <div>
          <div className="text-neutral-400">High Divergence</div>
          <div className="text-yellow-400">
            {normalized.highDivergenceCount}
          </div>
        </div>

        <div>
          <div className="text-neutral-400">Intent Drift Rate</div>
          <div className="text-red-400">
            {(normalized.intentDriftRate * 100).toFixed(0)}%
          </div>
        </div>

        <div>
          <div className="text-neutral-400">Most Unstable Intent</div>
          <div className="text-white">
            {normalized.mostUnstableIntent ?? '—'}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {normalized.byIntent.length ? (
          normalized.byIntent.map((row) => (
            <div
              key={row.intent}
              className="border-b border-neutral-800 pb-2 text-sm"
            >
              <div className="font-medium">{row.intent}</div>

              <div className="text-xs text-neutral-400">
                Avg divergence:{' '}
                {(row.averageDivergence * 100).toFixed(0)}%
              </div>

              <div className="text-xs text-neutral-400">
                Intent changed rate:{' '}
                {(row.intentChangedRate * 100).toFixed(0)}%
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