'use client'

type GateItem = {
  id: string
  label: string
  passed: boolean
  detail?: string
}

type Props = {
  state: string
}

function getGateItems(state: string): GateItem[] {
  if (state === 'TREASURY_PENDING') {
    return [
      {
        id: 'escrow-confirmation',
        label: 'Escrow confirmation',
        passed: true,
        detail: 'Escrow has been marked funded.',
      },
      {
        id: 'compliance-verification',
        label: 'Compliance verification',
        passed: false,
        detail: 'Compliance package must be reviewed before export release.',
      },
      {
        id: 'refinery-coordination',
        label: 'Refinery coordination',
        passed: false,
        detail: 'Refinery coordination documents are required.',
      },
    ]
  }

  if (state === 'ESCROW_FUNDED') {
    return [
      {
        id: 'treasury-readiness',
        label: 'Treasury readiness',
        passed: false,
        detail: 'Treasury review must begin before export release.',
      },
    ]
  }

  return [
    {
      id: 'baseline',
      label: 'No active artifact gate',
      passed: true,
      detail: 'Current dossier state has no blocking artifact requirements.',
    },
  ]
}

function gateTone(passed: boolean) {
  return passed
    ? 'border-emerald-900 bg-emerald-950/20 text-emerald-300'
    : 'border-orange-900 bg-orange-950/20 text-orange-300'
}

export default function DossierArtifactGatePanel({
  state,
}: Props) {
  const gates = getGateItems(state)
  const blockingCount =
    gates.filter((gate) => !gate.passed).length

  return (
    <div className="rounded-lg border border-neutral-800 bg-black/20 p-3 text-xs">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-neutral-500">
            Artifact Gates
          </div>

          <div className="mt-1 text-sm font-medium text-white">
            Execution Readiness
          </div>
        </div>

        <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400">
          {blockingCount} Blocking
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {gates.map((gate) => (
          <div
            key={gate.id}
            className={`rounded border p-2 ${gateTone(
              gate.passed
            )}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">
                {gate.passed ? '✓' : '✗'} {gate.label}
              </span>

              <span className="text-[10px] uppercase tracking-wide opacity-70">
                {gate.passed ? 'Ready' : 'Required'}
              </span>
            </div>

            {gate.detail ? (
              <div className="mt-1 text-[11px] text-neutral-400">
                {gate.detail}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}