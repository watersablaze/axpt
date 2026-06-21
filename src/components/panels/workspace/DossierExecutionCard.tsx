'use client'

type PartyReadinessSummary = {
  complete: number
  partial: number
  seeded: number
  needsReview: number
}

type DocumentReadinessSummary = {
  ready: number
  draft: number
  pending: number
  total: number
}

type Props = {
  currentState: string
  nextStates: string[]
  transitionCount: number
  executedInstrumentCount: number
  pendingApprovalCount: number
  partyReadiness: PartyReadinessSummary
  documentReadiness: DocumentReadinessSummary
}

function getPartyAdvisoryTone(summary: PartyReadinessSummary) {
  if (summary.needsReview > 0) {
    return 'border-red-900 bg-red-950/20 text-red-300'
  }

  if (summary.seeded > 0 || summary.partial > 0) {
    return 'border-amber-900 bg-amber-950/20 text-amber-300'
  }

  if (summary.complete > 0) {
    return 'border-emerald-900 bg-emerald-950/20 text-emerald-300'
  }

  return 'border-neutral-800 bg-black/30 text-neutral-500'
}

function getDocumentAdvisoryTone(summary: DocumentReadinessSummary) {
  if (summary.pending > 0) {
    return 'border-amber-900 bg-amber-950/20 text-amber-300'
  }

  if (summary.draft > 0) {
    return 'border-cyan-900 bg-cyan-950/20 text-cyan-300'
  }

  if (summary.ready === summary.total && summary.total > 0) {
    return 'border-emerald-900 bg-emerald-950/20 text-emerald-300'
  }

  return 'border-neutral-800 bg-black/30 text-neutral-500'
}

function getExecutionAdvisoryTone(executedInstrumentCount: number) {
  return executedInstrumentCount > 0
    ? 'border-emerald-900 bg-emerald-950/20 text-emerald-300'
    : 'border-neutral-800 bg-black/30 text-neutral-500'
}

function getPartyAdvisoryText(summary: PartyReadinessSummary) {
  const parts = [
    `${summary.complete} complete`,
    `${summary.partial} partial`,
    `${summary.seeded} seeded`,
    `${summary.needsReview} review`,
  ]

  return parts.join(' · ')
}

function getDocumentAdvisoryText(summary: DocumentReadinessSummary) {
  return `${summary.ready} ready · ${summary.draft} draft · ${summary.pending} pending`
}

export default function DossierExecutionCard({
  currentState,
  nextStates,
  transitionCount,
  executedInstrumentCount,
  pendingApprovalCount,
  partyReadiness,
  documentReadiness,
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
        Review current position, available movement, formal gates, and advisory
        readiness before advancing this dossier.
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
            Formal Gates
          </div>
          <div
            className={
              pendingApprovalCount > 0
                ? 'mt-1 text-amber-300'
                : 'mt-1 text-emerald-300'
            }
          >
            {pendingApprovalCount > 0
              ? `${pendingApprovalCount} pending`
              : 'Clear'}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded border border-neutral-800 bg-black/30 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-neutral-600">
              Readiness Advisories
            </div>
            <div className="mt-1 text-[11px] text-neutral-500">
              Advisory only. These checks do not block the formal transition
              gate yet.
            </div>
          </div>

          <div
            className={
              documentReadiness.pending > 0 ||
              partyReadiness.seeded > 0 ||
              partyReadiness.partial > 0 ||
              partyReadiness.needsReview > 0
                ? 'rounded border border-amber-900 bg-amber-950/20 px-2 py-1 text-[10px] uppercase tracking-wide text-amber-300'
                : 'rounded border border-emerald-900 bg-emerald-950/20 px-2 py-1 text-[10px] uppercase tracking-wide text-emerald-300'
            }
          >
            {documentReadiness.pending > 0 ||
            partyReadiness.seeded > 0 ||
            partyReadiness.partial > 0 ||
            partyReadiness.needsReview > 0
              ? 'Incomplete'
              : 'Aligned'}
          </div>
        </div>

        <div className="mt-3 grid gap-2 text-[11px] md:grid-cols-3">
          <div
            className={`rounded border p-2 ${getPartyAdvisoryTone(
              partyReadiness
            )}`}
          >
            <div className="text-[10px] uppercase tracking-wide opacity-80">
              Parties
            </div>
            <div className="mt-1">
              {getPartyAdvisoryText(partyReadiness)}
            </div>
          </div>

          <div
            className={`rounded border p-2 ${getDocumentAdvisoryTone(
              documentReadiness
            )}`}
          >
            <div className="text-[10px] uppercase tracking-wide opacity-80">
              Documents
            </div>
            <div className="mt-1">
              {getDocumentAdvisoryText(documentReadiness)}
            </div>
          </div>

          <div
            className={`rounded border p-2 ${getExecutionAdvisoryTone(
              executedInstrumentCount
            )}`}
          >
            <div className="text-[10px] uppercase tracking-wide opacity-80">
              Execution
            </div>
            <div className="mt-1">
              {executedInstrumentCount > 0
                ? `${executedInstrumentCount} executed`
                : 'No executed instruments'}
            </div>
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
