'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type PendingAction = {
  id: string
  assetCode: string
  amountBaseUnits: string | number | bigint | { toString(): string }
  approvals: Array<{ id: string }>
}

export default function PendingActionsPanel({
  actions,
}: {
  actions: PendingAction[]
}) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function submitDecision(id: string, decision: 'approve' | 'reject') {
    setLoadingId(id)

    try {
      const res = await fetch(`/api/treasury/actions/${id}/${decision}`, {
        method: 'POST',
      })

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as
          | { error?: string }
          | null
        throw new Error(
          payload?.error ?? `Failed to ${decision} action`
        )
      }

      router.refresh()
    } catch (err) {
      console.error(`[pending-actions] ${decision} failed`, err)
      alert(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="p-4 border rounded-xl bg-neutral-950">
      <h2 className="text-lg font-semibold mb-4">Pending Actions</h2>

      <div className="space-y-3">
        {actions.map((action) => {
          const amount =
            Number(action.amountBaseUnits.toString()) / 1_000_000

          return (
            <div
              key={action.id}
              className="p-3 border rounded-lg"
            >
              <Link
                href={`/admin/treasury/actions/${action.id}`}
                className="block mb-2 hover:bg-neutral-900 transition"
              >
                <div className="min-w-0">
                  <div className="text-sm opacity-70">
                    {action.assetCode}
                  </div>
                  <div className="font-medium">
                    {amount} AXG
                  </div>
                  <div className="text-xs opacity-60">
                    approvals: {action.approvals.length}
                  </div>
                </div>
              </Link>

              <div className="flex gap-2">
                <button
                  onClick={() => submitDecision(action.id, 'approve')}
                  disabled={loadingId === action.id}
                  className="px-3 py-1 bg-green-600 rounded disabled:opacity-50"
                >
                  Approve
                </button>

                <button
                  onClick={() => submitDecision(action.id, 'reject')}
                  disabled={loadingId === action.id}
                  className="px-3 py-1 bg-red-600 rounded disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
