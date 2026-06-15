'use client'

import type {
  ControlCenterOperatorActivity,
} from '@/hooks/useControlCenterOperationalState'

type Props = {
  activity?: ControlCenterOperatorActivity[]
}

function formatTime(value?: string) {
  if (!value) return '—'

  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function eventLabel(activity: ControlCenterOperatorActivity) {
  if (activity.fromState && activity.toState) {
    return `${activity.fromState} → ${activity.toState}`
  }

  return activity.message
}

export default function OperatorActivityLedgerPanel({
  activity = [],
}: Props) {
  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            Operator Activity
          </div>

          <h2 className="mt-1 text-lg font-medium text-white">
            Action Ledger
          </h2>
        </div>

        <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400">
          {activity.length} Events
        </div>
      </div>

      {activity.length === 0 ? (
        <div className="rounded border border-neutral-800 bg-black/30 p-2 text-xs text-neutral-500">
          No operator activity recorded.
        </div>
      ) : (
        <div className="space-y-2">
          {activity.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-neutral-800 bg-black/20 p-3 text-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wide text-cyan-300">
                    {item.actor ?? 'Unknown Operator'}
                  </div>

                  <div className="mt-1 text-sm font-medium text-white">
                    {eventLabel(item)}
                  </div>

                  <div className="mt-1 text-[11px] text-neutral-500">
                    {item.dossierReference} · {item.dossierTitle}
                  </div>
                </div>

                <div className="shrink-0 rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400">
                  {formatTime(item.createdAt)}
                </div>
              </div>

              <div className="mt-2 border-t border-neutral-800 pt-2 text-[10px] uppercase tracking-wide text-neutral-600">
                {item.eventType}
                {item.fromState && item.toState
                  ? ` · ${item.fromState} → ${item.toState}`
                  : ''}
              </div>

              {item.message ? (
                <div className="mt-1 text-[11px] text-neutral-400">
                  {item.message}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
