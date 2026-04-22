'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type CaseMode = 'COORDINATION_ONLY' | 'FULL_ESCROW'

export default function CreateCaseWizard() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [jurisdiction, setJurisdiction] = useState('')
  const [mode, setMode] = useState<CaseMode>('COORDINATION_ONLY')
  const [template, setTemplate] = useState<'NONE' | 'GOLD_SPA'>('NONE')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // =========================
  // CREATE CASE
  // =========================
  async function initiateCase() {
    setSubmitting(true)
    setError(null)

    try {
      // 🔥 TEMPLATE PATH
      if (template === 'GOLD_SPA') {
        const res = await fetch('/api/admin/cases/create-gold-spa', {
          method: 'POST',
        })

        const json = await res.json()

        if (!res.ok) throw new Error(json.error)

        router.push(`/admin/cases/${json.caseId}`)
        return
      }

      // 🔥 STANDARD PATH
      const res = await fetch('/api/axpt/cases/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          jurisdiction: jurisdiction || undefined,
          mode,
          actor: 'ADMIN_UI',
        }),
      })

      const json = await res.json()

      if (!json.ok) throw new Error(json.error)

      router.push(`/admin/cases/${json.case.id}`)
    } catch (e: any) {
      setError(e.message || 'CREATE_FAILED')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-xl">

      {/* ========================= */}
      {/* TEMPLATE MODE */}
      {/* ========================= */}
      <div className="space-y-2">
        <div className="text-sm text-neutral-400">Start from template</div>

        <button
          onClick={() => setTemplate('GOLD_SPA')}
          className={`w-full text-left p-4 rounded border ${
            template === 'GOLD_SPA'
              ? 'border-cyan-600 bg-cyan-950/20'
              : 'border-neutral-800'
          }`}
        >
          <div className="font-medium">Gold SPA</div>
          <div className="text-xs text-neutral-500">
            Full structured trade case with gates + artifacts
          </div>
        </button>

        <button
          onClick={() => setTemplate('NONE')}
          className={`w-full text-left p-4 rounded border ${
            template === 'NONE'
              ? 'border-neutral-600'
              : 'border-neutral-800'
          }`}
        >
          <div className="font-medium">Blank Case</div>
          <div className="text-xs text-neutral-500">
            Manual setup
          </div>
        </button>
      </div>

      {/* ========================= */}
      {/* FORM (ONLY IF NOT TEMPLATE) */}
      {/* ========================= */}
      {template === 'NONE' && (
        <div className="space-y-4">

          <div className="space-y-1">
            <label className="text-xs text-neutral-400">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded bg-black border border-neutral-700 text-sm"
              placeholder="Mali Gold Coordination – Batch A"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-neutral-400">Jurisdiction</label>
            <input
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              className="w-full px-3 py-2 rounded bg-black border border-neutral-700 text-sm"
              placeholder="Mali, South Africa, International"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-neutral-400">Mode</label>

            <div className="flex gap-3 text-sm">
              <button
                onClick={() => setMode('COORDINATION_ONLY')}
                className={`px-3 py-1 rounded ${
                  mode === 'COORDINATION_ONLY'
                    ? 'bg-neutral-700'
                    : 'bg-neutral-900'
                }`}
              >
                Coordination
              </button>

              <button
                onClick={() => setMode('FULL_ESCROW')}
                className={`px-3 py-1 rounded ${
                  mode === 'FULL_ESCROW'
                    ? 'bg-neutral-700'
                    : 'bg-neutral-900'
                }`}
              >
                Escrow
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ========================= */}
      {/* ERROR */}
      {/* ========================= */}
      {error && (
        <div className="text-xs text-red-400">
          {error}
        </div>
      )}

      {/* ========================= */}
      {/* ACTION */}
      {/* ========================= */}
      <button
        onClick={initiateCase}
        disabled={submitting || (template === 'NONE' && !title)}
        className="w-full py-2 rounded bg-cyan-600 text-sm font-medium disabled:opacity-50"
      >
        {submitting ? 'Creating...' : 'Create Case'}
      </button>

    </div>
  )
}