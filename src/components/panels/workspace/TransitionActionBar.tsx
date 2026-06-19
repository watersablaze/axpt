'use client'

type Props = {
  dossierId: string
  nextStates: string[]
  onTransitioned?: () => Promise<void>
}

export default function TransitionActionBar({
  dossierId,
  nextStates,
  onTransitioned,
}: Props) {
  if (nextStates.length === 0) {
    return null
  }

  async function executeTransition(toState: string) {
    const confirmed = window.confirm(
      `Transition dossier to ${toState}?`
    )

    if (!confirmed) return

    const response = await fetch(
      `/api/admin/control-center/dossiers/${dossierId}/transition`,
      {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toState,
          message: `Dossier transitioned to ${toState}.`,
        }),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      window.alert(
        result.reason ??
          result.error ??
          'Transition failed.'
      )
      return
    }

    await onTransitioned?.()
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-black/20 p-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
        Transition Actions
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {nextStates.map((state) => (
          <button
            key={state}
            type="button"
            onClick={() => void executeTransition(state)}
            className="rounded border border-cyan-900 bg-cyan-950/20 px-2 py-1.5 text-[10px] uppercase tracking-wide text-cyan-300 hover:border-cyan-700"
          >
            Move to {state}
          </button>
        ))}
      </div>
    </div>
  )
}
