'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const BANK_COORDINATE_ROLES = [
  'BUYER_REMITTING',
  'SELLER_RECEIVING',
  'ESCROW_TRUST',
  'INTERMEDIARY',
  'OTHER',
] as const

const VERIFICATION_STATUSES = [
  'PENDING_REVIEW',
  'NEEDS_CLARIFICATION',
  'VERIFIED',
  'REJECTED',
] as const

type BankCoordinateRole =
  typeof BANK_COORDINATE_ROLES[number]

type VerificationStatus =
  typeof VERIFICATION_STATUSES[number]

type BankCoordinate = {
  id: string
  dossierId: string
  role: BankCoordinateRole
  label: string
  accountName: string | null
  bankName: string | null
  bankAddress: string | null
  accountNumber: string | null
  routingNumber: string | null
  swiftCode: string | null
  iban: string | null
  currency: string | null
  country: string | null
  notes: string | null
  verificationStatus: string
  verifiedBy: string | null
  verifiedAt: string | null
  createdAt: string
  updatedAt: string
}

type CoordinatesResponse = {
  ok?: boolean
  coordinates?: BankCoordinate[]
  coordinate?: BankCoordinate
  deletedId?: string
  error?: string
  message?: string
}

type CoordinateDraft = {
  role: BankCoordinateRole
  label: string
  accountName: string
  bankName: string
  bankAddress: string
  accountNumber: string
  routingNumber: string
  swiftCode: string
  iban: string
  currency: string
  country: string
  notes: string
  verificationStatus: VerificationStatus
}

type Props = {
  dossierId: string
  onCoordinatesChanged?: () => void
}

const EMPTY_DRAFT: CoordinateDraft = {
  role: 'BUYER_REMITTING',
  label: '',
  accountName: '',
  bankName: '',
  bankAddress: '',
  accountNumber: '',
  routingNumber: '',
  swiftCode: '',
  iban: '',
  currency: 'USD',
  country: '',
  notes: '',
  verificationStatus: 'PENDING_REVIEW',
}

function humanizeRole(role: string) {
  return role
    .split('_')
    .map((part) =>
      part.charAt(0) + part.slice(1).toLowerCase()
    )
    .join(' ')
}

function normalizeInput(value: string) {
  const trimmed = value.trim()

  return trimmed.length > 0
    ? trimmed
    : null
}

function toInputValue(value: string | null | undefined) {
  return value ?? ''
}

async function readJsonResponse(
  response: Response
): Promise<CoordinatesResponse> {
  const text = await response.text()

  if (!text.trim()) {
    return {
      ok: false,
      error: `EMPTY_RESPONSE_${response.status}`,
    }
  }

  try {
    return JSON.parse(text) as CoordinatesResponse
  } catch {
    return {
      ok: false,
      error: `INVALID_JSON_RESPONSE_${response.status}`,
      message: text.slice(0, 180),
    }
  }
}

function getCoordinateCompleteness(
  coordinate: BankCoordinate
) {
  const values = [
    coordinate.accountName,
    coordinate.bankName,
    coordinate.bankAddress,
    coordinate.accountNumber,
    coordinate.routingNumber,
    coordinate.swiftCode,
    coordinate.iban,
    coordinate.currency,
    coordinate.country,
  ]

  return values.filter((value) =>
    Boolean(value && value.trim().length > 0)
  ).length
}

function statusTone(status: string) {
  switch (status) {
    case 'VERIFIED':
      return 'border-emerald-700 text-emerald-300'
    case 'REJECTED':
      return 'border-red-800 text-red-300'
    case 'NEEDS_CLARIFICATION':
      return 'border-amber-700 text-amber-300'
    default:
      return 'border-neutral-700 text-neutral-300'
  }
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  multiline?: boolean
}) {
  return (
    <label className="space-y-1">
      <span className="block text-[10px] uppercase tracking-[0.16em] text-neutral-500">
        {label}
      </span>

      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full resize-y rounded border border-neutral-800 bg-black/40 px-3 py-2 text-xs text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-500"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded border border-neutral-800 bg-black/40 px-3 py-2 text-xs text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-500"
        />
      )}
    </label>
  )
}

