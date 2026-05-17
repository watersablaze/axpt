'use client'

import { useEffect, useState } from 'react'
import { useReplaySelection } from '@/lib/context/ReplaySelectionContext'
import {
  normalizeObject,
  normalizeRows,
} from '@/components/admin/treasury/contracts/panel'

type ReplayData = {
  original: {
    id: string
    intent: string
    scenarioId: string | null
    summary: string
    factors: string[]
    createdAt: string
  }
  replay: {
    intent?: string
    summary?: string
    factors?: string[]
  }
  diff: {
    intentChanged: boolean
    addedFactors: string[]
    removedFactors: string[]
  }
  divergenceScore: number
}

const DEFAULT_REPLAY_DATA: ReplayData = {
  original: {
    id: '',
    intent: '',
    scenarioId: null,
    summary: '',
    factors: [],
    createdAt: new Date(0).toISOString(),
  },

  replay: {
    intent: '',
    summary: '',
    factors: [],
  },

  diff: {
    intentChanged: false,
    addedFactors: [],
    removedFactors: [],
  },

  divergenceScore: 0,
}

function normalizeReplayData(
  data?: Partial<ReplayData> | null
): ReplayData {
  const normalized = normalizeObject(
    data,
    DEFAULT_REPLAY_DATA
  )

  return {
    ...normalized,

    original: {
      ...DEFAULT_REPLAY_DATA.original,
      ...normalized.original,
      factors: normalizeRows(
        normalized.original?.factors
      ),
    },

    replay: {
      ...DEFAULT_REPLAY_DATA.replay,
      ...normalized.replay,
      factors: normalizeRows(
        normalized.replay?.factors
      ),
    },

    diff: {
      ...DEFAULT_REPLAY_DATA.diff,
      ...normalized.diff,
      addedFactors: normalizeRows(
        normalized.diff?.addedFactors
      ),
      removedFactors: normalizeRows(
        normalized.diff?.removedFactors
      ),
    },
  }
}

export default function ReplayComparisonPanel() {
  const {
    selectedDecisionId,
    setSelectedDecisionId,
  } = useReplaySelection()

  const [data, setData] =
  useState<ReplayData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedDecisionId) {
      setData(null)
      setError(null)
      return
    }

    const controller = new AbortController()
    let active = true

    async function loadReplay() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(
          '/api/admin/explanations/replay-compare',
          {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              decisionId: selectedDecisionId,
            }),
          }
        )

        const json = await res.json()

        if (!res.ok || !json.ok) {
          if (active) {
            setError(json.error ?? 'Replay comparison failed')
          }
          return
        }

        if (active) {
          setData(
            normalizeReplayData(json.data)
          )
        }
      } catch (err: any) {
        if (active && err.name !== 'AbortError') {
          setError(err.message ?? 'Replay comparison failed')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadReplay()

    return () => {
      active = false
      controller.abort()
    }
  }, [selectedDecisionId])

  if (!selectedDecisionId) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
        <h2 className="mb-4 text-lg">Replay Comparison</h2>
        <div className="text-sm text-neutral-500">
          Dormant forensic tool. Select a decision to replay and compare it.
        </div>
      </div>
    )
  }

  if (loading && !data) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
        <h2 className="mb-4 text-lg">Replay Comparison</h2>
        <div className="text-sm text-neutral-500">
          Replaying decision...
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg">Replay Comparison</h2>

          <button
            onClick={() => setSelectedDecisionId(null)}
            className="text-xs text-neutral-400 hover:text-white"
          >
            Clear Replay
          </button>
        </div>

        <div className="text-sm text-red-400">
          {error ?? 'No replay comparison available.'}
        </div>
      </div>
    )
  }

  return (
    <div className="relative rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-start justify-end rounded-xl bg-neutral-950/45 p-4 backdrop-blur-[1px]">
          <span className="rounded-full border border-cyan-500/30 bg-neutral-950 px-3 py-1 text-xs text-cyan-300">
            Replaying new selection...
          </span>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg">Replay Comparison</h2>

        <button
          onClick={() => setSelectedDecisionId(null)}
          className="text-xs text-neutral-400 hover:text-white"
        >
          Clear Replay
        </button>
      </div>

      <div className="mb-4 text-xs text-neutral-500">
        Decision: {data.original.intent} •{' '}
        {new Date(data.original.createdAt).toLocaleString()}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-2 text-sm text-neutral-400">
            Original
          </div>

          <div className="text-sm font-medium">
            {data.original.summary}
          </div>

          <div className="mt-2 space-y-1 text-xs text-neutral-400">
            {data.original.factors.map((f, i) => (
              <div key={i}>• {f}</div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-sm text-neutral-400">
            Replay
          </div>

          <div className="text-sm font-medium">
            {data.replay.summary ?? 'No replay summary'}
          </div>

          <div className="mt-2 space-y-1 text-xs text-neutral-400">
            {(data.replay.factors ?? []).map((f, i) => (
              <div key={i}>• {f}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 text-sm lg:grid-cols-4">
        <div>
          <div className="text-neutral-400">
            Intent Changed
          </div>

          <div
            className={
              data.diff.intentChanged
                ? 'text-yellow-400'
                : 'text-green-400'
            }
          >
            {data.diff.intentChanged ? 'Yes' : 'No'}
          </div>
        </div>

        <div>
          <div className="text-neutral-400">
            Divergence Score
          </div>

          <div
            className={
              data.divergenceScore > 0.6
                ? 'text-red-400'
                : data.divergenceScore > 0.3
                ? 'text-yellow-400'
                : 'text-green-400'
            }
          >
            {(data.divergenceScore * 100).toFixed(0)}%
          </div>
        </div>

        <div>
          <div className="text-neutral-400">
            Added Factors
          </div>

          <div className="text-xs text-cyan-400">
            {data.diff.addedFactors.length
              ? data.diff.addedFactors.map((f, i) => (
                  <div key={i}>+ {f}</div>
                ))
              : 'None'}
          </div>
        </div>

        <div>
          <div className="text-neutral-400">
            Removed Factors
          </div>

          <div className="text-xs text-red-400">
            {data.diff.removedFactors.length
              ? data.diff.removedFactors.map((f, i) => (
                  <div key={i}>- {f}</div>
                ))
              : 'None'}
          </div>
        </div>
      </div>
    </div>
  )
}
