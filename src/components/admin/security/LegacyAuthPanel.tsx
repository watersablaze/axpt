type Props = {
  signals: {
    label: string
    active: boolean
    detail?: string
  }[]
}

export default function LegacyAuthPanel({
  data,
}: {
  data: Props
}) {
  return (
    <div className="rounded-xl border border-yellow-900/50 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg text-yellow-400">
        Legacy Auth Signals
      </h2>

      <div className="space-y-3">
        {data.signals.map((signal) => (
          <div
            key={signal.label}
            className="rounded-lg border border-neutral-800 bg-black px-3 py-2"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm text-white">{signal.label}</div>

              <div
                className={`text-xs ${
                  signal.active
                    ? 'text-yellow-400'
                    : 'text-green-400'
                }`}
              >
                {signal.active ? 'ACTIVE' : 'CLEAR'}
              </div>
            </div>

            {signal.detail && (
              <div className="mt-1 text-xs text-neutral-500">
                {signal.detail}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}