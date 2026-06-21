'use client'

type Party = {
  id: string
  role: string
  legalName: string
  representative: string | null
  country: string | null
  notes: string | null
}

type Props = {
  commodity: string | null
  quantityKg: string | null
  origin: string | null
  refinery: string | null
  settlement: string | null
  parties: Party[]
}

type PartyQuality =
  | 'COMPLETE_CONTEXT'
  | 'PARTIAL_CONTEXT'
  | 'IDENTITY_SEEDED'
  | 'NEEDS_REVIEW'

function roleTone(role: string) {
  switch (role) {
    case 'BUYER':
      return 'border-cyan-900 bg-cyan-950/20 text-cyan-300'

    case 'SELLER':
      return 'border-emerald-900 bg-emerald-950/20 text-emerald-300'

    case 'REFINERY':
      return 'border-purple-900 bg-purple-950/20 text-purple-300'

    case 'ESCROW_AGENT':
    case 'BANK':
      return 'border-amber-900 bg-amber-950/20 text-amber-300'

    case 'LOGISTICS':
    case 'INSPECTOR':
      return 'border-blue-900 bg-blue-950/20 text-blue-300'

    default:
      return 'border-neutral-800 bg-black/30 text-neutral-400'
  }
}

function formatRole(role: string) {
  return role.replace(/_/g, ' ')
}

function getPartyQuality(party: Party): PartyQuality {
  if (party.legalName && party.country && party.representative) {
    return 'COMPLETE_CONTEXT'
  }

  if (
    party.legalName &&
    (party.country || party.representative)
  ) {
    return 'PARTIAL_CONTEXT'
  }

  if (party.legalName) {
    return 'IDENTITY_SEEDED'
  }

  return 'NEEDS_REVIEW'
}

function getPartyQualityLabel(party: Party) {
  switch (getPartyQuality(party)) {
    case 'COMPLETE_CONTEXT':
      return 'Identity Context Present'

    case 'PARTIAL_CONTEXT':
      return 'Partial Context'

    case 'IDENTITY_SEEDED':
      return 'Identity Seeded'

    case 'NEEDS_REVIEW':
    default:
      return 'Needs Review'
  }
}

function getPartyQualityTone(party: Party) {
  switch (getPartyQuality(party)) {
    case 'COMPLETE_CONTEXT':
      return 'border-emerald-900 bg-emerald-950/20 text-emerald-300'

    case 'PARTIAL_CONTEXT':
      return 'border-cyan-900 bg-cyan-950/20 text-cyan-300'

    case 'IDENTITY_SEEDED':
      return 'border-amber-900 bg-amber-950/20 text-amber-300'

    case 'NEEDS_REVIEW':
    default:
      return 'border-red-900 bg-red-950/20 text-red-300'
  }
}

function getPartyReadiness(parties: Party[]) {
  return parties.reduce(
    (summary, party) => {
      const quality = getPartyQuality(party)

      if (quality === 'COMPLETE_CONTEXT') {
        summary.complete += 1
      } else if (quality === 'PARTIAL_CONTEXT') {
        summary.partial += 1
      } else if (quality === 'IDENTITY_SEEDED') {
        summary.seeded += 1
      } else {
        summary.needsReview += 1
      }

      return summary
    },
    {
      complete: 0,
      partial: 0,
      seeded: 0,
      needsReview: 0,
    }
  )
}

function SummaryPill({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'emerald' | 'cyan' | 'amber' | 'red'
}) {
  const toneClass = {
    emerald:
      'border-emerald-900 bg-emerald-950/20 text-emerald-300',
    cyan: 'border-cyan-900 bg-cyan-950/20 text-cyan-300',
    amber:
      'border-amber-900 bg-amber-950/20 text-amber-300',
    red: 'border-red-900 bg-red-950/20 text-red-300',
  }[tone]

  return (
    <div
      className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${toneClass}`}
    >
      {value} {label}
    </div>
  )
}

export default function DossierOverviewCard({
  commodity,
  quantityKg,
  origin,
  refinery,
  settlement,
  parties,
}: Props) {
  const readiness = getPartyReadiness(parties)

  return (
    <div className="rounded-xl border border-neutral-800 bg-black/20 p-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
        Overview
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-400">
        <div>Commodity: {commodity ?? '—'}</div>
        <div>Quantity: {quantityKg ? `${quantityKg} KG` : '—'}</div>
        <div>Origin: {origin ?? '—'}</div>
        <div>Refinery: {refinery ?? '—'}</div>
        <div className="col-span-2">
          Settlement: {settlement ?? '—'}
        </div>
      </div>

      <div className="mt-4 border-t border-neutral-800 pt-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="text-[10px] uppercase tracking-wide text-neutral-500">
            Parties
          </div>

          <div className="rounded border border-neutral-800 bg-black/30 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-500">
            {parties.length} Attached
          </div>
        </div>

        {parties.length > 0 ? (
          <div className="mb-3 rounded border border-neutral-800 bg-black/30 p-3">
            <div className="text-[10px] uppercase tracking-wide text-neutral-600">
              Party Readiness
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <SummaryPill
                label="Complete"
                value={readiness.complete}
                tone="emerald"
              />
              <SummaryPill
                label="Partial"
                value={readiness.partial}
                tone="cyan"
              />
              <SummaryPill
                label="Seeded"
                value={readiness.seeded}
                tone="amber"
              />
              <SummaryPill
                label="Needs Review"
                value={readiness.needsReview}
                tone="red"
              />
            </div>
          </div>
        ) : null}

        {parties.length === 0 ? (
          <div className="rounded border border-neutral-800 bg-black/30 p-3 text-xs text-neutral-500">
            No parties attached yet. Promote from a qualified intake or add
            parties manually before execution advances.
          </div>
        ) : (
          <div className="grid gap-2">
            {parties.map((party) => (
              <div
                key={party.id}
                className="rounded border border-neutral-800 bg-black/30 p-3 text-xs"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div
                        className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${roleTone(
                          party.role
                        )}`}
                      >
                        {formatRole(party.role)}
                      </div>

                      <div
                        className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${getPartyQualityTone(
                          party
                        )}`}
                      >
                        {getPartyQualityLabel(party)}
                      </div>
                    </div>

                    <div className="mt-3 text-sm font-medium text-white">
                      {party.legalName}
                    </div>

                    <div className="mt-2 grid gap-1 text-[11px] text-neutral-500 sm:grid-cols-2">
                      <div>
                        Country:{' '}
                        <span className="text-neutral-400">
                          {party.country ?? '—'}
                        </span>
                      </div>

                      <div>
                        Representative:{' '}
                        <span className="text-neutral-400">
                          {party.representative ?? '—'}
                        </span>
                      </div>
                    </div>

                    {party.notes ? (
                      <div className="mt-3 rounded border border-neutral-800 bg-black/30 p-2 text-[11px] leading-relaxed text-neutral-400">
                        {party.notes}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
