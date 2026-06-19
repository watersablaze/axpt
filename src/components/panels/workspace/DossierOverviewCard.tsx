'use client'

type Party = {
  id: string
  role: string
  legalName: string
  country: string | null
}

type Props = {
  commodity: string | null
  quantityKg: string | null
  origin: string | null
  refinery: string | null
  settlement: string | null
  parties: Party[]
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
        <div className="mb-2 text-[10px] uppercase tracking-wide text-neutral-500">
          Parties
        </div>

        {parties.length === 0 ? (
          <div className="text-xs text-neutral-500">
            No parties attached.
          </div>
        ) : (
          <div className="space-y-1.5">
            {parties.map((party) => (
              <div
                key={party.id}
                className="rounded border border-neutral-800 bg-black/30 p-2 text-xs"
              >
                <div className="text-white">
                  {party.legalName}
                </div>

                <div className="mt-1 text-[10px] uppercase tracking-wide text-neutral-600">
                  {party.role}
                  {party.country ? ` · ${party.country}` : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
