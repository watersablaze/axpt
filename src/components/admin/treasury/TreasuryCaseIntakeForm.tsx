'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type IntakeType = 'TRANSFER_REVIEW' | 'BALANCE_DISCREPANCY' | 'SYNC_ISSUE' | 'OTHER'

export default function TreasuryCaseIntakeForm() {
  const router = useRouter()

  const [type, setType] = useState<IntakeType>('TRANSFER_REVIEW')
  const [description, setDescription] = useState('')
 
  type PriorityLevel =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL'

const PRIORITY_LEVELS: readonly PriorityLevel[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
]

const [priority, setPriority] =
  useState<PriorityLevel>('MEDIUM')
  const [affectedAssets, setAffectedAssets] = useState<string>('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submitIntake() {
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/treasury/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          description,
          priority,
          affectedAssets: affectedAssets.split(',').map(s => s.trim()).filter(Boolean),
        }),
      })

      const json = await res.json()

      if (!res.ok) throw new Error(json.error)

      // Redirect to the created case or back to treasury
      router.push('/admin/treasury')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
        <h2 className="text-xl font-semibold mb-4">Treasury Issue Intake</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Issue Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as IntakeType)}
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-md"
            >
              <option value="TRANSFER_REVIEW">Transfer Review</option>
              <option value="BALANCE_DISCREPANCY">Balance Discrepancy</option>
              <option value="SYNC_ISSUE">Sync Issue</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Priority</label>
            <select
              value={priority}
              onChange={(e) => {
              const value = e.target.value

              if (
                PRIORITY_LEVELS.includes(
                  value as PriorityLevel
                )
              ) {
                setPriority(value as PriorityLevel)
              }
            }}
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-md"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Affected Assets (comma-separated)</label>
            <input
              type="text"
              value={affectedAssets}
              onChange={(e) => setAffectedAssets(e.target.value)}
              placeholder="AXG, NMP, USD"
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe the treasury issue..."
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-md"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          <button
            onClick={submitIntake}
            disabled={submitting}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md font-medium"
          >
            {submitting ? 'Submitting...' : 'Submit Intake'}
          </button>
        </div>
      </div>
    </div>
  )
}