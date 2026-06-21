'use client'

import { useEffect, useMemo, useState } from 'react'

const APPROVAL_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'REVOKED',
] as const

type ApprovalStatus =
  typeof APPROVAL_STATUSES[number]

type DossierInstrument = {
  id: string
  type: string
  status: string
  version: string
  title: string
}

type IssuanceApproval = {
  id: string
  dossierId: string
  instrumentType: string
  instrumentId: string | null
  status: ApprovalStatus
  requestedBy: string | null
  requestedAt: string
  approvedBy: string | null
  approvedAt: string | null
  rejectedBy: string | null
  rejectedAt: string | null
  revokedBy: string | null
  revokedAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

type ApprovalsResponse = {
  ok?: boolean
  approvals?: IssuanceApproval[]
  approval?: IssuanceApproval
  error?: string
  message?: string
}

type Props = {
  dossierId: string
  instruments: DossierInstrument[]
  onApprovalChanged?: () => void
}

function statusTone(status: string) {
  switch (status) {
    case 'APPROVED':
      return 'border-emerald-700 text-emerald-300'
    case 'REJECTED':
      return 'border-red-800 text-red-300'
    case 'REVOKED':
      return 'border-neutral-700 text-neutral-400'
    default:
      return 'border-amber-800 text-amber-300'
  }
}

function formatInstrumentType(value: string) {
  return value
    .replaceAll('_', ' ')
    .replace('ANNEX A DELIVERY', 'Annex A · Delivery')
    .replace('ANNEX B SETTLEMENT', 'Annex B · Settlement')
    .replace('ANNEX C REFINERY', 'Annex C · Refinery')
    .replace('ANNEX D COMPLIANCE', 'Annex D · Compliance')
    .replace('ANNEX E PROCEDURE', 'Annex E · Procedure')
    .replace('ANNEX F FINANCIAL INSTRUMENT', 'Annex F · Financial Instrument')
    .replace('ANNEX G COMPENSATION SCHEDULE', 'Annex G · Compensation Schedule')
}

function normalizeInput(value: string) {
  const trimmed = value.trim()

  return trimmed.length > 0
    ? trimmed
    : null
}

async function readJsonResponse(
  response: Response
): Promise<ApprovalsResponse> {
  const text = await response.text()

  if (!text.trim()) {
    return {
      ok: false,
      error: `EMPTY_RESPONSE_${response.status}`,
    }
  }

  try {
    return JSON.parse(text) as ApprovalsResponse
  } catch {
    return {
      ok: false,
      error: `INVALID_JSON_RESPONSE_${response.status}`,
      message: text.slice(0, 180),
    }
  }
}

export function DossierIssuanceApprovalPanel({
  dossierId,
  instruments,
  onApprovalChanged,
}: Props) {
  const [approvals, setApprovals] =
    useState<IssuanceApproval[]>([])
  const [notesByType, setNotesByType] =
    useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [savingType, setSavingType] =
    useState<string | null>(null)
  const [error, setError] =
    useState<string | null>(null)
  const [savedAt, setSavedAt] =
    useState<string | null>(null)

  const approvalByType = useMemo(() => {
    return approvals.reduce<Record<string, IssuanceApproval>>(
      (map, approval) => {
        map[approval.instrumentType] = approval
        return map
      },
      {}
    )
  }, [approvals])

  const approvedCount = approvals.filter(
    (approval) => approval.status === 'APPROVED'
  ).length

  async function loadApprovals() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/admin/control-center/dossiers/${dossierId}/issuance-approvals`,
        {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include',
        }
      )

      const data = await readJsonResponse(response)

      if (!response.ok || !data.ok || !data.approvals) {
        throw new Error(
          data.message ??
            data.error ??
            'Unable to load issuance approvals.'
        )
      }

      setApprovals(data.approvals)

      setNotesByType(
        data.approvals.reduce<Record<string, string>>(
          (map, approval) => {
            map[approval.instrumentType] =
              approval.notes ?? ''
            return map
          },
          {}
        )
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load issuance approvals.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadApprovals()
  }, [dossierId])

  async function setApproval(
    instrument: DossierInstrument,
    status: ApprovalStatus
  ) {
    setSavingType(instrument.type)
    setError(null)
    setSavedAt(null)

    try {
      const response = await fetch(
        `/api/admin/control-center/dossiers/${dossierId}/issuance-approvals`,
        {
          method: 'POST',
          cache: 'no-store',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instrumentType: instrument.type,
            instrumentId: instrument.id,
            status,
            notes: normalizeInput(
              notesByType[instrument.type] ?? ''
            ),
          }),
        }
      )

      const data = await readJsonResponse(response)

      if (!response.ok || !data.ok || !data.approval) {
        throw new Error(
          data.message ??
            data.error ??
            'Unable to update issuance approval.'
        )
      }

      setSavedAt(new Date().toLocaleTimeString())
      await loadApprovals()
      onApprovalChanged?.()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update issuance approval.'
      )
    } finally {
      setSavingType(null)
    }
  }

  return (
    <section className="rounded-xl border border-neutral-800 bg-black/30 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-500">
            Operator Issuance Approval
          </div>

          <h3 className="mt-1 text-lg font-semibold text-white">
            External Issuance Gate
          </h3>

          <p className="mt-1 max-w-3xl text-xs leading-5 text-neutral-500">
            Final operator seal required before any dossier
            instrument may be treated as externally issuable.
            Renderer readiness is advisory. Approval is
            authorization.
          </p>
        </div>

        <div className="rounded border border-neutral-800 bg-black/40 px-3 py-2 text-right">
          <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            {instruments.length} instruments
          </div>

          <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-neutral-200">
            {approvedCount} approved
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded border border-red-900 bg-red-950/20 p-3 text-xs text-red-300">
          {error}
        </div>
      ) : null}

      {savedAt ? (
        <div className="mt-4 rounded border border-emerald-900 bg-emerald-950/20 p-3 text-xs text-emerald-300">
          Approval updated at {savedAt}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-4 rounded border border-neutral-800 bg-black/20 p-3 text-xs text-neutral-500">
          Loading issuance approvals...
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {instruments.length === 0 ? (
            <div className="rounded border border-neutral-800 bg-black/20 p-3 text-xs text-neutral-500">
              No instruments are available for issuance approval.
            </div>
          ) : (
            instruments.map((instrument) => {
              const approval =
                approvalByType[instrument.type] ?? null
              const status =
                approval?.status ?? 'PENDING'
              const saving =
                savingType === instrument.type

              return (
                <div
                  key={instrument.id}
                  className="rounded border border-neutral-800 bg-neutral-950/70 p-3"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {instrument.title}
                      </div>

                      <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                        {formatInstrumentType(instrument.type)} ·{' '}
                        {instrument.status} · {instrument.version}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${statusTone(
                          status
                        )}`}
                      >
                        {status}
                      </span>

                      {status !== 'APPROVED' ? (
                        <button
                          type="button"
                          onClick={() =>
                            setApproval(instrument, 'APPROVED')
                          }
                          disabled={saving}
                          className="rounded border border-emerald-800 px-2 py-1 text-[10px] uppercase tracking-wide text-emerald-300 hover:border-emerald-400 disabled:opacity-50"
                        >
                          Approve
                        </button>
                      ) : null}

                      {status !== 'REJECTED' ? (
                        <button
                          type="button"
                          onClick={() =>
                            setApproval(instrument, 'REJECTED')
                          }
                          disabled={saving}
                          className="rounded border border-red-900 px-2 py-1 text-[10px] uppercase tracking-wide text-red-300 hover:border-red-500 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      ) : null}

                      {status !== 'REVOKED' ? (
                        <button
                          type="button"
                          onClick={() =>
                            setApproval(instrument, 'REVOKED')
                          }
                          disabled={saving}
                          className="rounded border border-neutral-700 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-300 hover:border-neutral-400 disabled:opacity-50"
                        >
                          Revoke
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="space-y-1">
                      <span className="block text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                        Operator notes
                      </span>

                      <textarea
                        value={notesByType[instrument.type] ?? ''}
                        onChange={(event) =>
                          setNotesByType((current) => ({
                            ...current,
                            [instrument.type]:
                              event.target.value,
                          }))
                        }
                        rows={2}
                        placeholder="Approval, rejection, or revocation notes..."
                        className="w-full resize-y rounded border border-neutral-800 bg-black/40 px-3 py-2 text-xs text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-500"
                      />
                    </label>
                  </div>

                  {approval ? (
                    <div className="mt-3 grid gap-2 text-[11px] text-neutral-500 md:grid-cols-2">
                      <div>
                        Approved by:{' '}
                        {approval.approvedBy ?? '—'}
                      </div>
                      <div>
                        Approved at:{' '}
                        {approval.approvedAt
                          ? new Date(
                              approval.approvedAt
                            ).toLocaleString()
                          : '—'}
                      </div>
                      <div>
                        Rejected by:{' '}
                        {approval.rejectedBy ?? '—'}
                      </div>
                      <div>
                        Revoked by:{' '}
                        {approval.revokedBy ?? '—'}
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })
          )}
        </div>
      )}
    </section>
  )
}
