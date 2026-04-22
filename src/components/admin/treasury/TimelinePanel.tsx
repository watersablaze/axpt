// src/components/admin/treasury/TimelinePanel.tsx

type Event = {
  id: string
  type: string
  severity: string
  message: string
  createdAt: string
}

export default function TimelinePanel({ events }: { events: Event[] }) {
  if (!events.length) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-black p-4">
        <h2 className="mb-4 text-lg text-yellow-400">
          System Timeline
        </h2>

        <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4 text-sm">
          <div className="text-neutral-200">No recent circuit events.</div>
          <div className="mt-1 text-neutral-500">
            System operating normally.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-black p-4">
      <h2 className="text-lg text-yellow-400 mb-4">
        System Timeline
      </h2>

      <div className="space-y-3 max-h-[400px] overflow-auto">
        {events.map((e) => (
          <div key={e.id} className="border-b border-neutral-800 pb-2">
            <div className="text-xs text-neutral-500">
              {new Date(e.createdAt).toLocaleString()}
            </div>

            <div
              className={`text-sm ${
                e.severity === 'CRITICAL'
                  ? 'text-red-400'
                  : e.severity === 'WARN'
                  ? 'text-yellow-400'
                  : 'text-green-400'
              }`}
            >
              {e.type === 'INTENT' && (
                <span className="mr-2 font-semibold text-purple-400">
                  [INTENT]
                </span>
              )}

              {e.type === 'INTENT_STEP' && (
                <span className="ml-4 mr-2 text-blue-400">
                  ↳
                </span>
              )}

              {e.type !== 'INTENT' && e.type !== 'INTENT_STEP' && (
                <span className="mr-2 text-blue-400">
                  [{e.type}]
                </span>
              )}

              {e.message}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
