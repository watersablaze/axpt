'use client'

import { useState } from 'react'
import DossierArtifactGatePanel from '@/components/panels/DossierArtifactGatePanel'
import DossierApprovalPanel from './DossierApprovalPanel'
import TransitionPreviewPanel, {
  type TransitionPreview,
} from './TransitionPreviewPanel'
import TransitionReplayCard, {
  type TransitionAuditRecord,
} from './TransitionReplayCard'
import type {
  ControlCenterDossier,
} from '@/hooks/useControlCenterOperationalState'

type Props = {
  dossiers?: ControlCenterDossier[]
  onRefresh?: () => Promise<void>
}

function getTransitionAuditRecord(
  metadata: unknown
): TransitionAuditRecord | null {
  if (
    !metadata ||
    typeof metadata !== 'object' ||
    !('transitionAuditRecord' in metadata)
  ) {
    return null
  }

  const value =
    (metadata as {
      transitionAuditRecord?: unknown
    }).transitionAuditRecord

  if (!value || typeof value !== 'object') {
    return null
  }

  return value as TransitionAuditRecord
}

function statusTone(status: string) {
  switch (status) {
    case 'EXECUTED':
    case 'ACTIVE':
      return 'border-emerald-900 bg-emerald-950/20 text-emerald-300'

    case 'DRAFT':
      return 'border-orange-900 bg-orange-950/20 text-orange-300'

    case 'ARCHIVED':
    case 'SUPERSEDED':
      return 'border-neutral-800 bg-neutral-900 text-neutral-500'

    default:
      return 'border-cyan-900 bg-cyan-950/20 text-cyan-300'
  }
}

function stateTone(state: string) {
  switch (state) {
    case 'SETTLED':
    case 'CLOSED':
      return 'border-emerald-900 bg-emerald-950/20 text-emerald-300'

    case 'BLOCKED':
    case 'CANCELLED':
      return 'border-red-900 bg-red-950/20 text-red-300'

    case 'TREASURY_PENDING':
    case 'ESCROW_PENDING':
    case 'ASSAY_PENDING':
      return 'border-orange-900 bg-orange-950/20 text-orange-300'

    default:
      return 'border-cyan-900 bg-cyan-950/20 text-cyan-300'
  }
}

