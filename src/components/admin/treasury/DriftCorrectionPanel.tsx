type Row = {
  id: string
  severity: string
  message: string
  metadata?: Record<string, unknown> | null
  createdAt: string
}

export default function DriftCorrectionPanel({ data }: { data: Row[] }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg">Drift & Self-Correction</h2>

      {data.length ? (
        <div className="space-y-2 max-h-[260px] overflow-auto">
          {data.map((row) => {
            const correctionMode = row.metadata?.['correctionMode']

            return (
              <div key={row.id} className="border-b border-neutral-800 pb-2 text-sm">
                <div
                  className={
                    row.severity === 'CRITICAL'
                      ? 'text-red-400'
                      : row.severity === 'WARN'
                      ? 'text-yellow-400'
                      : 'text-green-400'
                  }
                >
                  {row.message}
                </div>

                <div className="text-xs text-neutral-500">
                  {new Date(row.createdAt).toLocaleString()}
                </div>

                {Boolean(correctionMode) && (
                  <div className="text-xs text-neutral-400">
                    Correction Mode: {String(correctionMode)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-sm text-neutral-500">
          No drift correction activity yet.
        </div>
      )}
    </div>
  )
}
