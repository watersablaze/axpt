'use client'

type DossierSnapshot = {
  id: string
  reference: string
  title: string
  state: string
  commodity: string | null
  origin: string | null
  quantityKg: string | null
  refinery: string | null
  settlement: string | null
  parties: Array<{
    id: string
    role: string
    legalName: string
    country: string | null
  }>
  instruments: Array<{
    id: string
    type: string
    status: string
    version: string
    title: string
  }>
  recentEvents: Array<{
    id: string
    eventType: string
    fromState: string | null
    toState: string | null
    message: string
    actor: string | null
    createdAt: string
  }>
}

type Props = {
  dossiers?: DossierSnapshot[]
}

function statusTone(status: string) {
  switch (status) {
    case 'EXECUTED':
    case 'ACTIVE':
      return 'border-emerald-900 bg-emerald-950/20 text-emerald-300'
    case 'DRAFT':
      return 'border-orange-900 bg-orange-950/20 text-orange-300'
    case 'ARCHIVED':
    case 'SUPERSEDED':
      return 'border-neutral-800 bg-neutral-900 text-neutral-500'
    default:
      return 'border-cyan-900 bg-cyan-950/20 text-cyan-300'
  }
}

function formatTime(value?: string) {
  if (!value) return '—'
  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function DossierSnapshotPanel({
  dossiers = [],
}: Props) {
  const primary = dossiers[0]

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            Transaction Dossier
          </div>

          <h2 className="mt-1 text-lg font-medium text-white">
            Digital Mirror
          </h2>
        </div>

        <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400">
          {dossiers.length} Indexed
        </div>
      </div>

      {!primary ? (
        <div className="rounded-lg border border-neutral-800 bg-black/30 p-3 text-sm text-neutral-400">
          No transaction dossiers indexed.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border border-neutral-800 bg-black/30 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                  {primary.reference}
                </div>

                <div className="mt-1 text-sm font-medium text-white">
                  {primary.title}
                </div>
              </div>

              <div className="rounded border border-cyan-900 bg-cyan-950/20 px-2 py-1 text-[10px] uppercase tracking-wide text-cyan-300">
                {primary.state}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-400">
              <div>
                <span className="text-neutral-600">Commodity:</span>{' '}
                {primary.commodity ?? '—'}
              </div>

              <div>
                <span className="text-neutral-600">Quantity:</span>{' '}
                {primary.quantityKg
                  ? `${primary.quantityKg} KG`
                  : '—'}
              </div>

              <div>
                <span className="text-neutral-600">Origin:</span>{' '}
                {primary.origin ?? '—'}
              </div>

              <div>
                <span className="text-neutral-600">Refinery:</span>{' '}
                {primary.refinery ?? '—'}
              </div>

              <div className="col-span-2">
                <span className="text-neutral-600">Settlement:</span>{' '}
                {primary.settlement ?? '—'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-neutral-800 bg-black/20 p-3">
              <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                Parties
              </div>
              <div className="mt-1 text-lg font-medium text-white">
                {primary.parties.length}
              </div>
            </div>

            <div className="rounded-lg border border-neutral-800 bg-black/20 p-3">
              <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                Instruments
              </div>
              <div className="mt-1 text-lg font-medium text-white">
                {primary.instruments.length}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-wide text-neutral-500">
              Instruments
            </div>

            {primary.instruments.map((instrument) => (
              <div
                key={instrument.id}
                className={`rounded border px-2 py-1.5 text-xs ${statusTone(
                  instrument.status
                )}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{instrument.title}</span>
                  <span className="text-[10px] uppercase tracking-wide opacity-70">
                    {instrument.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {primary.recentEvents[0] ? (
            <div className="rounded-lg border border-neutral-800 bg-black/20 p-3 text-xs">
              <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                Latest Dossier Event
              </div>

              <div className="mt-1 text-neutral-300">
                {primary.recentEvents[0].message}
              </div>

              <div className="mt-1 text-[10px] uppercase tracking-wide text-neutral-600">
                {primary.recentEvents[0].eventType} ·{' '}
                {formatTime(primary.recentEvents[0].createdAt)}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}