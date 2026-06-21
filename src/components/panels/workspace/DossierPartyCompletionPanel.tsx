'use client'

import { useMemo, useState } from 'react'

type DossierParty = {
  id: string
  role: string
  legalName: string
  representative: string | null
  country: string | null
  notes: string | null
}

type PartyResponse = {
  ok?: boolean
  party?: DossierParty
  error?: string
  message?: string
}

type PartyDraft = {
  legalName: string
  representative: string
  country: string
  notes: string
}

type Props = {
  parties: DossierParty[]
  onPartyChanged?: () => void
}

function toInputValue(value: string | null | undefined) {
  return value ?? ''
}

function normalizeInput(value: string) {
  const trimmed = value.trim()

  return trimmed.length > 0
    ? trimmed
    : null
}

function getPartyCompletion(party: DossierParty) {
  const fields = [
    party.legalName,
    party.representative,
    party.country,
  ]

  return fields.filter((value) =>
    Boolean(value && value.trim().length > 0)
  ).length
}

function getPartyTone(party: DossierParty) {
  const completion = getPartyCompletion(party)

  if (completion === 3) {
    return {
      label: 'Complete',
      tone: 'border-emerald-800 text-emerald-300',
    }
  }

  if (completion >= 2) {
    return {
      label: 'Partial',
      tone: 'border-amber-800 text-amber-300',
    }
  }

  return {
    label: 'Needs Review',
    tone: 'border-red-900 text-red-300',
  }
}

function roleLabel(role: string) {
  return role
    .split('_')
    .map((part) =>
      part.charAt(0) + part.slice(1).toLowerCase()
    )
    .join(' ')
}

