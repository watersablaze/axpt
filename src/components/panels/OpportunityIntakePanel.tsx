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
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            Opportunity Intake
          </div>

          <h2 className="mt-1 text-lg font-medium text-white">
            Manual Deal Bridge
          </h2>
        </div>

        <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400">
          {opportunities.length} Open
        </div>
      </div>

      <div className="grid gap-2">
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

      <div className="mt-4 space-y-2">
        {opportunities.length === 0 ? (
          <div className="rounded border border-neutral-800 bg-black/30 p-2 text-xs text-neutral-500">
            No opportunities captured yet.
          </div>
        ) : (
          opportunities.map((opportunity) => (
            <article
              key={opportunity.id}
              className="rounded border border-neutral-800 bg-black/20 p-2 text-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-white">
                    {opportunity.title}
                  </div>

                  <div className="mt-1 text-[11px] text-neutral-500">
                    {opportunity.commodity ?? 'Commodity unknown'}
                    {' · '}
                    {opportunity.quantityKg ?? 'Qty unknown'} KG
                  </div>
                </div>

                <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400">
                  {opportunity.status}
                </div>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-neutral-500">
                <div>
                  Buyer: {opportunity.buyerName ?? '—'}
                </div>

                <div>
                  Seller: {opportunity.sellerName ?? '—'}
                </div>

                <div>
                  Origin: {opportunity.origin ?? '—'}
                </div>

                <div>
                  Destination: {opportunity.destination ?? '—'}
                </div>
              </div>

              {opportunity.notes ? (
                <div className="mt-2 rounded border border-neutral-800 bg-black/30 p-2 text-[11px] text-neutral-400">
                  {opportunity.notes}
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  )
}
