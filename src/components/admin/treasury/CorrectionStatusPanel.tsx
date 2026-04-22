type Props = {
  data: {
    governorState: string
    lastDrift: {
      message: string
      severity: string
      createdAt: string
      driftScore: number
      recentRate: number
      historicalRate: number
      correctionMode: string
    } | null
    lastCorrection: {
      message: string
      severity: string
      createdAt: string
      correctionMode: string
      selectedScenarioId: string | null
    } | null
    lastAutonomy: {
      message: string
      severity: string
      createdAt: string
      reason: string
      confidence: number
      scenarioId: string | null
      allowed: boolean
    } | null
  }
}

function tone(severity?: string) {
  if (severity === 'CRITICAL') return 'text-red-400'
  if (severity === 'WARN') return 'text-yellow-400'
  return 'text-green-400'
}

export default function CorrectionStatusPanel({ data }: Props) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg">Correction Status</h2>

      <div className="mb-4 text-sm">
        <span className="text-neutral-400">Governor:</span>{' '}
        <span className="font-medium">{data.governorState}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div>
          <div className="mb-2 text-sm text-neutral-400">Drift</div>
          {data.lastDrift ? (
            <div className="space-y-1 text-sm">
              <div className={tone(data.lastDrift.severity)}>
                {data.lastDrift.message}
              </div>
              <div className="text-xs text-neutral-500">
                Score: {data.lastDrift.driftScore.toFixed(2)}
              </div>
              <div className="text-xs text-neutral-500">
                Recent: {(data.lastDrift.recentRate * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-neutral-500">
                Historical: {(data.lastDrift.historicalRate * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-neutral-400">
                Mode: {data.lastDrift.correctionMode}
              </div>
            </div>
          ) : (
            <div className="text-sm text-neutral-500">No drift data yet.</div>
          )}
        </div>

        <div>
          <div className="mb-2 text-sm text-neutral-400">Correction</div>
          {data.lastCorrection ? (
            <div className="space-y-1 text-sm">
              <div className={tone(data.lastCorrection.severity)}>
                {data.lastCorrection.message}
              </div>
              <div className="text-xs text-neutral-400">
                Mode: {data.lastCorrection.correctionMode}
              </div>
              <div className="text-xs text-neutral-500">
                Scenario: {data.lastCorrection.selectedScenarioId ?? '—'}
              </div>
            </div>
          ) : (
            <div className="text-sm text-neutral-500">
              No correction activity yet.
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 text-sm text-neutral-400">Autonomy</div>
          {data.lastAutonomy ? (
            <div className="space-y-1 text-sm">
              <div className={tone(data.lastAutonomy.severity)}>
                {data.lastAutonomy.message}
              </div>
              <div className="text-xs text-neutral-500">
                Allowed: {data.lastAutonomy.allowed ? 'Yes' : 'No'}
              </div>
              <div className="text-xs text-neutral-500">
                Confidence: {(data.lastAutonomy.confidence * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-neutral-400">
                Reason: {data.lastAutonomy.reason}
              </div>
            </div>
          ) : (
            <div className="text-sm text-neutral-500">
              No autonomy decisions yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}