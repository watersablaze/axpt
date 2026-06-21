'use client'

import { useEffect, useState } from 'react'

type Props = {
  selectedDossierId?: string | null
  onPromoted?: () => Promise<void>
  onOpenDossier?: (dossierId: string) => void
}

type OpportunitySourceIntake = {
  id: string
  reference: string
  referralCode: string | null
  referredByName: string | null
  referredByCompany: string | null
  submitterName: string
  submitterEmail: string
  promotedAt: string | null
  promotedBy: string | null
}

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
  sourceIntake: OpportunitySourceIntake | null
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

export default function OpportunityQueuePanel({
  selectedDossierId,
  onPromoted,
  onOpenDossier,
}: Props) {
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
      await onPromoted?.()

      if (json.result?.dossierId) {
        onOpenDossier?.(json.result.dossierId)
      }
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
            Opportunity Pipeline
          </div>

          <h2 className="mt-1 text-lg font-medium text-white">
            Commercial Deal FLow 
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400">
            {opportunities.length} Items
          </div>

          <button
            type="button"
            onClick={() => void loadOpportunities()}
            className="rounded border border-neutral-700 bg-black/30 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-300 hover:border-cyan-700 hover:text-cyan-300"
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-3 rounded border border-red-900 bg-red-950/20 p-2 text-xs text-red-300">
          {error}
        </div>
      ) : null}

      {opportunities.length === 0 ? (
        <div className="rounded border border-neutral-800 bg-black/30 p-2 text-xs text-neutral-500">
          No opportunities in the pipeline at this time.
        </div>
      ) : (
        <div className="divide-y divide-neutral-900 rounded-lg border border-neutral-800 bg-black/20">
          {opportunities.map((opportunity) => {
            const promoted =
              opportunity.status === 'PROMOTED' ||
              Boolean(opportunity.promotedDossierId)

            const linkedDossierId =
              opportunity.promotedDossierId ??
              opportunity.dossierId

            const selected =
              Boolean(linkedDossierId) &&
              linkedDossierId === selectedDossierId

            return (
              <div
                key={opportunity.id}
                className={
                  selected
                    ? 'grid grid-cols-[1fr_auto_auto] items-center gap-3 bg-cyan-950/10 px-3 py-2 text-xs'
                    : 'grid grid-cols-[1fr_auto_auto] items-center gap-3 px-3 py-2 text-xs'
                }
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-white">
                    {opportunity.title}
                  </div>

                  <div className="mt-1 truncate text-[11px] text-neutral-500">
                    {opportunity.commodity ?? 'Commodity unknown'}
                    {' · '}
                    {opportunity.quantityKg ?? 'Qty unknown'} KG
                    {' · '}
                    {opportunity.origin ?? 'Origin unknown'}
                    {opportunity.destination
                      ? ` → ${opportunity.destination}`
                      : ''}
                  </div>

                    {opportunity.sourceIntake ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide">
                      <a
                        href={`/admin/transaction-intakes/${opportunity.sourceIntake.id}`}
                        className="rounded border border-emerald-900 bg-emerald-950/20 px-2 py-1 text-emerald-300 hover:border-emerald-700 hover:text-emerald-200"
                      >
                        From Intake {opportunity.sourceIntake.reference}
                      </a>

                      {opportunity.sourceIntake.referralCode ? (
                        <span className="rounded border border-neutral-800 bg-black/30 px-2 py-1 text-neutral-400">
                          Ref {opportunity.sourceIntake.referralCode}
                        </span>
                      ) : null}

                      {opportunity.sourceIntake.referredByName ? (
                        <span className="rounded border border-neutral-800 bg-black/30 px-2 py-1 text-neutral-400">
                          By {opportunity.sourceIntake.referredByName}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div
                  className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${statusTone(
                    opportunity.status
                  )}`}
                >
                  {opportunity.status}
                </div>

                <div className="flex items-center gap-2">
                  {linkedDossierId ? (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenDossier?.(linkedDossierId)
                      }
                      className="rounded border border-neutral-700 bg-black/30 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-300 hover:border-cyan-700 hover:text-cyan-300"
                    >
                      {selected ? 'Active' : 'Open'}
                    </button>
                  ) : (
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
                      {promotingId === opportunity.id
                        ? 'Promoting...'
                        : 'Promote'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
