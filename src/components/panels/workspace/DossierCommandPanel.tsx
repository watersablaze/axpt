'use client'

type Props = {
  currentState: string
  nextStates: string[]
  pendingApprovalCount: number
  executedInstrumentCount: number
  onSelectExecution?: () => void
  onSelectDocuments?: () => void
  onSelectTimeline?: () => void
}

export default function DossierCommandPanel({
  currentState,
  nextStates,
  pendingApprovalCount,
  executedInstrumentCount,
  onSelectExecution,
  onSelectDocuments,
  onSelectTimeline,
}: Props) {
  return (
    <div className="rounded-xl border border-cyan-900/60 bg-cyan-950/10 p-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-400">
        Command Surface
      </div>

      <h3 className="mt-1 text-sm font-medium text-white">
        Operator Actions
      </h3>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
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
            Next Moves
          </div>

          <div className="mt-1 text-white">
            {nextStates.length}
          </div>
        </div>

        <div className="rounded border border-neutral-800 bg-black/30 p-2">
          <div className="text-[10px] uppercase tracking-wide text-neutral-600">
            Pending Gates
          </div>

          <div className="mt-1 text-white">
            {pendingApprovalCount}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={onSelectExecution}
          className="rounded border border-cyan-900 bg-cyan-950/20 px-2 py-1.5 text-[10px] uppercase tracking-wide text-cyan-300 hover:border-cyan-700"
        >
          Execute
        </button>

        <button
          type="button"
          onClick={onSelectDocuments}
          className="rounded border border-neutral-700 bg-black/30 px-2 py-1.5 text-[10px] uppercase tracking-wide text-neutral-300 hover:border-cyan-700 hover:text-cyan-300"
        >
          Documents
        </button>

        <button
          type="button"
          onClick={onSelectTimeline}
          className="rounded border border-neutral-700 bg-black/30 px-2 py-1.5 text-[10px] uppercase tracking-wide text-neutral-300 hover:border-cyan-700 hover:text-cyan-300"
        >
          Timeline
        </button>
      </div>

      <div className="mt-3 rounded border border-neutral-800 bg-black/20 p-2 text-[11px] text-neutral-500">
        {executedInstrumentCount} executed instruments recorded.
      </div>
    </div>
  )
}
