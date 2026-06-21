'use client'

type Props = {
  currentState: string
  nextStates: string[]
  transitionCount: number
  executedInstrumentCount: number
  pendingApprovalCount: number
}

export default function DossierExecutionCard({
  currentState,
  nextStates,
  transitionCount,
  executedInstrumentCount,
  pendingApprovalCount,
}: Props) {
  const proposedMove = nextStates[0] ?? null

  return (
    <div className="rounded-xl border border-neutral-800 bg-black/20 p-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
        Execution Readiness
      </div>

      <h3 className="mt-1 text-sm font-medium text-white">
        State Advancement Cockpit
      </h3>

      <p className="mt-1 max-w-2xl text-xs text-neutral-500">
        Review current position, available movement, approvals, and executed
        instruments before advancing this dossier.
      </p>

      <div className="mt-3 grid gap-2 text-xs md:grid-cols-4">
        <div className="rounded border border-neutral-800 bg-black/30 p-2">
          <div className="text-[10px] uppercase tracking-wide text-neutral-600">
            Current State
          </div>
          <div className="mt-1 text-cyan-300">
            {currentState}
          </div>
        </div>

        <div className="rounded border border-neutral-800 bg-black/30 p-2">
          <div className="text-[10px] uppercase tracking-wide text-neutral-600">
            Proposed Move
          </div>
          <div className="mt-1 text-white">
            {proposedMove ?? '—'}
          </div>
        </div>

        <div className="rounded border border-neutral-800 bg-black/30 p-2">
          <div className="text-[10px] uppercase tracking-wide text-neutral-600">
            Transitions
          </div>
          <div className="mt-1 text-white">
            {transitionCount}
          </div>
        </div>

        <div className="rounded border border-neutral-800 bg-black/30 p-2">
          <div className="text-[10px] uppercase tracking-wide text-neutral-600">
            Pending Approvals
          </div>
          <div
            className={
              pendingApprovalCount > 0
                ? 'mt-1 text-amber-300'
                : 'mt-1 text-emerald-300'
            }
          >
            {pendingApprovalCount}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded border border-neutral-800 bg-black/30 p-2 text-xs">
        <div className="text-[10px] uppercase tracking-wide text-neutral-600">
          Executed Instruments
        </div>
        <div
          className={
            executedInstrumentCount > 0
              ? 'mt-1 text-emerald-300'
              : 'mt-1 text-neutral-500'
          }
        >
          {executedInstrumentCount}
        </div>
      </div>

      <div className="mt-4 border-t border-neutral-800 pt-3">
        <div className="mb-2 text-[10px] uppercase tracking-wide text-neutral-500">
          Available Transitions
        </div>

        {nextStates.length === 0 ? (
          <div className="text-xs text-neutral-500">
            No transitions currently available.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {nextStates.map((state) => (
              <div
                key={state}
                className="rounded border border-cyan-900 bg-cyan-950/20 px-2 py-1 text-[10px] uppercase tracking-wide text-cyan-300"
              >
                {state}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
