'use client'

import { useState } from 'react'
import { useEntity } from '@/lib/context/EntityContext'
import { toast } from 'sonner'
import { toastPauseResult } from '@/lib/toasts/adminOutcome'

type Props = {
  state: {
    globalPaused: boolean
    pausedAssets: string[]
    pausedLayers: string[]
    reason?: string | null
  }
}

type PausePayload = {
  globalPaused?: boolean
  pausedAssets?: string[]
  pausedLayers?: string[]
  reason?: string | null
}

export default function SystemControlPanel({ state }: Props) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const { entity } = useEntity()

  async function submitPause(payload: PausePayload, successMessage: string) {
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/treasury/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const json = await res.json()

      if (!json.ok) {
        toast.error(json.error ?? 'Pause action failed')
        setMessage(`Error: ${json.error}`)
      } else {
        toastPauseResult(json.data ?? {})
        setMessage(successMessage)
      }
    } catch (err: any) {
      toast.error('Pause action failed')
      setMessage(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-yellow-800 bg-black p-4">
      <h2 className="text-lg text-yellow-400 mb-4">
        System Control
      </h2>

      {entity.assets.length > 0 && (
        <div className="mb-4 text-sm text-yellow-400">
          Selected: {entity.assets.join(', ')}
        </div>
      )}

      <div className="mb-4 space-y-1 text-sm">
        <div>
          Status:{' '}
          <span className={state.globalPaused ? 'text-red-400' : 'text-green-400'}>
            {state.globalPaused ? 'Paused' : 'Active'}
          </span>
        </div>
        <div>
          Mirror:{' '}
          <span className={state.pausedLayers.includes('MIRROR') ? 'text-yellow-400' : 'text-neutral-300'}>
            {state.pausedLayers.includes('MIRROR') ? 'Paused' : 'Active'}
          </span>
        </div>
        <div>
          AXG:{' '}
          <span className={state.pausedAssets.includes('AXG') ? 'text-yellow-400' : 'text-neutral-300'}>
            {state.pausedAssets.includes('AXG') ? 'Paused' : 'Active'}
          </span>
        </div>
        {state.reason && (
          <div className="text-neutral-400">
            Reason: {state.reason}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() =>
            submitPause(
              {
                globalPaused: true,
                reason: 'Manual admin pause',
              },
              'System paused'
            )
          }
          disabled={loading}
          className="px-4 py-2 border border-red-700 text-red-400 rounded-lg"
        >
          Pause System
        </button>

        <button
          onClick={() =>
            submitPause(
              {
                pausedLayers: ['MIRROR'],
                reason: 'Mirror manually paused',
              },
              'Mirror paused'
            )
          }
          disabled={loading}
          className="px-4 py-2 border border-yellow-700 text-yellow-300 rounded-lg"
        >
          Pause Mirror
        </button>

        <button
          onClick={() =>
            submitPause(
              {
                pausedAssets: ['AXG'],
                reason: 'AXG manually paused',
              },
              'AXG paused'
            )
          }
          disabled={loading}
          className="px-4 py-2 border border-orange-700 text-orange-300 rounded-lg"
        >
          Pause AXG
        </button>

        <button
          onClick={() =>
            submitPause(
              {
                globalPaused: false,
                pausedAssets: [],
                pausedLayers: [],
                reason: null,
              },
              'System resumed'
            )
          }
          disabled={loading}
          className="px-4 py-2 border border-green-700 text-green-400 rounded-lg"
        >
          Resume
        </button>
      </div>

      {message && (
        <div className="mt-3 text-sm text-neutral-300">
          {message}
        </div>
      )}
    </div>
  )
}
