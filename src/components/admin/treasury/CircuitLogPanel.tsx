// src/components/admin/treasury/CircuitLogPanel.tsx

type Props = {
  events: {
    id: string
    severity: string
    message: string
    createdAt: string
  }[]
}

export default function CircuitLogPanel({ events }: Props) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-black p-4">
      <h2 className="text-lg text-yellow-400 mb-4">
        Circuit Activity
      </h2>

      <div className="space-y-2 max-h-[300px] overflow-auto">
        {events.map((e) => (
          <div key={e.id} className="text-sm border-b border-neutral-800 pb-2">
            <div className="text-xs text-neutral-400">
              {new Date(e.createdAt).toLocaleString()}
            </div>

            <div className="text-red-400">
              [{e.severity}] {e.message}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}