function formatTime(value?: string) {
  if (!value) return '—'

  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function DossierSnapshotPanel({
  dossiers = [],
  onRefresh,
}: Props) {
  const primary = dossiers[0]

  const [transitionPreview, setTransitionPreview] =
    useState<TransitionPreview | null>(null)

  const [previewLoadingState, setPreviewLoadingState] =
    useState<string | null>(null)

  const [executingTransition, setExecutingTransition] =
    useState(false)

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            Transaction Dossier
          </div>

          <h2 className="mt-1 text-lg font-medium text-white">
            Digital Mirror
          </h2>
        </div>

        <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400">
          {dossiers.length} Indexed
        </div>
      </div>

      {!primary ? (
        <div className="rounded-lg border border-neutral-800 bg-black/30 p-3 text-sm text-neutral-400">
          No transaction dossiers indexed.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border border-neutral-800 bg-black/30 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                  {primary.reference}
                </div>

                <div className="mt-1 text-sm font-medium text-white">
                  {primary.title}
                </div>
              </div>

              <div
                className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${stateTone(
                  primary.state
                )}`}
              >
                {primary.state}
              </div>
            </div>

            {primary.nextStates &&
            primary.nextStates.length > 0 ? (
              <div className="mt-4 border-t border-neutral-800 pt-3">
                <div className="mb-2 text-[10px] uppercase tracking-wide text-neutral-500">
                  Available Transitions
                </div>

                <div className="flex flex-wrap gap-2">
                  {primary.nextStates.map((state) => (
                    <button
                      key={state}
                      type="button"
                      onClick={async () => {
                        try {
                          setPreviewLoadingState(state)
                          setTransitionPreview(null)

                          const response = await fetch(
                            `/api/admin/control-center/dossiers/${primary.id}/transition/preview`,
                            {
                              method: 'POST',
                              credentials: 'include',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                toState: state,
                              }),
                            }
                          )

                          const result = await response.json()

                          if (!response.ok) {
                            console.error(
                              '[DOSSIER_TRANSITION_PREVIEW_FAILED]',
                              result
                            )

                            window.alert(
                              result.reason ??
                                result.error ??
                                'Transition preview failed.'
                            )

                            return
                          }

                          setTransitionPreview(result.preview)
                        } catch (err) {
                          console.error(
                            '[DOSSIER_TRANSITION_PREVIEW_REQUEST_FAILED]',
                            err
                          )

                          window.alert(
                            'Transition preview request failed.'
                          )
                        } finally {
                          setPreviewLoadingState(null)
                        }
                      }}
                      className="rounded border border-cyan-900 bg-cyan-950/20 px-2 py-1 text-[10px] uppercase tracking-wide text-cyan-300 hover:border-cyan-700"
                    >
                      {previewLoadingState === state
                        ? 'Previewing…'
                        : `Preview ${state}`}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {transitionPreview ? (
              <div className="mt-3">
                <TransitionPreviewPanel
                  preview={transitionPreview}
                  executing={executingTransition}
                  onCancel={() =>
                    setTransitionPreview(null)
                  }
                  onExecute={async () => {
                    try {
                      setExecutingTransition(true)

                      const response = await fetch(
                        `/api/admin/control-center/dossiers/${primary.id}/transition`,
                        {
                          method: 'PATCH',
                          credentials: 'include',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            toState:
                              transitionPreview.toState,
                            message: `Dossier transitioned to ${transitionPreview.toState}.`,
                          }),
                        }
                      )

                      const result = await response.json()

                      if (!response.ok) {
                        console.error(
                          '[DOSSIER_TRANSITION_BLOCKED]',
                          result
                        )

                        window.alert(
                          result.reason ??
                            result.error ??
                            'Transition blocked.'
                        )

                        return
                      }

                      setTransitionPreview(null)
                      await onRefresh?.()
                    } catch (err) {
                      console.error(
                        '[DOSSIER_TRANSITION_FAILED]',
                        err
                      )

                      window.alert(
                        'Transition execution failed.'
                      )
                    } finally {
                      setExecutingTransition(false)
                    }
                  }}
                />
              </div>
            ) : null}

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-400">
              <div>
                <span className="text-neutral-600">
                  Commodity:
                </span>{' '}
                {primary.commodity ?? '—'}
              </div>

              <div>
                <span className="text-neutral-600">
                  Quantity:
                </span>{' '}
                {primary.quantityKg
                  ? `${primary.quantityKg} KG`
                  : '—'}
              </div>

              <div>
                <span className="text-neutral-600">
                  Origin:
                </span>{' '}
                {primary.origin ?? '—'}
              </div>

              <div>
                <span className="text-neutral-600">
                  Refinery:
                </span>{' '}
                {primary.refinery ?? '—'}
              </div>

              <div className="col-span-2">
                <span className="text-neutral-600">
                  Settlement:
                </span>{' '}
                {primary.settlement ?? '—'}
              </div>
            </div>
          </div>

          <DossierArtifactGatePanel
            gate={primary.artifactGate}
          />

          <DossierApprovalPanel
            dossierId={primary.id}
            requirements={
              primary.approvalRequirements ?? []
            }
            onRefresh={onRefresh}
          />

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-neutral-800 bg-black/20 p-3">
              <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                Parties
              </div>

              <div className="mt-1 text-lg font-medium text-white">
                {primary.parties.length}
              </div>
            </div>

            <div className="rounded-lg border border-neutral-800 bg-black/20 p-3">
              <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                Instruments
              </div>

              <div className="mt-1 text-lg font-medium text-white">
                {primary.instruments.length}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-wide text-neutral-500">
              Instruments
            </div>

            {primary.instruments.map((instrument) => {
              const nextStatuses =
                instrument.status === 'DRAFT'
                  ? ['ACTIVE']
                  : instrument.status === 'ACTIVE'
                    ? ['EXECUTED', 'ARCHIVED']
                    : instrument.status === 'EXECUTED'
                      ? ['ARCHIVED', 'SUPERSEDED']
                      : []

              return (
                <div
                  key={instrument.id}
                  className={`rounded border px-2 py-1.5 text-xs ${statusTone(
                    instrument.status
                  )}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span>{instrument.title}</span>

                        {instrument.notes?.startsWith(
                          'Generated from'
                        ) ? (
                          <span className="rounded border border-cyan-900 bg-cyan-950/20 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-cyan-300">
                            Generated
                          </span>
                        ) : null}
                      </div>

                      {instrument.notes ? (
                        <div className="mt-1 text-[10px] leading-snug text-neutral-500">
                          {instrument.notes}
                        </div>
                      ) : null}
                    </div>

                    <span className="shrink-0 text-[10px] uppercase tracking-wide opacity-70">
                      {instrument.status}
                    </span>
                  </div>

                  {nextStatuses.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5 border-t border-neutral-800 pt-2">
                      {nextStatuses.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={async () => {
                            try {
                              const response = await fetch(
                                `/api/admin/control-center/instruments/${instrument.id}/status`,
                                {
                                  method: 'PATCH',
                                  credentials: 'include',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    status,
                                    note: `${instrument.title} marked ${status}.`,
                                  }),
                                }
                              )

                              const result = await response.json()

                              if (!response.ok) {
                                console.error(
                                  '[INSTRUMENT_STATUS_BLOCKED]',
                                  result
                                )

                                window.alert(
                                  result.error ??
                                    'Instrument status update blocked.'
                                )

                                return
                              }

                              await onRefresh?.()
                            } catch (err) {
                              console.error(
                                '[INSTRUMENT_STATUS_FAILED]',
                                err
                              )

                              window.alert(
                                'Instrument status update failed.'
                              )
                            }
                          }}
                          className="rounded border border-neutral-700 bg-black/30 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-300 hover:border-cyan-700 hover:text-cyan-300"
                        >
                          Mark {status}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>

          {primary.recentEvents.length > 0 ? (
            <div className="rounded-lg border border-neutral-800 bg-black/20 p-3 text-xs">
              <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                Dossier Event Feed
              </div>

              <div className="mt-2 space-y-2">
                {primary.recentEvents.map((event) => {
                  const auditRecord =
                    getTransitionAuditRecord(
                      (event as { metadata?: unknown })
                        .metadata
                    )

                  return (
                    <div
                      key={event.id}
                      className="rounded border border-neutral-800 bg-black/30 p-2"
                    >
                      <div className="text-neutral-300">
                        {event.message}
                      </div>

                      <div className="mt-1 text-[10px] uppercase tracking-wide text-neutral-600">
                        {event.eventType}
                        {event.fromState && event.toState
                          ? ` · ${event.fromState} → ${event.toState}`
                          : ''}{' '}
                        · {formatTime(event.createdAt)}
                      </div>

                      {auditRecord ? (
                        <TransitionReplayCard
                          auditRecord={auditRecord}
                        />
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}