'use client'

type IncidentAction = {
  id: string
  incidentKey: string
  action: string
  operatorEmail: string | null
  operatorId: string | null
  note: string | null
  createdAt: string
}

type Props = {
  actions: IncidentAction[]
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString()
}

function actionColor(action: string) {
  switch (action) {
    case 'ACKNOWLEDGE':
      return 'text-cyan-300 border-cyan-900 bg-cyan-950/20'

    case 'RESOLVE':
      return 'text-emerald-300 border-emerald-900 bg-emerald-950/20'

    default:
      return 'text-neutral-300 border-neutral-800 bg-neutral-950'
  }
}

export default function IncidentActionPanel({
   actions = [],
   }: Props) {

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            Incident Actions
          </div>

          <h2 className="mt-1 text-lg font-medium text-white">
            Operator History
          </h2>
        </div>

        <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400">
          {actions.length} Logged
        </div>
      </div>

      {actions.length === 0 ? (
        <div className="rounded-lg border border-neutral-800 bg-black/30 p-3 text-sm text-neutral-400">
          No operator actions recorded.
        </div>
      ) : (
        <div className="space-y-2">
          {actions.map((action) => (
            <div
              key={action.id}
              className={`rounded-lg border p-3 ${actionColor(
                action.action
              )}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium">
                  {action.action}
                </div>

                <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                  {formatTime(action.createdAt)}
                </div>
              </div>

              <div className="mt-2 text-xs text-neutral-400">
                {action.incidentKey}
              </div>

              <div className="mt-1 text-xs text-neutral-500">
                Operator:{' '}
                {action.operatorEmail ?? 'unknown'}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}