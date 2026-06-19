'use client'

import { useEffect, useState } from 'react'

type OpportunityRecord = {
  id: string
  title: string
  source: string
  status: string
  commodity: string | null
  buyerName: string | null
  sellerName: string | null
  origin: string | null
  destination: string | null
  quantityKg: string | null
  notes: string | null
  dossierId: string | null
  createdAt: string
  updatedAt: string
}

type OpportunitiesResponse = {
  ok: boolean
  opportunities?: OpportunityRecord[]
}

type CreateOpportunityResponse = {
  ok: boolean
  opportunity?: OpportunityRecord
  error?: string
}

const EMPTY_FORM = {
  title: '',
  source: 'DIRECT',
  commodity: '',
  buyerName: '',
  sellerName: '',
  origin: '',
  destination: '',
  quantityKg: '',
  notes: '',
}

export default function OpportunityIntakePanel() {
  const [opportunities, setOpportunities] =
    useState<OpportunityRecord[]>([])

  const [form, setForm] =
    useState(EMPTY_FORM)

  const [expanded, setExpanded] =
    useState(false)

  const [submitting, setSubmitting] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  async function loadOpportunities() {
    const res = await fetch(
      '/api/admin/control-center/opportunities',
      {
        cache: 'no-store',
        credentials: 'include',
      }
    )

    const json =
      (await res.json()) as OpportunitiesResponse

    setOpportunities(
      Array.isArray(json.opportunities)
        ? json.opportunities
        : []
    )
  }

  useEffect(() => {
    void loadOpportunities()
  }, [])

  async function submitOpportunity() {
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(
        '/api/admin/control-center/opportunities',
        {
          method: 'POST',
          cache: 'no-store',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: form.title,
            source: form.source,
            commodity: form.commodity || null,
            buyerName: form.buyerName || null,
            sellerName: form.sellerName || null,
            origin: form.origin || null,
            destination: form.destination || null,
            quantityKg: form.quantityKg || null,
            notes: form.notes || null,
          }),
        }
      )

      const json =
        (await res.json()) as CreateOpportunityResponse

      if (!res.ok || !json.ok) {
        setError(json.error ?? 'CREATE_FAILED')
        return
      }

      setForm(EMPTY_FORM)
      setExpanded(false)
      await loadOpportunities()
    } catch (err) {
      console.error('[OPPORTUNITY_CREATE_FAILED]', err)
      setError('CREATE_FAILED')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            Opportunity Intake
          </div>

          <h2 className="mt-1 text-lg font-medium text-white">
            Manual Deal Bridge
          </h2>

          {!expanded ? (
            <div className="mt-1 text-xs text-neutral-500">
              Capture manual deal signals from LOI, WhatsApp, email, or call.
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400">
            {opportunities.length} Open
          </div>

          <button
            type="button"
            onClick={() => {
              setExpanded((value) => !value)
              setError(null)
            }}
            className="rounded border border-neutral-700 bg-black/30 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-300 hover:border-cyan-700 hover:text-cyan-300"
          >
            {expanded ? 'Close' : 'New Opportunity'}
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="mt-3 grid gap-2 border-t border-neutral-800 pt-3">
          <input
            value={form.title}
            onChange={(event) =>
              setForm({
                ...form,
                title: event.target.value,
              })
            }
            placeholder="Opportunity title"
            className="rounded border border-neutral-800 bg-black/30 px-2 py-2 text-xs text-white placeholder:text-neutral-600"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.commodity}
              onChange={(event) =>
                setForm({
                  ...form,
                  commodity: event.target.value,
                })
              }
              placeholder="Commodity"
              className="rounded border border-neutral-800 bg-black/30 px-2 py-2 text-xs text-white placeholder:text-neutral-600"
            />

            <input
              value={form.quantityKg}
              onChange={(event) =>
                setForm({
                  ...form,
                  quantityKg: event.target.value,
                })
              }
              placeholder="Quantity KG"
              className="rounded border border-neutral-800 bg-black/30 px-2 py-2 text-xs text-white placeholder:text-neutral-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.buyerName}
              onChange={(event) =>
                setForm({
                  ...form,
                  buyerName: event.target.value,
                })
              }
              placeholder="Buyer"
              className="rounded border border-neutral-800 bg-black/30 px-2 py-2 text-xs text-white placeholder:text-neutral-600"
            />

            <input
              value={form.sellerName}
              onChange={(event) =>
                setForm({
                  ...form,
                  sellerName: event.target.value,
                })
              }
              placeholder="Seller"
              className="rounded border border-neutral-800 bg-black/30 px-2 py-2 text-xs text-white placeholder:text-neutral-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.origin}
              onChange={(event) =>
                setForm({
                  ...form,
                  origin: event.target.value,
                })
              }
              placeholder="Origin"
              className="rounded border border-neutral-800 bg-black/30 px-2 py-2 text-xs text-white placeholder:text-neutral-600"
            />

            <input
              value={form.destination}
              onChange={(event) =>
                setForm({
                  ...form,
                  destination: event.target.value,
                })
              }
              placeholder="Destination"
              className="rounded border border-neutral-800 bg-black/30 px-2 py-2 text-xs text-white placeholder:text-neutral-600"
            />
          </div>

          <textarea
            value={form.notes}
            onChange={(event) =>
              setForm({
                ...form,
                notes: event.target.value,
              })
            }
            placeholder="Notes from manual deal, LOI, WhatsApp, email, or call"
            className="min-h-20 rounded border border-neutral-800 bg-black/30 px-2 py-2 text-xs text-white placeholder:text-neutral-600"
          />

          {error ? (
            <div className="rounded border border-red-900 bg-red-950/20 p-2 text-xs text-red-300">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setForm(EMPTY_FORM)
                setExpanded(false)
                setError(null)
              }}
              className="rounded border border-neutral-800 bg-black/20 px-3 py-2 text-xs uppercase tracking-wide text-neutral-400 hover:text-neutral-200"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={submitting || !form.title.trim()}
              onClick={submitOpportunity}
              className="rounded border border-cyan-900 bg-cyan-950/20 px-3 py-2 text-xs uppercase tracking-wide text-cyan-300 disabled:cursor-not-allowed disabled:border-neutral-800 disabled:bg-black/20 disabled:text-neutral-600"
            >
              {submitting
                ? 'Capturing...'
                : 'Capture Opportunity'}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
