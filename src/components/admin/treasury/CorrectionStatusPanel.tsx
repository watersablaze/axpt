import { normalizeObject } from '@/components/admin/treasury/contracts/panel'

type DriftStatus = {
  message: string
  severity: string
  createdAt: string
  driftScore: number
  recentRate: number
  historicalRate: number
  correctionMode: string
}

type CorrectionStatus = {
  message: string
  severity: string
  createdAt: string
  correctionMode: string
  selectedScenarioId: string | null
}

type AutonomyStatus = {
  message: string
  severity: string
  createdAt: string
  reason: string
  confidence: number
  scenarioId: string | null
  allowed: boolean
}

type CorrectionStatusData = {
  governorState: string
  lastDrift: DriftStatus | null
  lastCorrection: CorrectionStatus | null
  lastAutonomy: AutonomyStatus | null
}

type Props = {
  data?: Partial<CorrectionStatusData> | null
}

const DEFAULT_DATA: CorrectionStatusData = {
  governorState: 'STABLE',
  lastDrift: null,
  lastCorrection: null,
  lastAutonomy: null,
}

function normalizeData(
  data?: Partial<CorrectionStatusData> | null
): CorrectionStatusData {
  return normalizeObject(data, DEFAULT_DATA)
}

function tone(severity?: string) {
  if (severity === 'CRITICAL') return 'text-red-400'
  if (severity === 'WARN') return 'text-yellow-400'
  return 'text-green-400'
}

export default function CorrectionStatusPanel({ data }: Props) {
  const status = normalizeData(data)

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg">Correction Status</h2>

      <div className="mb-4 text-sm">
        <span className="text-neutral-400">Governor:</span>{' '}
        <span className="font-medium">{status.governorState}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div>
          <div className="mb-2 text-sm text-neutral-400">Drift</div>

          {status.lastDrift ? (
            <div className="space-y-1 text-sm">
              <div className={tone(status.lastDrift.severity)}>
                {status.lastDrift.message}
              </div>

              <div className="text-xs text-neutral-500">
                Score: {status.lastDrift.driftScore.toFixed(2)}
              </div>

              <div className="text-xs text-neutral-500">
                Recent:{' '}
                {(status.lastDrift.recentRate * 100).toFixed(0)}%
              </div>

              <div className="text-xs text-neutral-500">
                Historical:{' '}
                {(status.lastDrift.historicalRate * 100).toFixed(0)}%
              </div>

              <div className="text-xs text-neutral-400">
                Mode: {status.lastDrift.correctionMode}
              </div>
            </div>
          ) : (
            <div className="text-sm text-neutral-500">
              No drift data yet.
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 text-sm text-neutral-400">Correction</div>

          {status.lastCorrection ? (
            <div className="space-y-1 text-sm">
              <div className={tone(status.lastCorrection.severity)}>
                {status.lastCorrection.message}
              </div>

              <div className="text-xs text-neutral-400">
                Mode: {status.lastCorrection.correctionMode}
              </div>

              <div className="text-xs text-neutral-500">
                Scenario:{' '}
                {status.lastCorrection.selectedScenarioId ?? '—'}
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

          {status.lastAutonomy ? (
            <div className="space-y-1 text-sm">
              <div className={tone(status.lastAutonomy.severity)}>
                {status.lastAutonomy.message}
              </div>

              <div className="text-xs text-neutral-500">
                Allowed: {status.lastAutonomy.allowed ? 'Yes' : 'No'}
              </div>

              <div className="text-xs text-neutral-500">
                Confidence:{' '}
                {(status.lastAutonomy.confidence * 100).toFixed(0)}%
              </div>

              <div className="text-xs text-neutral-400">
                Reason: {status.lastAutonomy.reason}
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