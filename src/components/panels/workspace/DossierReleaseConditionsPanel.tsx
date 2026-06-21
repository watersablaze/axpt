'use client'

import { useEffect, useMemo, useState } from 'react'

const RELEASE_CONDITION_STATUSES = [
  'PENDING',
  'SATISFIED',
  'WAIVED',
  'BLOCKED',
] as const

type ReleaseConditionStatus =
  typeof RELEASE_CONDITION_STATUSES[number]

type ReleaseCondition = {
  id: string
  dossierId: string
  title: string
  description: string | null
  trigger: string | null
  responsibleParty: string | null
  evidenceRequired: string | null
  status: ReleaseConditionStatus
  satisfiedBy: string | null
  satisfiedAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

type ReleaseConditionDraft = {
  title: string
  description: string
  trigger: string
  responsibleParty: string
  evidenceRequired: string
  status: ReleaseConditionStatus
  notes: string
}

type ReleaseConditionsResponse = {
  ok?: boolean
  releaseConditions?: ReleaseCondition[]
  releaseCondition?: ReleaseCondition
  deletedId?: string
  error?: string
  message?: string
}

type Props = {
  dossierId: string
  onReleaseConditionsChanged?: () => void
}

const EMPTY_DRAFT: ReleaseConditionDraft = {
  title: '',
  description: '',
  trigger: '',
  responsibleParty: '',
  evidenceRequired: '',
  status: 'PENDING',
  notes: '',
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

function formatStatus(status: string) {
  return status
    .split('_')
    .map((part) =>
      part.charAt(0) + part.slice(1).toLowerCase()
    )
    .join(' ')
}

function statusTone(status: string) {
  switch (status) {
    case 'SATISFIED':
      return 'border-emerald-700 text-emerald-300'
    case 'WAIVED':
      return 'border-blue-700 text-blue-300'
    case 'BLOCKED':
      return 'border-red-800 text-red-300'
    default:
      return 'border-amber-800 text-amber-300'
  }
}

async function readJsonResponse(
  response: Response
): Promise<ReleaseConditionsResponse> {
  const text = await response.text()

  if (!text.trim()) {
    return {
      ok: false,
      error: `EMPTY_RESPONSE_${response.status}`,
    }
  }

  try {
    return JSON.parse(text) as ReleaseConditionsResponse
  } catch {
    return {
      ok: false,
      error: `INVALID_JSON_RESPONSE_${response.status}`,
      message: text.slice(0, 180),
    }
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

export function DossierReleaseConditionsPanel({
  dossierId,
  onReleaseConditionsChanged,
}: Props) {
  const [releaseConditions, setReleaseConditions] =
    useState<ReleaseCondition[]>([])
  const [draft, setDraft] =
    useState<ReleaseConditionDraft>(EMPTY_DRAFT)
  const [editingId, setEditingId] =
    useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] =
    useState<string | null>(null)
  const [savedAt, setSavedAt] =
    useState<string | null>(null)

  const editingCondition = useMemo(
    () =>
      editingId
        ? releaseConditions.find(
            (condition) => condition.id === editingId
          ) ?? null
        : null,
    [releaseConditions, editingId]
  )

  const satisfiedCount = releaseConditions.filter(
    (condition) => condition.status === 'SATISFIED'
  ).length

  const openCount = releaseConditions.filter(
    (condition) =>
      condition.status === 'PENDING' ||
      condition.status === 'BLOCKED'
  ).length

  async function loadReleaseConditions() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/admin/control-center/dossiers/${dossierId}/release-conditions`,
        {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include',
        }
      )

      const data = await readJsonResponse(response)

      if (!response.ok || !data.ok || !data.releaseConditions) {
        throw new Error(
          data.message ??
            data.error ??
            'Unable to load release conditions.'
        )
      }

      setReleaseConditions(data.releaseConditions)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load release conditions.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadReleaseConditions()
  }, [dossierId])

  function updateDraft(
    key: keyof ReleaseConditionDraft,
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

  function beginEdit(condition: ReleaseCondition) {
    setEditingId(condition.id)
    setSavedAt(null)
    setError(null)
    setDraft({
      title: condition.title,
      description: toInputValue(condition.description),
      trigger: toInputValue(condition.trigger),
      responsibleParty:
        toInputValue(condition.responsibleParty),
      evidenceRequired:
        toInputValue(condition.evidenceRequired),
      status: RELEASE_CONDITION_STATUSES.includes(
        condition.status
      )
        ? condition.status
        : 'PENDING',
      notes: toInputValue(condition.notes),
    })
  }

  async function saveReleaseCondition() {
    setSaving(true)
    setError(null)
    setSavedAt(null)

    const payload = {
      title: normalizeInput(draft.title),
      description: normalizeInput(draft.description),
      trigger: normalizeInput(draft.trigger),
      responsibleParty:
        normalizeInput(draft.responsibleParty),
      evidenceRequired:
        normalizeInput(draft.evidenceRequired),
      status: draft.status,
      notes: normalizeInput(draft.notes),
    }

    if (!payload.title) {
      setSaving(false)
      setError('Release condition title is required.')
      return
    }

    try {
      const response = await fetch(
        editingId
          ? `/api/admin/control-center/release-conditions/${editingId}`
          : `/api/admin/control-center/dossiers/${dossierId}/release-conditions`,
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

      if (!response.ok || !data.ok || !data.releaseCondition) {
        throw new Error(
          data.message ??
            data.error ??
            'Unable to save release condition.'
        )
      }

      setSavedAt(new Date().toLocaleTimeString())
      resetDraft()
      await loadReleaseConditions()
      onReleaseConditionsChanged?.()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save release condition.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function deleteReleaseCondition(conditionId: string) {
    const confirmed = window.confirm(
      'Delete this release condition?'
    )

    if (!confirmed) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/admin/control-center/release-conditions/${conditionId}`,
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
            'Unable to delete release condition.'
        )
      }

      await loadReleaseConditions()
      onReleaseConditionsChanged?.()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to delete release condition.'
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
            Release Conditions
          </div>

          <h3 className="mt-1 text-lg font-semibold text-white">
            Settlement Release Gate
          </h3>

          <p className="mt-1 max-w-3xl text-xs leading-5 text-neutral-500">
            Operator-defined conditions that must be satisfied,
            waived, or reviewed before settlement instructions
            mature toward issuance.
          </p>
        </div>

        <div className="rounded border border-neutral-800 bg-black/40 px-3 py-2 text-right">
          <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            {releaseConditions.length} conditions
          </div>

          <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-neutral-200">
            {satisfiedCount} satisfied · {openCount} open
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
          Loading release conditions...
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_1.2fr]">
            <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {editingCondition
                      ? 'Edit Release Condition'
                      : 'New Release Condition'}
                  </h4>

                  <p className="mt-1 text-xs text-neutral-500">
                    {editingCondition
                      ? `Editing ${editingCondition.title}.`
                      : 'Define a settlement release gate.'}
                  </p>
                </div>

                {editingCondition ? (
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
                <div className="md:col-span-2">
                  <Field
                    label="Title"
                    value={draft.title}
                    onChange={(value) =>
                      updateDraft('title', value)
                    }
                    placeholder="Final assay confirmed"
                  />
                </div>

                <div className="md:col-span-2">
                  <Field
                    label="Description"
                    value={draft.description}
                    onChange={(value) =>
                      updateDraft('description', value)
                    }
                    placeholder="Describe the release condition."
                    multiline
                  />
                </div>

                <Field
                  label="Trigger"
                  value={draft.trigger}
                  onChange={(value) =>
                    updateDraft('trigger', value)
                  }
                  placeholder="Final assay report, escrow approval..."
                />

                <Field
                  label="Responsible party"
                  value={draft.responsibleParty}
                  onChange={(value) =>
                    updateDraft('responsibleParty', value)
                  }
                  placeholder="Escrow manager, refinery, operator..."
                />

                <div className="md:col-span-2">
                  <Field
                    label="Evidence required"
                    value={draft.evidenceRequired}
                    onChange={(value) =>
                      updateDraft('evidenceRequired', value)
                    }
                    placeholder="Assay report, bank confirmation, release instruction..."
                    multiline
                  />
                </div>

                <label className="space-y-1">
                  <span className="block text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    Status
                  </span>

                  <select
                    value={draft.status}
                    onChange={(event) =>
                      updateDraft('status', event.target.value)
                    }
                    className="w-full rounded border border-neutral-800 bg-black/40 px-3 py-2 text-xs text-neutral-100 outline-none focus:border-neutral-500"
                  >
                    {RELEASE_CONDITION_STATUSES.map(
                      (status) => (
                        <option key={status} value={status}>
                          {formatStatus(status)}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <div className="md:col-span-2">
                  <Field
                    label="Notes"
                    value={draft.notes}
                    onChange={(value) =>
                      updateDraft('notes', value)
                    }
                    placeholder="Operator notes, exceptions, supporting context..."
                    multiline
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={saveReleaseCondition}
                  disabled={saving}
                  className="rounded border border-neutral-500 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:border-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? 'Saving Condition...'
                    : editingCondition
                      ? 'Update Condition'
                      : 'Create Condition'}
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
                Condition Records
              </h4>

              {releaseConditions.length === 0 ? (
                <div className="mt-4 rounded border border-neutral-800 bg-black/20 p-3 text-xs text-neutral-500">
                  No release conditions have been created yet.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {releaseConditions.map((condition) => (
                    <div
                      key={condition.id}
                      className="rounded border border-neutral-800 bg-black/30 p-3"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {condition.title}
                          </div>

                          <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                            {condition.responsibleParty ?? 'Unassigned'}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${statusTone(
                              condition.status
                            )}`}
                          >
                            {formatStatus(condition.status)}
                          </span>

                          <button
                            type="button"
                            onClick={() => beginEdit(condition)}
                            className="rounded border border-neutral-700 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-300 hover:border-neutral-400 hover:text-white"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteReleaseCondition(
                                condition.id
                              )
                            }
                            className="rounded border border-red-900 px-2 py-1 text-[10px] uppercase tracking-wide text-red-300 hover:border-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2 text-xs text-neutral-400">
                        {condition.description ? (
                          <p>{condition.description}</p>
                        ) : null}

                        <div>
                          <span className="text-neutral-600">
                            Trigger:
                          </span>{' '}
                          {condition.trigger ?? '—'}
                        </div>

                        <div>
                          <span className="text-neutral-600">
                            Evidence:
                          </span>{' '}
                          {condition.evidenceRequired ?? '—'}
                        </div>

                        {condition.satisfiedAt ? (
                          <div>
                            <span className="text-neutral-600">
                              Satisfied:
                            </span>{' '}
                            {new Date(
                              condition.satisfiedAt
                            ).toLocaleString()}{' '}
                            by {condition.satisfiedBy ?? '—'}
                          </div>
                        ) : null}

                        {condition.notes ? (
                          <div>
                            <span className="text-neutral-600">
                              Notes:
                            </span>{' '}
                            {condition.notes}
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
