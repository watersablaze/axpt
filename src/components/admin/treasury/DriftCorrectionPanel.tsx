type Row = {
  id: string
  severity: string
  message: string
  metadata?: Record<string, unknown> | null
  createdAt: string
}

type Props = {
  data?: Row[] | null
}

function normalizeRows(data?: Row[] | null): Row[] {
  return Array.isArray(data) ? data : []
}

function severityTone(severity: string) {
  if (severity === 'CRITICAL') return 'text-red-400'
  if (severity === 'WARN') return 'text-yellow-400'
  return 'text-green-400'
}

export default function DriftCorrectionPanel({ data }: Props) {
  const rows = normalizeRows(data)

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg">
        Drift & Self-Correction
      </h2>

      {rows.length ? (
        <div className="max-h-[260px] space-y-2 overflow-auto">
          {rows.map((row) => {
            const correctionMode =
              row.metadata?.['correctionMode']

            return (
              <div
                key={row.id}
                className="border-b border-neutral-800 pb-2 text-sm"
              >
                <div className={severityTone(row.severity)}>
                  {row.message}
                </div>

                <div className="text-xs text-neutral-500">
                  {new Date(row.createdAt).toLocaleString()}
                </div>

                {Boolean(correctionMode) && (
                  <div className="text-xs text-neutral-400">
                    Correction Mode:{' '}
                    {String(correctionMode)}
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