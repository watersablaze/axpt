'use client'

type Instrument = {
  id: string
  type: string
  status: string
  version: string
  title: string
}

type Props = {
  instruments: Instrument[]
}

const EXPECTED_DOCUMENTS = [
  'SPA',
  'ANNEX_A_DELIVERY',
  'ANNEX_B_SETTLEMENT',
  'ANNEX_C_REFINERY',
  'ANNEX_D_COMPLIANCE',
  'ANNEX_E_PROCEDURE',
  'EXPORT_RELEASE_NOTICE',
  'EXPORT_ACTIVATION_NOTICE',
]

export default function DossierDocumentsPanel({
  instruments,
}: Props) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-black/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
            Documents
          </div>

          <h3 className="mt-1 text-sm font-medium text-white">
            Instrument Command Surface
          </h3>
        </div>

        <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400">
          {instruments.length} Attached
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {EXPECTED_DOCUMENTS.map((type) => {
          const instrument = instruments.find(
            (item) => item.type === type
          )

          return (
            <div
              key={type}
              className="rounded border border-neutral-800 bg-black/30 p-2 text-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-white">
                    {instrument?.title ?? type}
                  </div>

                  <div className="mt-1 text-[10px] uppercase tracking-wide text-neutral-600">
                    {type}
                    {instrument
                      ? ` · ${instrument.version}`
                      : ' · not generated'}
                  </div>
                </div>

                <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400">
                  {instrument?.status ?? 'MISSING'}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
