'use client'

import { useState } from 'react'

import {
  DOSSIER_DOCUMENT_GROUPS,
  type RequiredDossierDocument,
} from '@/domains/control-center/dossiers/documentRequirements'

type Instrument = {
  id: string
  type: string
  status: string
  version: string
  title: string
}

type TemplateIssue = {
  field: string
  label: string
  status: 'PRESENT' | 'MISSING' | 'WARNING'
  detail: string
}

type RenderPreview = {
  instrumentType: string
  title: string
  renderedText: string
  missingFields: TemplateIssue[]
  warnings: TemplateIssue[]
}

type Props = {
  dossierId: string
  instruments: Instrument[]
  onInstrumentChanged?: () => void
}

function statusTone(status: string) {
  switch (status) {
    case 'EXECUTED':
      return 'border-emerald-900 bg-emerald-950/20 text-emerald-300'

    case 'ACTIVE':
      return 'border-cyan-900 bg-cyan-950/20 text-cyan-300'

    case 'DRAFT':
      return 'border-amber-900 bg-amber-950/20 text-amber-300'

    case 'TEMPLATE':
      return 'border-neutral-700 bg-black/30 text-neutral-300'

    case 'SUPERSEDED':
    case 'ARCHIVED':
      return 'border-neutral-800 bg-black/30 text-neutral-500'

    case 'PENDING':
    default:
      return 'border-red-900 bg-red-950/20 text-red-300'
  }
}

function issueTone(status: TemplateIssue['status']) {
  switch (status) {
    case 'MISSING':
      return 'border-red-900 bg-red-950/20 text-red-300'

    case 'WARNING':
      return 'border-amber-900 bg-amber-950/20 text-amber-300'

    case 'PRESENT':
    default:
      return 'border-emerald-900 bg-emerald-950/20 text-emerald-300'
  }
}

function getDocumentStatus(
  document: RequiredDossierDocument,
  instruments: Instrument[]
) {
  if (!document.instrumentType) {
    return {
      label: 'PENDING',
      tone: statusTone('PENDING'),
      instrument: null,
    }
  }

  const instrument = instruments.find(
    (item) => item.type === document.instrumentType
  )

  if (!instrument) {
    return {
      label: 'PENDING',
      tone: statusTone('PENDING'),
      instrument: null,
    }
  }

  return {
    label: instrument.status,
    tone: statusTone(instrument.status),
    instrument,
  }
}

function getSummary(instruments: Instrument[]) {
  const requiredDocuments =
    DOSSIER_DOCUMENT_GROUPS.flatMap(
      (group) => group.documents
    )

  return requiredDocuments.reduce(
    (summary, document) => {
      const status = getDocumentStatus(document, instruments)

      if (
        status.label === 'EXECUTED' ||
        status.label === 'ACTIVE'
      ) {
        summary.ready += 1
      } else if (status.label === 'DRAFT') {
        summary.draft += 1
      } else {
        summary.pending += 1
      }

      return summary
    },
    {
      ready: 0,
      draft: 0,
      pending: 0,
      total: requiredDocuments.length,
    }
  )
}