async function readJsonResponse(
  response: Response
): Promise<PartyResponse> {
  const text = await response.text()

  if (!text.trim()) {
    return {
      ok: false,
      error: `EMPTY_RESPONSE_${response.status}`,
    }
  }

  try {
    return JSON.parse(text) as PartyResponse
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

export function DossierPartyCompletionPanel({
  parties,
  onPartyChanged,
}: Props) {
  const [editingPartyId, setEditingPartyId] =
    useState<string | null>(null)
  const [draft, setDraft] = useState<PartyDraft>({
    legalName: '',
    representative: '',
    country: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] =
    useState<string | null>(null)
  const [savedAt, setSavedAt] =
    useState<string | null>(null)

  const editingParty = useMemo(
    () =>
      editingPartyId
        ? parties.find((party) => party.id === editingPartyId) ??
          null
        : null,
    [editingPartyId, parties]
  )

  const completeCount = parties.filter(
    (party) => getPartyCompletion(party) === 3
  ).length

  function beginEdit(party: DossierParty) {
    setEditingPartyId(party.id)
    setError(null)
    setSavedAt(null)
    setDraft({
      legalName: party.legalName,
      representative: toInputValue(party.representative),
      country: toInputValue(party.country),
      notes: toInputValue(party.notes),
    })
  }

  function resetDraft() {
    setEditingPartyId(null)
    setDraft({
      legalName: '',
      representative: '',
      country: '',
      notes: '',
    })
  }

  function updateDraft(
    key: keyof PartyDraft,
    value: string
  ) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function saveParty() {
    if (!editingParty) return

    setSaving(true)
    setError(null)
    setSavedAt(null)

    const payload = {
      legalName: normalizeInput(draft.legalName),
      representative: normalizeInput(draft.representative),
      country: normalizeInput(draft.country),
      notes: normalizeInput(draft.notes),
    }

    if (!payload.legalName) {
      setSaving(false)
      setError('Legal name is required.')
      return
    }

    try {
      const response = await fetch(
        `/api/admin/control-center/dossier-parties/${editingParty.id}`,
        {
          method: 'PATCH',
          cache: 'no-store',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      )

      const data = await readJsonResponse(response)

      if (!response.ok || !data.ok || !data.party) {
        throw new Error(
          data.message ??
            data.error ??
            'Unable to save party record.'
        )
      }

      setSavedAt(new Date().toLocaleTimeString())
      resetDraft()
      onPartyChanged?.()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save party record.'
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
            Party Completion
          </div>

          <h3 className="mt-1 text-lg font-semibold text-white">
            Dossier Party Records
          </h3>

          <p className="mt-1 max-w-3xl text-xs leading-5 text-neutral-500">
            Internal operator controls for party identity,
            representatives, country, and authority notes used by
            dossier documents and readiness gates.
          </p>
        </div>

        <div className="rounded border border-neutral-800 bg-black/40 px-3 py-2 text-right">
          <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            {parties.length} parties
          </div>

          <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-neutral-200">
            {completeCount} complete
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded border border-red-900 bg-red-950/20 p-3 text-xs text-red-300">
          {error}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_1.15fr]">
        <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
          <h4 className="text-sm font-semibold text-white">
            Party Records
          </h4>

          {parties.length === 0 ? (
            <div className="mt-4 rounded border border-neutral-800 bg-black/20 p-3 text-xs text-neutral-500">
              No party records have been attached to this dossier.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {parties.map((party) => {
                const status = getPartyTone(party)

                return (
                  <div
                    key={party.id}
                    className="rounded border border-neutral-800 bg-black/30 p-3"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {party.legalName}
                        </div>

                        <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                          {roleLabel(party.role)} ·{' '}
                          {getPartyCompletion(party)}/3 fields
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${status.tone}`}
                        >
                          {status.label}
                        </span>

                        <button
                          type="button"
                          onClick={() => beginEdit(party)}
                          className="rounded border border-neutral-700 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-300 hover:border-neutral-400 hover:text-white"
                        >
                          Edit
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs text-neutral-400 md:grid-cols-2">
                      <div>
                        <span className="text-neutral-600">
                          Representative:
                        </span>{' '}
                        {party.representative ?? '—'}
                      </div>

                      <div>
                        <span className="text-neutral-600">
                          Country:
                        </span>{' '}
                        {party.country ?? '—'}
                      </div>

                      {party.notes ? (
                        <div className="md:col-span-2">
                          <span className="text-neutral-600">
                            Notes:
                          </span>{' '}
                          {party.notes}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-white">
                {editingParty
                  ? 'Edit Party'
                  : 'Select Party'}
              </h4>

              <p className="mt-1 text-xs text-neutral-500">
                {editingParty
                  ? `Editing ${roleLabel(editingParty.role)} party record.`
                  : 'Choose a party record to complete its identity fields.'}
              </p>
            </div>

            {editingParty ? (
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

          {editingParty ? (
            <>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Field
                    label="Legal name"
                    value={draft.legalName}
                    onChange={(value) =>
                      updateDraft('legalName', value)
                    }
                    placeholder="Legal entity / individual name"
                  />
                </div>

                <Field
                  label="Representative"
                  value={draft.representative}
                  onChange={(value) =>
                    updateDraft('representative', value)
                  }
                  placeholder="Authorized representative"
                />

                <Field
                  label="Country"
                  value={draft.country}
                  onChange={(value) =>
                    updateDraft('country', value)
                  }
                  placeholder="USA, Mali, UAE..."
                />

                <div className="md:col-span-2">
                  <Field
                    label="Notes / authority context"
                    value={draft.notes}
                    onChange={(value) =>
                      updateDraft('notes', value)
                    }
                    placeholder="Authority, mandate, KYC, or representative notes..."
                    multiline
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={saveParty}
                  disabled={saving}
                  className="rounded border border-neutral-500 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:border-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? 'Saving Party...'
                    : 'Update Party'}
                </button>

                {savedAt ? (
                  <span className="text-xs text-neutral-500">
                    Saved at {savedAt}
                  </span>
                ) : null}
              </div>
            </>
          ) : (
            <div className="mt-4 rounded border border-neutral-800 bg-black/20 p-3 text-xs text-neutral-500">
              No party selected.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
