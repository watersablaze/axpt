'use client'

import type {
  ControlCenterTransitionExecution,
} from '@/hooks/useControlCenterOperationalState'

type Props = {
  executions?: ControlCenterTransitionExecution[]
}

function severityTone(
  severity?: string
) {
  switch (severity) {
    case 'CRITICAL':
      return 'border-red-900 bg-red-950/20 text-red-300'

    case 'WARNING':
      return 'border-orange-900 bg-orange-950/20 text-orange-300'

    default:
      return 'border-cyan-900 bg-cyan-950/20 text-cyan-300'
  }
}

export default function TransitionExecutionLedgerPanel({
  executions = [],
}: Props) {
  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            Execution
          </div>

          <h2 className="mt-1 text-lg font-medium text-white">
            Transition Execution Ledger
          </h2>
        </div>

        <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400">
          {executions.length} Records
        </div>
      </div>

      {executions.length === 0 ? (
        <div className="rounded border border-neutral-800 bg-black/30 p-3 text-xs text-neutral-500">
          No transition executions recorded.
        </div>
      ) : (
        <div className="space-y-3">
          {executions.map(
            (execution) => (
              <article
                key={execution.id}
                className="rounded border border-neutral-800 bg-black/20 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-neutral-500">
                      {
                        execution.dossierReference
                      }
                    </div>

                    <div className="mt-1 font-medium text-white">
                      {
                        execution.fromState
                      }{' '}
                      →{' '}
                      {
                        execution.toState
                      }
                    </div>

                    <div className="mt-1 text-[11px] text-neutral-500">
                      {
                        execution.transitionKey
                      }
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-neutral-500">
                    <div>
                      {
                        execution.actor
                      }
                    </div>

                    <div>
                      {new Date(
                        execution.createdAt
                      ).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div>
                    <div className="mb-1 text-[10px] uppercase tracking-wide text-neutral-600">
                      Artifacts
                    </div>

                    <div className="space-y-1">
                      {execution.generatedArtifacts
                        .length === 0 ? (
                        <div className="text-[11px] text-neutral-500">
                          None
                        </div>
                      ) : (
                        execution.generatedArtifacts.map(
                          (
                            artifact,
                            index
                          ) => (
                            <div
                              key={`${execution.id}-artifact-${index}`}
                              className="rounded border border-neutral-800 bg-black/30 p-1.5 text-[11px]"
                            >
                              <div className="text-white">
                                {
                                  artifact.title
                                }
                              </div>

                              <div className="text-neutral-500">
                                {
                                  artifact.status
                                }
                              </div>
                            </div>
                          )
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 text-[10px] uppercase tracking-wide text-neutral-600">
                      Consequences
                    </div>

                    <div className="space-y-1">
                      {execution.consequences
                        .length === 0 ? (
                        <div className="text-[11px] text-neutral-500">
                          None
                        </div>
                      ) : (
                        execution.consequences.map(
                          (
                            consequence,
                            index
                          ) => (
                            <div
                              key={`${execution.id}-consequence-${index}`}
                              className={`rounded border p-1.5 text-[11px] ${severityTone(
                                consequence.severity
                              )}`}
                            >
                              {
                                consequence.label
                              }
                            </div>
                          )
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 text-[10px] uppercase tracking-wide text-neutral-600">
                      Approvals
                    </div>

                    <div className="space-y-1">
                      {execution.approvals
                        .length === 0 ? (
                        <div className="text-[11px] text-neutral-500">
                          None
                        </div>
                      ) : (
                        execution.approvals.map(
                          (
                            approval,
                            index
                          ) => (
                            <div
                              key={`${execution.id}-approval-${index}`}
                              className="rounded border border-neutral-800 bg-black/30 p-1.5 text-[11px]"
                            >
                              <div className="text-white">
                                {
                                  approval.requiredRole
                                }
                              </div>

                              <div className="text-neutral-500">
                                {
                                  approval.status
                                }
                              </div>
                            </div>
                          )
                        )
                      )}
                    </div>
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      )}
    </section>
  )
}