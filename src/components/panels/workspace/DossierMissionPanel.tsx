'use client'

type Props = {
  commodity: string | null
  quantityKg: string | null
  origin: string | null
  settlement: string | null
  currentState: string
  nextStates: string[]
}

function formatState(state: string) {
  return state.replace(/_/g, ' ')
}

function getCurrentObjective(
  currentState: string,
  nextStates: string[]
) {
  const nextState =
    nextStates[0] ?? null

  if (!nextState) {
    return 'No immediate objective available. Monitor dossier state and confirm whether closure, archive, or manual review is required.'
  }

  switch (currentState) {
    case 'INTAKE_PENDING':
      return `Prepare dossier for ${formatState(
        nextState
      )}. Confirm parties, commodity, and commercial readiness.`

    case 'KYC_REVIEW':
      return `Complete KYC verification before moving toward ${formatState(
        nextState
      )}.`

    case 'SPA_DRAFTING':
      return `Prepare and validate the SPA package before moving toward ${formatState(
        nextState
      )}.`

    case 'SPA_EXECUTED':
      return `Confirm executed SPA and prepare escrow pathway toward ${formatState(
        nextState
      )}.`

    case 'ESCROW_PENDING':
      return `Confirm escrow setup and funding readiness before moving toward ${formatState(
        nextState
      )}.`

    case 'ESCROW_FUNDED':
      return `Confirm escrow funding and prepare treasury execution toward ${formatState(
        nextState
      )}.`

    case 'TREASURY_PENDING':
      return `Prepare treasury release conditions before moving toward ${formatState(
        nextState
      )}.`

    case 'EXPORT_RELEASED':
      return `Confirm export release and prepare activation toward ${formatState(
        nextState
      )}.`

    case 'EXPORT_ACTIVE':
      return `Track active export execution toward ${formatState(
        nextState
      )}.`

    case 'IN_TRANSIT':
      return `Monitor shipment movement and prepare refinery intake toward ${formatState(
        nextState
      )}.`

    case 'REFINERY_INTAKE':
      return `Confirm refinery receipt and prepare assay workflow toward ${formatState(
        nextState
      )}.`

    case 'REFINERY_ASSAY':
    case 'ASSAY_PENDING':
      return `Track assay completion and prepare settlement pathway toward ${formatState(
        nextState
      )}.`

    case 'SETTLEMENT_PENDING':
      return `Confirm settlement readiness and close commercial obligations toward ${formatState(
        nextState
      )}.`

    default:
      return `Advance dossier toward ${formatState(nextState)}.`
  }
}

function ReadinessPill({
  label,
  ready,
}: {
  label: string
  ready: boolean
}) {
  return (
    <div
      className={
        ready
          ? 'rounded border border-emerald-900 bg-emerald-950/20 px-2 py-1 text-[10px] uppercase tracking-wide text-emerald-300'
          : 'rounded border border-amber-900 bg-amber-950/20 px-2 py-1 text-[10px] uppercase tracking-wide text-amber-300'
      }
    >
      {label} {ready ? 'Present' : 'Pending'}
    </div>
  )
}

export default function DossierMissionPanel({
  commodity,
  quantityKg,
  origin,
  settlement,
  currentState,
  nextStates,
}: Props) {
  const objective =
    getCurrentObjective(currentState, nextStates)

  const nextState =
    nextStates[0] ?? null

  return (
    <div className="rounded-xl border border-neutral-800 bg-black/30 p-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
        Mission Brief
      </div>

      <div className="mt-3 rounded border border-cyan-900/60 bg-cyan-950/10 p-3">
        <div className="text-[10px] uppercase tracking-wide text-cyan-400/70">
          Current Objective
        </div>

        <div className="mt-1 text-sm leading-relaxed text-cyan-100">
          {objective}
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <div className="rounded border border-neutral-800 bg-black/30 p-3">
          <div className="text-[10px] uppercase tracking-wide text-neutral-600">
            Commercial Shape
          </div>

          <div className="mt-2 text-xs text-neutral-300">
            {commodity ?? 'Commodity pending'}
            {' · '}
            {quantityKg ? `${quantityKg} KG` : 'Quantity pending'}
            {' · '}
            {origin ?? 'Origin pending'}
          </div>
        </div>

        <div className="rounded border border-neutral-800 bg-black/30 p-3">
          <div className="text-[10px] uppercase tracking-wide text-neutral-600">
            Next Move
          </div>

          <div className="mt-2 text-xs text-neutral-300">
            {nextState ? formatState(nextState) : 'No next move available'}
          </div>
        </div>

        <div className="rounded border border-neutral-800 bg-black/30 p-3">
          <div className="text-[10px] uppercase tracking-wide text-neutral-600">
            Settlement
          </div>

          <div className="mt-2 text-xs text-neutral-300">
            {settlement ?? 'Pending'}
          </div>
        </div>

        <div className="rounded border border-neutral-800 bg-black/30 p-3">
          <div className="text-[10px] uppercase tracking-wide text-neutral-600">
            Readiness
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <ReadinessPill
              label="Commodity"
              ready={Boolean(commodity)}
            />
            <ReadinessPill
              label="Quantity"
              ready={Boolean(quantityKg)}
            />
            <ReadinessPill
              label="Origin"
              ready={Boolean(origin)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
