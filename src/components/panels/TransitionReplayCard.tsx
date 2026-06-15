'use client'

export type TransitionAuditRecord = {
  transition?: {
    fromState?: string
    toState?: string
    transitionKey?: string
  }
  actor?: {
    operatorEmail?: string
  }
  approvals?: Array<{
    transitionKey?: string
    requiredRole?: string
    requiredCount?: number
    status?: string
  }>
  generatedArtifacts?: Array<{
    type?: string
    title?: string
    status?: string
    version?: string
  }>
  consequences?: Array<{
    type?: string
    label?: string
    detail?: string
    severity?: string
  }>
}

type Props = {
  auditRecord: TransitionAuditRecord
}

export default function TransitionReplayCard({
  auditRecord,
}: Props) {
  return (
    <div className="mt-2 rounded border border-cyan-900 bg-cyan-950/10 p-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-cyan-300">
            Transition Replay
          </div>

          <div className="mt-1 text-[11px] font-medium text-white">
            {auditRecord.transition?.fromState ?? '—'} →{' '}
            {auditRecord.transition?.toState ?? '—'}
          </div>
        </div>

        <div className="rounded border border-cyan-900 px-2 py-0.5 text-[9px] uppercase tracking-wide text-cyan-300">
          Audit
        </div>
      </div>

      {auditRecord.actor?.operatorEmail ? (
        <div className="mt-2 text-[10px] text-neutral-500">
          Actor: {auditRecord.actor.operatorEmail}
        </div>
      ) : null}

      {auditRecord.generatedArtifacts?.length ? (
        <div className="mt-2">
          <div className="text-[10px] uppercase tracking-wide text-neutral-500">
            Generated Artifacts
          </div>

          <div className="mt-1 space-y-1">
            {auditRecord.generatedArtifacts.map((artifact) => (
              <div
                key={`${artifact.type}-${artifact.version}`}
                className="rounded border border-neutral-800 bg-black/20 px-2 py-1"
              >
                <div className="text-neutral-300">
                  {artifact.title ?? artifact.type ?? 'Generated Artifact'}
                </div>

                <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                  {artifact.status ?? '—'} · {artifact.version ?? '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {auditRecord.approvals?.length ? (
        <div className="mt-2">
          <div className="text-[10px] uppercase tracking-wide text-neutral-500">
            Approval Context
          </div>

          <div className="mt-1 space-y-1">
            {auditRecord.approvals.map((approval) => (
              <div
                key={`${approval.transitionKey}-${approval.requiredRole}`}
                className="text-[11px] text-neutral-400"
              >
                ✓ {approval.requiredRole ?? 'Required Role'} ·{' '}
                {approval.status ?? '—'}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {auditRecord.consequences?.length ? (
        <div className="mt-2">
          <div className="text-[10px] uppercase tracking-wide text-neutral-500">
            Consequences
          </div>

          <div className="mt-1 space-y-1">
            {auditRecord.consequences.map((item) => (
              <div
                key={`${item.type}-${item.label}`}
                className="text-[11px] text-neutral-400"
              >
                ✓ {item.label ?? item.type}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}