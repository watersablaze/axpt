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
  promotedDossierId: string | null
  createdAt: string
  updatedAt: string
}

type OpportunitiesResponse = {
  ok: boolean
  opportunities?: OpportunityRecord[]
}

type PromoteResponse = {
  ok: boolean
  result?: {
    opportunityId: string
    dossierId: string
    reference: string
    alreadyPromoted: boolean
  }
  error?: string
}

function statusTone(status: string) {
  switch (status) {
    case 'PROMOTED':
      return 'border-emerald-900 bg-emerald-950/20 text-emerald-300'

    case 'APPROVED':
      return 'border-cyan-900 bg-cyan-950/20 text-cyan-300'

    case 'UNDER_REVIEW':
      return 'border-orange-900 bg-orange-950/20 text-orange-300'

    case 'REJECTED':
    case 'ARCHIVED':
      return 'border-neutral-800 bg-black/30 text-neutral-500'

    default:
      return 'border-neutral-800 bg-black/20 text-neutral-400'
  }
}

export default function OpportunityQueuePanel() {
  const [opportunities, setOpportunities] =
    useState<OpportunityRecord[]>([])

  const [promotingId, setPromotingId] =
    useState<string | null>(null)

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

  async function promoteOpportunity(
    opportunityId: string
  ) {
    setPromotingId(opportunityId)
    setError(null)

    try {
      const res = await fetch(
        `/api/admin/control-center/opportunities/${opportunityId}/promote`,
        {
          method: 'POST',
          cache: 'no-store',
          credentials: 'include',
        }
      )

      const json =
        (await res.json()) as PromoteResponse

      if (!res.ok || !json.ok) {
        setError(json.error ?? 'PROMOTION_FAILED')
        return
      }

      await loadOpportunities()
    } catch (err) {
      console.error('[OPPORTUNITY_PROMOTION_FAILED]', err)
      setError('PROMOTION_FAILED')
    } finally {
      setPromotingId(null)
    }
  }

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            Opportunity Queue
          </div>

          <h2 className="mt-1 text-lg font-medium text-white">
            Commercial Pipeline
          </h2>
        </div>

        <button
          type="button"
          onClick={() => void loadOpportunities()}
          className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400 hover:text-neutral-200"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mb-3 rounded border border-red-900 bg-red-950/20 p-2 text-xs text-red-300">
          {error}
        </div>
      ) : null}

      {opportunities.length === 0 ? (
        <div className="rounded border border-neutral-800 bg-black/30 p-2 text-xs text-neutral-500">
          No opportunities in queue.
        </div>
      ) : (
        <div className="space-y-2">
          {opportunities.map((opportunity) => {
            const promoted =
              opportunity.status === 'PROMOTED' ||
              Boolean(opportunity.promotedDossierId)

            return (
              <article
                key={opportunity.id}
                className="rounded border border-neutral-800 bg-black/20 p-3 text-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-white">
                      {opportunity.title}
                    </div>

                    <div className="mt-1 text-[11px] text-neutral-500">
                      {opportunity.commodity ?? 'Commodity unknown'}
                      {' · '}
                      {opportunity.quantityKg ?? 'Qty unknown'} KG
                      {' · '}
                      {opportunity.source}
                    </div>
                  </div>

                  <div
                    className={`shrink-0 rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${statusTone(
                      opportunity.status
                    )}`}
                  >
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

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-neutral-800 pt-2">
                  <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                    {opportunity.promotedDossierId
                      ? `Dossier: ${opportunity.promotedDossierId}`
                      : 'No dossier linked'}
                  </div>

                  <button
                    type="button"
                    disabled={
                      promoted ||
                      promotingId === opportunity.id
                    }
                    onClick={() =>
                      void promoteOpportunity(
                        opportunity.id
                      )
                    }
                    className="rounded border border-cyan-900 bg-cyan-950/20 px-2 py-1 text-[10px] uppercase tracking-wide text-cyan-300 disabled:cursor-not-allowed disabled:border-neutral-800 disabled:bg-black/20 disabled:text-neutral-600"
                  >
                    {promoted
                      ? 'Promoted'
                      : promotingId === opportunity.id
                        ? 'Promoting...'
                        : 'Promote'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
