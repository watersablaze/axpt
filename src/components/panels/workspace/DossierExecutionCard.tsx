'use client'

type Props = {
  nextStates: string[]
  transitionCount: number
  executedInstrumentCount: number
  pendingApprovalCount: number
}

export default function DossierExecutionCard({
  nextStates,
  transitionCount,
  executedInstrumentCount,
  pendingApprovalCount,
}: Props) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-black/20 p-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
        Execution
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded border border-neutral-800 bg-black/30 p-2">
          <div className="text-[10px] uppercase tracking-wide text-neutral-600">
            Transitions
          </div>
          <div className="mt-1 text-lg font-medium text-white">
            {transitionCount}
          </div>
        </div>

        <div className="rounded border border-neutral-800 bg-black/30 p-2">
          <div className="text-[10px] uppercase tracking-wide text-neutral-600">
            Executed Instruments
          </div>
          <div className="mt-1 text-lg font-medium text-white">
            {executedInstrumentCount}
          </div>
        </div>

        <div className="rounded border border-neutral-800 bg-black/30 p-2">
          <div className="text-[10px] uppercase tracking-wide text-neutral-600">
            Pending Approvals
          </div>
          <div className="mt-1 text-lg font-medium text-white">
            {pendingApprovalCount}
          </div>
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
