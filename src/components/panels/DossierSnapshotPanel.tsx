'use client'

import type {
  ControlCenterDossier,
} from '@/hooks/useControlCenterOperationalState'

type Props = {
  dossiers?: ControlCenterDossier[]
  onRefresh?: () => Promise<void>
  onFocusDossier?: (dossierId: string) => void
}

function stateTone(state: string) {
  switch (state) {
    case 'SETTLED':
    case 'CLOSED':
      return 'border-emerald-900 bg-emerald-950/20 text-emerald-300'

    case 'BLOCKED':
    case 'CANCELLED':
      return 'border-red-900 bg-red-950/20 text-red-300'

    case 'TREASURY_PENDING':
    case 'ESCROW_PENDING':
    case 'ASSAY_PENDING':
      return 'border-orange-900 bg-orange-950/20 text-orange-300'

    default:
      return 'border-cyan-900 bg-cyan-950/20 text-cyan-300'
  }
}

export default function DossierSnapshotPanel({
  dossiers = [],
  onRefresh,
  onFocusDossier,
}: Props) {
  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            Transaction Dossiers
          </div>

          <h2 className="mt-1 text-lg font-medium text-white">
            Dossier Index
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400">
            {dossiers.length} Indexed
          </div>

          <button
            type="button"
            onClick={() => void onRefresh?.()}
            className="rounded border border-neutral-700 bg-black/30 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-300 hover:border-cyan-700 hover:text-cyan-300"
          >
            Refresh
          </button>
        </div>
      </div>

      {dossiers.length === 0 ? (
        <div className="rounded-lg border border-neutral-800 bg-black/30 p-3 text-sm text-neutral-400">
          No transaction dossiers indexed.
        </div>
      ) : (
        <div className="space-y-2">
          {dossiers.map((dossier) => (
            <article
              key={dossier.id}
              className="rounded-lg border border-neutral-800 bg-black/20 p-2 text-xs"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-[10px] uppercase tracking-wide text-neutral-500">
                    {dossier.reference}
                  </div>

                  <div className="mt-1 truncate font-medium text-white">
                    {dossier.title}
                  </div>

                  <div className="mt-1 text-[11px] text-neutral-500">
                    {dossier.commodity ?? 'Commodity unknown'}
                    {' · '}
                    {dossier.quantityKg
                      ? `${dossier.quantityKg} KG`
                      : 'Qty unknown'}
                    {' · '}
                    {dossier.origin ?? 'Origin unknown'}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onFocusDossier?.(dossier.id)
                    }
                    className="rounded border border-neutral-700 bg-black/30 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-300 hover:border-cyan-700 hover:text-cyan-300"
                  >
                    Open
                  </button>

                  <div
                    className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${stateTone(
                      dossier.state
                    )}`}
                  >
                    {dossier.state}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
