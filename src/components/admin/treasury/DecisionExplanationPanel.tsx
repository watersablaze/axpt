'use client'

import { useReplaySelection } from '@/lib/context/ReplaySelectionContext'

type Row = {
  id: string
  intent: string
  summary: string
  factors: string[]
  createdAt: string
}

export default function DecisionExplanationPanel({
  data,
}: {
  data: Row[]
}) {
  const {
    selectedDecisionId,
    setSelectedDecisionId,
  } = useReplaySelection()

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg">Decision Log</h2>

      <div className="space-y-3 max-h-[300px] overflow-auto">
        {data.map((row) => {
          const active = selectedDecisionId === row.id

          return (
            <div
              key={row.id}
              className={`border-b border-neutral-800 pb-2 transition ${
                active
                  ? 'rounded-md border border-cyan-500/40 bg-neutral-900/60 px-2 py-2 shadow-[0_0_0_1px_rgba(34,211,238,0.2)]'
                  : ''
              }`}
            >
              <div className="text-sm text-white">
                {row.summary}
              </div>

              <div className="text-xs text-neutral-400 mt-1">
                {row.factors.map((f, i) => (
                  <div key={i}>• {f}</div>
                ))}
              </div>

              <div className="text-xs text-neutral-500 mt-1">
                {new Date(row.createdAt).toLocaleString()}
              </div>

              <button
                onClick={() => setSelectedDecisionId(row.id)}
                className={`mt-2 rounded-md border px-2 py-1 text-xs transition ${
                  active
                    ? 'border-cyan-500 text-cyan-300'
                    : 'border-neutral-700 text-neutral-200 hover:border-neutral-500'
                }`}
              >
                {active
                  ? 'Viewing Replay Comparison'
                  : 'Replay Compare'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