export function DossierBankCoordinatesPanel({
  dossierId,
  onCoordinatesChanged,
}: Props) {
  const [coordinates, setCoordinates] = useState<
    BankCoordinate[]
  >([])
  const [draft, setDraft] =
    useState<CoordinateDraft>(EMPTY_DRAFT)
  const [editingId, setEditingId] =
    useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] =
    useState<string | null>(null)
  const [savedAt, setSavedAt] =
    useState<string | null>(null)
  const formRef = useRef<HTMLDivElement | null>(null)

  const editingCoordinate = useMemo(
    () =>
      editingId
        ? coordinates.find(
            (coordinate) => coordinate.id === editingId
          ) ?? null
        : null,
    [coordinates, editingId]
  )

  const verifiedCount = coordinates.filter(
    (coordinate) =>
      coordinate.verificationStatus === 'VERIFIED'
  ).length

  async function loadCoordinates() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/admin/control-center/dossiers/${dossierId}/bank-coordinates`,
        {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include',
        }
      )

      const data = await readJsonResponse(response)

      if (!response.ok || !data.ok || !data.coordinates) {
        throw new Error(
          data.message ??
            data.error ??
            'Unable to load bank coordinates.'
        )
      }

      setCoordinates(data.coordinates)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load bank coordinates.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCoordinates()
  }, [dossierId])

  function updateDraft(
    key: keyof CoordinateDraft,
    value: string
  ) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function resetDraft() {
    setDraft(EMPTY_DRAFT)
    setEditingId(null)
  }

  function beginEdit(coordinate: BankCoordinate) {
    setEditingId(coordinate.id)
    setSavedAt(null)
    setError(null)
    setDraft({
      role: coordinate.role,
      label: coordinate.label,
      accountName: toInputValue(coordinate.accountName),
      bankName: toInputValue(coordinate.bankName),
      bankAddress: toInputValue(coordinate.bankAddress),
      accountNumber: toInputValue(coordinate.accountNumber),
      routingNumber: toInputValue(coordinate.routingNumber),
      swiftCode: toInputValue(coordinate.swiftCode),
      iban: toInputValue(coordinate.iban),
      currency: toInputValue(coordinate.currency),
      country: toInputValue(coordinate.country),
      notes: toInputValue(coordinate.notes),
      verificationStatus:
        VERIFICATION_STATUSES.includes(
          coordinate.verificationStatus as VerificationStatus
        )
          ? coordinate.verificationStatus as VerificationStatus
          : 'PENDING_REVIEW',
    })

    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }

  async function saveCoordinate() {
    setSaving(true)
    setError(null)
    setSavedAt(null)

    const payload = {
      role: draft.role,
      label: normalizeInput(draft.label),
      accountName: normalizeInput(draft.accountName),
      bankName: normalizeInput(draft.bankName),
      bankAddress: normalizeInput(draft.bankAddress),
      accountNumber: normalizeInput(draft.accountNumber),
      routingNumber: normalizeInput(draft.routingNumber),
      swiftCode: normalizeInput(draft.swiftCode),
      iban: normalizeInput(draft.iban),
      currency: normalizeInput(draft.currency),
      country: normalizeInput(draft.country),
      notes: normalizeInput(draft.notes),
      verificationStatus: draft.verificationStatus,
    }

    if (!payload.label) {
      setSaving(false)
      setError('Coordinate label is required.')
      return
    }

    try {
      const response = await fetch(
        editingId
          ? `/api/admin/control-center/bank-coordinates/${editingId}`
          : `/api/admin/control-center/dossiers/${dossierId}/bank-coordinates`,
        {
          method: editingId ? 'PATCH' : 'POST',
          cache: 'no-store',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      )

      const data = await readJsonResponse(response)

      if (!response.ok || !data.ok || !data.coordinate) {
        throw new Error(
          data.message ??
            data.error ??
            'Unable to save bank coordinate.'
        )
      }

      setSavedAt(new Date().toLocaleTimeString())
      resetDraft()
      await loadCoordinates()
      onCoordinatesChanged?.()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save bank coordinate.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function deleteCoordinate(coordinateId: string) {
    const confirmed = window.confirm(
      'Delete this bank coordinate record?'
    )

    if (!confirmed) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/admin/control-center/bank-coordinates/${coordinateId}`,
        {
          method: 'DELETE',
          cache: 'no-store',
          credentials: 'include',
        }
      )

      const data = await readJsonResponse(response)

      if (!response.ok || !data.ok) {
        throw new Error(
          data.message ??
            data.error ??
            'Unable to delete bank coordinate.'
        )
      }

      await loadCoordinates()
      onCoordinatesChanged?.()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to delete bank coordinate.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-xl border border-neutral-800 bg-black/30 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-500">
            Banking Coordinates
          </div>

          <h3 className="mt-1 text-lg font-semibold text-white">
            Internal Coordinate Vault
          </h3>

          <p className="mt-1 max-w-3xl text-xs leading-5 text-neutral-500">
            Operator-only banking and settlement coordinate records
            used to mature Annex B without exposing sensitive details
            through public intake.
          </p>
        </div>

        <div className="rounded border border-neutral-800 bg-black/40 px-3 py-2 text-right">
          <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            {coordinates.length} records
          </div>

          <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-neutral-200">
            {verifiedCount} verified
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded border border-red-900 bg-red-950/20 p-3 text-xs text-red-300">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-4 rounded border border-neutral-800 bg-black/20 p-3 text-xs text-neutral-500">
          Loading bank coordinates...
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_1.2fr]">
            <div
              ref={formRef}
              className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {editingCoordinate
                      ? 'Edit Coordinate'
                      : 'New Coordinate'}
                  </h4>
                  <p className="mt-1 text-xs text-neutral-500">
                    {editingCoordinate
                      ? `Editing ${editingCoordinate.label}. Changes will update this coordinate record.`
                      : 'Store enough structure for operator review.'}
                  </p>
                </div>

                {editingCoordinate ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded border border-amber-800 bg-amber-950/20 px-2 py-1 text-[10px] uppercase tracking-wide text-amber-300">
                      Editing
                    </span>

                    <button
                      type="button"
                      onClick={resetDraft}
                      className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400 hover:border-neutral-500 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="block text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    Role
                  </span>

                  <select
                    value={draft.role}
                    onChange={(event) =>
                      updateDraft('role', event.target.value)
                    }
                    className="w-full rounded border border-neutral-800 bg-black/40 px-3 py-2 text-xs text-neutral-100 outline-none focus:border-neutral-500"
                  >
                    {BANK_COORDINATE_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {humanizeRole(role)}
                      </option>
                    ))}
                  </select>
                </label>

                <Field
                  label="Label"
                  value={draft.label}
                  onChange={(value) =>
                    updateDraft('label', value)
                  }
                  placeholder="Seller receiving account"
                />

                <Field
                  label="Account name"
                  value={draft.accountName}
                  onChange={(value) =>
                    updateDraft('accountName', value)
                  }
                  placeholder="Account holder / beneficiary"
                />

                <Field
                  label="Bank name"
                  value={draft.bankName}
                  onChange={(value) =>
                    updateDraft('bankName', value)
                  }
                  placeholder="Bank name"
                />

                <div className="md:col-span-2">
                  <Field
                    label="Bank address"
                    value={draft.bankAddress}
                    onChange={(value) =>
                      updateDraft('bankAddress', value)
                    }
                    placeholder="Bank branch / address"
                  />
                </div>

                <Field
                  label="Account number"
                  value={draft.accountNumber}
                  onChange={(value) =>
                    updateDraft('accountNumber', value)
                  }
                  placeholder="Account number"
                />

                <Field
                  label="Routing / ABA"
                  value={draft.routingNumber}
                  onChange={(value) =>
                    updateDraft('routingNumber', value)
                  }
                  placeholder="Routing number"
                />

                <Field
                  label="SWIFT"
                  value={draft.swiftCode}
                  onChange={(value) =>
                    updateDraft('swiftCode', value)
                  }
                  placeholder="SWIFT / BIC"
                />

                <Field
                  label="IBAN"
                  value={draft.iban}
                  onChange={(value) =>
                    updateDraft('iban', value)
                  }
                  placeholder="IBAN"
                />

                <Field
                  label="Currency"
                  value={draft.currency}
                  onChange={(value) =>
                    updateDraft('currency', value)
                  }
                  placeholder="USD"
                />

                <Field
                  label="Country"
                  value={draft.country}
                  onChange={(value) =>
                    updateDraft('country', value)
                  }
                  placeholder="USA"
                />

                <label className="space-y-1">
                  <span className="block text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    Verification status
                  </span>

                  <select
                    value={draft.verificationStatus}
                    onChange={(event) =>
                      updateDraft(
                        'verificationStatus',
                        event.target.value
                      )
                    }
                    className="w-full rounded border border-neutral-800 bg-black/40 px-3 py-2 text-xs text-neutral-100 outline-none focus:border-neutral-500"
                  >
                    {VERIFICATION_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="md:col-span-2">
                  <Field
                    label="Notes"
                    value={draft.notes}
                    onChange={(value) =>
                      updateDraft('notes', value)
                    }
                    placeholder="Verification notes, source, limitations..."
                    multiline
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={saveCoordinate}
                  disabled={saving}
                  className="rounded border border-neutral-500 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:border-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? 'Saving Coordinate...'
                    : editingCoordinate
                      ? 'Update Coordinate'
                      : 'Create Coordinate'}
                </button>

                {savedAt ? (
                  <span className="text-xs text-neutral-500">
                    Saved at {savedAt}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
              <h4 className="text-sm font-semibold text-white">
                Coordinate Records
              </h4>

              {coordinates.length === 0 ? (
                <div className="mt-4 rounded border border-neutral-800 bg-black/20 p-3 text-xs text-neutral-500">
                  No bank coordinate records have been created yet.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {coordinates.map((coordinate) => (
                    <div
                      key={coordinate.id}
                      className="rounded border border-neutral-800 bg-black/30 p-3"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {coordinate.label}
                          </div>

                          <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                            {humanizeRole(coordinate.role)} ·{' '}
                            {getCoordinateCompleteness(coordinate)}/9 fields
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${statusTone(
                              coordinate.verificationStatus
                            )}`}
                          >
                            {coordinate.verificationStatus}
                          </span>

                          <button
                            type="button"
                            onClick={() => beginEdit(coordinate)}
                            className="rounded border border-neutral-700 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-300 hover:border-neutral-400 hover:text-white"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteCoordinate(coordinate.id)
                            }
                            className="rounded border border-red-900 px-2 py-1 text-[10px] uppercase tracking-wide text-red-300 hover:border-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 text-xs text-neutral-400 md:grid-cols-2">
                        <div>
                          <span className="text-neutral-600">
                            Account:
                          </span>{' '}
                          {coordinate.accountName ?? '—'}
                        </div>

                        <div>
                          <span className="text-neutral-600">
                            Bank:
                          </span>{' '}
                          {coordinate.bankName ?? '—'}
                        </div>

                        <div>
                          <span className="text-neutral-600">
                            Account No:
                          </span>{' '}
                          {coordinate.accountNumber ?? '—'}
                        </div>

                        <div>
                          <span className="text-neutral-600">
                            SWIFT:
                          </span>{' '}
                          {coordinate.swiftCode ?? '—'}
                        </div>

                        <div>
                          <span className="text-neutral-600">
                            Routing:
                          </span>{' '}
                          {coordinate.routingNumber ?? '—'}
                        </div>

                        <div>
                          <span className="text-neutral-600">
                            Currency:
                          </span>{' '}
                          {coordinate.currency ?? '—'}
                        </div>

                        {coordinate.notes ? (
                          <div className="md:col-span-2">
                            <span className="text-neutral-600">
                              Notes:
                            </span>{' '}
                            {coordinate.notes}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