function SummaryPill({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'emerald' | 'amber' | 'red' | 'neutral'
}) {
  const toneClass = {
    emerald:
      'border-emerald-900 bg-emerald-950/20 text-emerald-300',
    amber:
      'border-amber-900 bg-amber-950/20 text-amber-300',
    red: 'border-red-900 bg-red-950/20 text-red-300',
    neutral:
      'border-neutral-800 bg-black/30 text-neutral-400',
  }[tone]

  return (
    <div
      className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${toneClass}`}
    >
      {value} {label}
    </div>
  )
}

function getStatusActions(instrument: Instrument) {
  switch (instrument.status) {
    case 'DRAFT':
      return [
        {
          label: 'Activate',
          status: 'ACTIVE',
        },
        {
          label: 'Archive',
          status: 'ARCHIVED',
        },
      ]

    case 'ACTIVE':
      return [
        {
          label: 'Mark Executed',
          status: 'EXECUTED',
        },
        {
          label: 'Archive',
          status: 'ARCHIVED',
        },
      ]

    case 'EXECUTED':
    case 'ARCHIVED':
    case 'SUPERSEDED':
    default:
      return []
  }
}

function getPreviewReadiness(preview: RenderPreview) {
  if (preview.missingFields.length > 0) {
    return {
      label: 'Internal Only',
      issuance: 'Not Ready',
      tone:
        'border-red-900 bg-red-950/20 text-red-300',
      detail:
        'Required fields are missing. This draft should not be issued externally.',
    }
  }

  if (preview.warnings.length > 0) {
    return {
      label: 'Review Required',
      issuance: 'Hold for Review',
      tone:
        'border-amber-900 bg-amber-950/20 text-amber-300',
      detail:
        'No required fields are missing, but warnings should be reviewed before external issuance.',
    }
  }

  return {
    label: 'Issuance Ready',
    issuance: 'Ready for Review',
    tone:
      'border-emerald-900 bg-emerald-950/20 text-emerald-300',
    detail:
      'No missing fields or warnings are currently reported by the renderer.',
  }
}

function PreviewReadinessSummary({
  preview,
}: {
  preview: RenderPreview
}) {
  const readiness = getPreviewReadiness(preview)

  return (
    <div className="mt-3 rounded border border-neutral-800 bg-black/30 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-neutral-500">
            Draft Readiness
          </div>

          <div className="mt-1 text-sm font-medium text-white">
            {readiness.label}
          </div>

          <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-neutral-500">
            {readiness.detail}
          </p>
        </div>

        <div
          className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${readiness.tone}`}
        >
          External Issuance: {readiness.issuance}
        </div>
      </div>

      <div className="mt-3 grid gap-2 text-[11px] md:grid-cols-3">
        <div className="rounded border border-red-900/60 bg-red-950/10 p-2 text-red-300">
          {preview.missingFields.length} Missing
        </div>

        <div className="rounded border border-amber-900/60 bg-amber-950/10 p-2 text-amber-300">
          {preview.warnings.length} Warnings
        </div>

        <div className="rounded border border-neutral-800 bg-black/30 p-2 text-neutral-400">
          {preview.instrumentType} Preview
        </div>
      </div>
    </div>
  )
}

