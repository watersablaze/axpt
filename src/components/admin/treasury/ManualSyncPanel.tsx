'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { toastSyncResult } from '@/lib/toasts/adminOutcome'

export default function ManualSyncPanel() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSync() {
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/treasury/sync-chain', {
        method: 'POST',
      })

      const json = await res.json()

      if (!json.ok) {
        toast.error(json.error ?? 'Sync failed')
        setMessage(`Sync failed: ${json.error}`)
      } else {
        const inserted = json.data?.inserted ?? 0
        toastSyncResult(json.data ?? {})
        setMessage(`Sync complete. Inserted ${inserted} event(s).`)
      }
    } catch (err: any) {
      toast.error('Sync failed')
      setMessage(`Sync failed: ${err.message ?? 'unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg">Manual Chain Sync</h2>

      <button
        onClick={handleSync}
        disabled={loading}
        className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-900 disabled:opacity-50"
      >
        {loading ? 'Syncing...' : 'Run Sync'}
      </button>

      {message && <div className="mt-3 text-sm text-neutral-300">{message}</div>}
    </div>
  )
}
