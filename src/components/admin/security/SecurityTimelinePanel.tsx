type Event = {
  id: string
  type: string
  createdAt: string
  metadata?: any
}

type Props = {
  events: Event[]
}

export default function SecurityTimelinePanel({ events }: Props) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg font-semibold">
        Security Timeline
      </h2>

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {events.map((e) => (
          <div
            key={e.id}
            className="p-3 border rounded-lg text-sm"
          >
            <div className="flex justify-between">
              <span className="font-medium">{e.type}</span>
              <span className="opacity-60 text-xs">
                {new Date(e.createdAt).toLocaleTimeString()}
              </span>
            </div>

            {e.metadata && (
              <pre className="mt-2 text-xs opacity-60 whitespace-pre-wrap">
                {JSON.stringify(e.metadata, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}