function PreviewIssueGroup({
  title,
  issues,
}: {
  title: string
  issues: TemplateIssue[]
}) {
  return (
    <div className="rounded border border-neutral-800 bg-black/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] uppercase tracking-wide text-neutral-500">
          {title}
        </div>

        <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-500">
          {issues.length}
        </div>
      </div>

      {issues.length === 0 ? (
        <div className="mt-3 text-xs text-neutral-600">
          None recorded.
        </div>
      ) : (
        <div className="mt-3 grid gap-2">
          {issues.map((issue) => (
            <div
              key={`${issue.field}-${issue.label}`}
              className={`rounded border p-2 text-xs ${issueTone(
                issue.status
              )}`}
            >
              <div className="font-medium">
                {issue.label}
              </div>
              <div className="mt-1 text-[11px] opacity-80">
                {issue.detail}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-wide opacity-60">
                {issue.field}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RenderPreviewPanel({
  preview,
}: {
  preview: RenderPreview
}) {
  return (
    <div className="mt-3 rounded border border-cyan-900/50 bg-cyan-950/10 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-400">
            Draft Preview
          </div>

          <h4 className="mt-1 text-sm font-medium text-white">
            {preview.title}
          </h4>
        </div>

        <div className="rounded border border-cyan-900 bg-cyan-950/20 px-2 py-1 text-[10px] uppercase tracking-wide text-cyan-300">
          {preview.instrumentType}
        </div>
      </div>

      <PreviewReadinessSummary preview={preview} />

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <PreviewIssueGroup
          title="Missing Fields"
          issues={preview.missingFields}
        />

        <PreviewIssueGroup
          title="Warnings"
          issues={preview.warnings}
        />
      </div>

      <div className="mt-3 rounded border border-neutral-800 bg-black/40 p-3">
        <div className="mb-2 text-[10px] uppercase tracking-wide text-neutral-500">
          Rendered Text
        </div>

        <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed text-neutral-300">
          {preview.renderedText}
        </pre>
      </div>
    </div>
  )
}

export default function DossierDocumentsPanel({
  dossierId,
  instruments,
  onInstrumentChanged,
}: Props) {
  const summary = getSummary(instruments)
  const [creatingType, setCreatingType] =
    useState<string | null>(null)

  const [updatingInstrumentId, setUpdatingInstrumentId] =
    useState<string | null>(null)

  const [previewInstrumentId, setPreviewInstrumentId] =
    useState<string | null>(null)

  const [loadingPreviewId, setLoadingPreviewId] =
    useState<string | null>(null)

  const [previews, setPreviews] = useState<
    Record<string, RenderPreview>
  >({})

  const [error, setError] =
    useState<string | null>(null)

  async function createDraftInstrument(
    document: RequiredDossierDocument
  ) {
    if (!document.instrumentType || creatingType) {
      return
    }

    setCreatingType(document.instrumentType)
    setError(null)

    try {
      const response = await fetch(
        `/api/admin/control-center/dossiers/${dossierId}/instruments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instrumentType: document.instrumentType,
            title: document.label,
          }),
        }
      )

      const payload = (await response.json()) as {
        ok: boolean
        error?: string
      }

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.error ?? 'INSTRUMENT_DRAFT_FAILED'
        )
      }

      onInstrumentChanged?.()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'INSTRUMENT_DRAFT_FAILED'
      )
    } finally {
      setCreatingType(null)
    }
  }

  async function updateInstrumentStatus({
    instrument,
    status,
  }: {
    instrument: Instrument
    status: string
  }) {
    if (updatingInstrumentId) {
      return
    }

    setUpdatingInstrumentId(instrument.id)
    setError(null)

    try {
      const response = await fetch(
        `/api/admin/control-center/instruments/${instrument.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status,
            note: `${instrument.title} moved from ${instrument.status} to ${status} from the document readiness matrix.`,
          }),
        }
      )

      const payload = (await response.json()) as {
        ok: boolean
        error?: string
      }

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.error ?? 'INSTRUMENT_STATUS_UPDATE_FAILED'
        )
      }

      onInstrumentChanged?.()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'INSTRUMENT_STATUS_UPDATE_FAILED'
      )
    } finally {
      setUpdatingInstrumentId(null)
    }
  }

  async function toggleRenderPreview(instrument: Instrument) {
    if (previewInstrumentId === instrument.id) {
      setPreviewInstrumentId(null)
      return
    }

    setPreviewInstrumentId(instrument.id)

    if (previews[instrument.id]) {
      return
    }

    setLoadingPreviewId(instrument.id)
    setError(null)

    try {
      const response = await fetch(
        `/api/admin/control-center/instruments/${instrument.id}/render-preview`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      const payload = (await response.json()) as {
        ok: boolean
        preview?: RenderPreview
        error?: string
      }

      if (!response.ok || !payload.ok || !payload.preview) {
        throw new Error(
          payload.error ?? 'INSTRUMENT_RENDER_PREVIEW_FAILED'
        )
      }

      setPreviews((current) => ({
        ...current,
        [instrument.id]: payload.preview as RenderPreview,
      }))
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'INSTRUMENT_RENDER_PREVIEW_FAILED'
      )
    } finally {
      setLoadingPreviewId(null)
    }
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-black/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
            Documents
          </div>

          <h3 className="mt-1 text-sm font-medium text-white">
            Document Readiness Matrix
          </h3>

          <p className="mt-1 max-w-2xl text-xs text-neutral-500">
            Track required buyer, seller, transaction, and execution documents
            before advancing the dossier.
          </p>
        </div>

        <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400">
          {instruments.length} Instruments
        </div>
      </div>

      {error ? (
        <div className="mt-3 rounded border border-red-900 bg-red-950/20 p-2 text-xs text-red-300">
          {error}
        </div>
      ) : null}

      <div className="mt-3 rounded border border-neutral-800 bg-black/30 p-3">
        <div className="text-[10px] uppercase tracking-wide text-neutral-600">
          Package Readiness
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          <SummaryPill
            label="Ready"
            value={summary.ready}
            tone="emerald"
          />
          <SummaryPill
            label="Draft"
            value={summary.draft}
            tone="amber"
          />
          <SummaryPill
            label="Pending"
            value={summary.pending}
            tone="red"
          />
          <SummaryPill
            label="Required"
            value={summary.total}
            tone="neutral"
          />
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {DOSSIER_DOCUMENT_GROUPS.map((group) => (
          <section
            key={group.title}
            className="rounded border border-neutral-800 bg-black/30 p-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-300">
                  {group.title}
                </h4>

                <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-neutral-500">
                  {group.description}
                </p>
              </div>

              <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-500">
                {group.documents.length} Items
              </div>
            </div>

            <div className="mt-3 grid gap-2">
              {group.documents.map((document) => {
                const status = getDocumentStatus(
                  document,
                  instruments
                )

                const canCreateDraft =
                  Boolean(
                    document.instrumentType &&
                      document.canDraftInstrument
                  ) && !status.instrument

                const isCreating =
                  creatingType === document.instrumentType

                const statusActions = status.instrument
                  ? getStatusActions(status.instrument)
                  : []

                const activePreview =
                  status.instrument &&
                  previewInstrumentId === status.instrument.id
                    ? previews[status.instrument.id]
                    : null

                const previewLoading =
                  status.instrument &&
                  loadingPreviewId === status.instrument.id

                return (
                  <div
                    key={document.key}
                    className="rounded border border-neutral-800 bg-black/30 p-3 text-xs"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-white">
                          {status.instrument?.title ??
                            document.label}
                        </div>

                        <div className="mt-1 text-[10px] uppercase tracking-wide text-neutral-600">
                          {document.instrumentType ??
                            'OPERATIONAL_REQUIREMENT'}
                          {status.instrument
                            ? ` · ${status.instrument.version}`
                            : ''}
                          {' · '}
                          {document.requiredFor}
                        </div>

                        <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-neutral-500">
                          {document.description}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                        <div
                          className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${status.tone}`}
                        >
                          {status.label}
                        </div>

                        {canCreateDraft ? (
                          <button
                            type="button"
                            disabled={Boolean(
                              creatingType ||
                                updatingInstrumentId
                            )}
                            onClick={() =>
                              createDraftInstrument(document)
                            }
                            className="rounded border border-cyan-900 bg-cyan-950/20 px-2 py-1 text-[10px] uppercase tracking-wide text-cyan-300 hover:border-cyan-700 disabled:cursor-not-allowed disabled:border-neutral-800 disabled:text-neutral-600"
                          >
                            {isCreating
                              ? 'Creating...'
                              : 'Create Draft'}
                          </button>
                        ) : null}

                        {status.instrument ? (
                          <button
                            type="button"
                            disabled={Boolean(
                              loadingPreviewId
                            )}
                            onClick={() =>
                              toggleRenderPreview(
                                status.instrument as Instrument
                              )
                            }
                            className="rounded border border-cyan-900 bg-cyan-950/20 px-2 py-1 text-[10px] uppercase tracking-wide text-cyan-300 hover:border-cyan-700 disabled:cursor-not-allowed disabled:border-neutral-800 disabled:text-neutral-600"
                          >
                            {previewLoading
                              ? 'Loading...'
                              : previewInstrumentId ===
                                  status.instrument.id
                                ? 'Hide Preview'
                                : 'Preview Draft'}
                          </button>
                        ) : null}

                        {statusActions.map((action) => (
                          <button
                            key={action.status}
                            type="button"
                            disabled={Boolean(
                              creatingType ||
                                updatingInstrumentId
                            )}
                            onClick={() =>
                              status.instrument
                                ? updateInstrumentStatus({
                                    instrument:
                                      status.instrument,
                                    status:
                                      action.status,
                                  })
                                : undefined
                            }
                            className="rounded border border-neutral-700 bg-black/30 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-300 hover:border-cyan-700 hover:text-cyan-300 disabled:cursor-not-allowed disabled:border-neutral-800 disabled:text-neutral-600"
                          >
                            {updatingInstrumentId ===
                            status.instrument?.id
                              ? 'Updating...'
                              : action.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {previewLoading ? (
                      <div className="mt-3 rounded border border-neutral-800 bg-black/20 p-3 text-xs text-neutral-500">
                        Loading render preview...
                      </div>
                    ) : null}

                    {activePreview ? (
                      <RenderPreviewPanel
                        preview={activePreview}
                      />
                    ) : null}
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
