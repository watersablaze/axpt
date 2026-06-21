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

function getPartyQualityLabel(party: Party) {
  if (party.legalName && party.country && party.representative) {
    return 'Identity Context Present'
  }

  if (party.legalName && party.country) {
    return 'Country Present'
  }

  if (party.legalName) {
    return 'Identity Seeded'
  }

  return 'Needs Review'
}

function getPartyQualityTone(party: Party) {
  if (party.legalName && party.country && party.representative) {
    return 'border-emerald-900 bg-emerald-950/20 text-emerald-300'
  }

  if (party.legalName && party.country) {
    return 'border-cyan-900 bg-cyan-950/20 text-cyan-300'
  }

  if (party.legalName) {
    return 'border-amber-900 bg-amber-950/20 text-amber-300'
  }

  return 'border-red-900 bg-red-950/20 text-red-300'
}

export default function DossierOverviewCard({
  commodity,
  quantityKg,
  origin,
  refinery,
  settlement,
  parties,
}: Props) {
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

                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-neutral-500">
                      {party.country ? (
                        <span>Country: {party.country}</span>
                      ) : (
                        <span>Country: —</span>
                      )}

                      {party.representative ? (
                        <span>
                          Representative: {party.representative}
                        </span>
                      ) : (
                        <span>Representative: —</span>
                      )}
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
