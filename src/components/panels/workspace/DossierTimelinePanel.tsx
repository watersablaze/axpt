'use client'

type Props = {
  currentState: string
}

const STATES = [
  'INTAKE_PENDING',
  'KYC_REVIEW',
  'SPA_DRAFTING',
  'SPA_EXECUTED',
  'ESCROW_PENDING',
  'ESCROW_FUNDED',
  'TREASURY_PENDING',
  'EXPORT_RELEASED',
  'EXPORT_ACTIVE',
  'IN_TRANSIT',
  'REFINERY_INTAKE',
  'REFINERY_ASSAY',
  'ASSAY_PENDING',
  'SETTLEMENT_PENDING',
  'SETTLED',
  'CLOSED',
]

export default function DossierTimelinePanel({
  currentState,
}: Props) {
  const currentIndex = STATES.indexOf(currentState)

  return (
    <div className="rounded-xl border border-neutral-800 bg-black/20 p-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
        Commercial Timeline
      </div>

      <div className="mt-3 space-y-2">
        {STATES.map((state, index) => {
          const isCurrent = state === currentState
          const isPast =
            currentIndex >= 0 && index < currentIndex

          return (
            <div
              key={state}
              className="flex items-center gap-2 text-xs"
            >
              <div
                className={
                  isCurrent
                    ? 'h-2.5 w-2.5 rounded-full bg-cyan-300'
                    : isPast
                      ? 'h-2.5 w-2.5 rounded-full bg-emerald-400'
                      : 'h-2.5 w-2.5 rounded-full border border-neutral-700'
                }
              />

              <div
                className={
                  isCurrent
                    ? 'text-cyan-300'
                    : isPast
                      ? 'text-emerald-300'
                      : 'text-neutral-500'
                }
              >
                {state}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
