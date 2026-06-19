'use client'

type Props = {
  title: string
  commodity: string | null
  quantityKg: string | null
  origin: string | null
  settlement: string | null
  currentState: string
  nextStates: string[]
}

function getCurrentObjective(
  currentState: string,
  nextStates: string[]
) {
  const nextState =
    nextStates[0] ?? null

  if (!nextState) {
    return 'No immediate objective available.'
  }

  switch (currentState) {
    case 'INTAKE_PENDING':
      return `Prepare dossier for ${nextState}. Confirm parties, commodity, and commercial readiness.`

    case 'KYC_REVIEW':
      return `Complete KYC verification before moving toward ${nextState}.`

    case 'SPA_DRAFTING':
      return `Prepare and validate the SPA package before moving toward ${nextState}.`

    case 'SPA_EXECUTED':
      return `Confirm executed SPA and prepare escrow pathway toward ${nextState}.`

    case 'ESCROW_PENDING':
      return `Confirm escrow setup and funding readiness before moving toward ${nextState}.`

    case 'ESCROW_FUNDED':
      return `Confirm escrow funding and prepare treasury execution toward ${nextState}.`

    case 'TREASURY_PENDING':
      return `Prepare treasury release conditions before moving toward ${nextState}.`

    case 'EXPORT_RELEASED':
      return `Confirm export release and prepare activation toward ${nextState}.`

    case 'EXPORT_ACTIVE':
      return `Track active export execution toward ${nextState}.`

    case 'IN_TRANSIT':
      return `Monitor shipment movement and prepare refinery intake toward ${nextState}.`

    case 'REFINERY_INTAKE':
      return `Confirm refinery receipt and prepare assay workflow toward ${nextState}.`

    case 'REFINERY_ASSAY':
    case 'ASSAY_PENDING':
      return `Track assay completion and prepare settlement pathway toward ${nextState}.`

    case 'SETTLEMENT_PENDING':
      return `Confirm settlement readiness and close commercial obligations toward ${nextState}.`

    default:
      return `Advance dossier toward ${nextState}.`
  }
}

export default function DossierMissionPanel({
  title,
  commodity,
  quantityKg,
  origin,
  settlement,
  currentState,
  nextStates,
}: Props) {
  const objective =
    getCurrentObjective(currentState, nextStates)

  return (
    <div className="rounded-xl border border-neutral-800 bg-black/30 p-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
        Mission Brief
      </div>

      <h3 className="mt-1 text-sm font-medium text-white">
        {title}
      </h3>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-400">
        <div>
          Commodity: {commodity ?? '—'}
        </div>

        <div>
          Quantity: {quantityKg ? `${quantityKg} KG` : '—'}
        </div>

        <div>
          Origin: {origin ?? '—'}
        </div>

        <div>
          Settlement: {settlement ?? '—'}
        </div>
      </div>

      <div className="mt-3 rounded border border-cyan-900/60 bg-cyan-950/10 p-2 text-xs text-cyan-200">
        {objective}
      </div>
    </div>
  )
}
