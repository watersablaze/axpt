"use client";

type PartyReadinessSummary = {
  complete: number;
  partial: number;
  seeded: number;
  needsReview: number;
};

type DocumentReadinessSummary = {
  ready: number;
  draft: number;
  pending: number;
  total: number;
};

type Props = {
  currentState: string;
  nextStates: string[];
  pendingApprovalCount: number;
  executedInstrumentCount: number;
  partyReadiness: PartyReadinessSummary;
  documentReadiness: DocumentReadinessSummary;
  onSelectExecution?: () => void;
  onSelectDocuments?: () => void;
  onSelectTimeline?: () => void;
};

function readinessText(summary: PartyReadinessSummary) {
  const parts = [
    summary.complete > 0 ? `${summary.complete} complete` : null,
    summary.partial > 0 ? `${summary.partial} partial` : null,
    summary.seeded > 0 ? `${summary.seeded} seeded` : null,
    summary.needsReview > 0 ? `${summary.needsReview} needs review` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "No parties attached";
}

function readinessTone(summary: PartyReadinessSummary) {
  if (summary.needsReview > 0) {
    return "text-red-300";
  }

  if (summary.seeded > 0 || summary.partial > 0) {
    return "text-amber-300";
  }

  if (summary.complete > 0) {
    return "text-emerald-300";
  }

  return "text-neutral-500";
}

function documentReadinessText(summary: DocumentReadinessSummary) {
  return `${summary.ready} ready · ${summary.draft} draft · ${summary.pending} pending`;
}

function documentReadinessTone(summary: DocumentReadinessSummary) {
  if (summary.pending > 0) {
    return "text-amber-300";
  }

  if (summary.draft > 0) {
    return "text-cyan-300";
  }

  if (summary.ready === summary.total && summary.total > 0) {
    return "text-emerald-300";
  }

  return "text-neutral-500";
}

export default function DossierCommandPanel({
  currentState,
  nextStates,
  pendingApprovalCount,
  executedInstrumentCount,
  partyReadiness,
  documentReadiness,
  onSelectExecution,
  onSelectDocuments,
  onSelectTimeline,
}: Props) {
  return (
    <div className="rounded-xl border border-cyan-900/60 bg-cyan-950/10 p-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-400">
        Command Surface
      </div>

      <h3 className="mt-1 text-sm font-medium text-white">Operator Actions</h3>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded border border-neutral-800 bg-black/30 p-2">
          <div className="text-[10px] uppercase tracking-wide text-neutral-600">
            Current State
          </div>

          <div className="mt-1 text-cyan-300">{currentState}</div>
        </div>

        <div className="rounded border border-neutral-800 bg-black/30 p-2">
          <div className="text-[10px] uppercase tracking-wide text-neutral-600">
            Next Moves
          </div>

          <div className="mt-1 text-white">{nextStates.length}</div>
        </div>

        <div className="rounded border border-neutral-800 bg-black/30 p-2">
          <div className="text-[10px] uppercase tracking-wide text-neutral-600">
            Pending Gates
          </div>

          <div className="mt-1 text-white">{pendingApprovalCount}</div>
        </div>
      </div>

      <div className="mt-3 rounded border border-neutral-800 bg-black/20 p-3">
        <div className="text-[10px] uppercase tracking-wide text-neutral-600">
          Readiness Signals
        </div>

        <div className="mt-2 grid gap-2 text-[11px] text-neutral-400 md:grid-cols-3">
          <div>
            Parties:{" "}
            <span className={readinessTone(partyReadiness)}>
              {readinessText(partyReadiness)}
            </span>
          </div>

          <div>
            Readiness:{" "}
            <span className={documentReadinessTone(documentReadiness)}>
              {documentReadinessText(documentReadiness)}
            </span>
          </div>

          <div>
            Execution:{" "}
            <span
              className={
                executedInstrumentCount > 0
                  ? "text-emerald-300"
                  : "text-neutral-500"
              }
            >
              {executedInstrumentCount > 0
                ? `${executedInstrumentCount} instruments executed`
                : "not started"}
            </span>
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
    </div>
  );
}
