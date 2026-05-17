type Row = {
  id: string
  severity: string
  message: string
  metadata?: any
  createdAt: string
}

type PredictiveData = {
  signals: Row[]
  recommendations: Row[]
  executions: Row[]
  governorState: string
}

type Props = {
  data?: Partial<PredictiveData> | null
}

const DEFAULT_DATA: PredictiveData = {
  signals: [],
  recommendations: [],
  executions: [],
  governorState: 'STABLE',
}

function normalizeData(
  data?: Partial<PredictiveData> | null
): PredictiveData {
  return {
    ...DEFAULT_DATA,
    ...data,
    signals: data?.signals ?? [],
    recommendations: data?.recommendations ?? [],
    executions: data?.executions ?? [],
  }
}

function tone(sev: string) {
  if (sev === 'CRITICAL') return 'text-red-400'
  if (sev === 'WARN') return 'text-yellow-400'
  return 'text-green-400'
}

function badge(auto: boolean) {
  return auto
    ? 'bg-green-900 text-green-300'
    : 'bg-neutral-800 text-neutral-400'
}

export default function PredictiveIntelligencePanel({
  data,
}: Props) {
  const normalized = normalizeData(data)

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg">
        Predictive Intelligence
      </h2>

      <div className="mb-4 text-sm text-neutral-400">
        Governor State:{' '}
        <span className="font-medium">
          {normalized.governorState}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">

        {/* SIGNALS */}
        <div>
          <div className="mb-2 text-sm text-neutral-400">
            Signals
          </div>

          {normalized.signals.length ? (
            normalized.signals.map((s) => (
              <div key={s.id} className="mb-2 text-sm">
                <div className={tone(s.severity)}>
                  [{s.severity}] {s.message}
                </div>

                <div className="text-xs text-neutral-500">
                  {new Date(s.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-neutral-500">
              No signals
            </div>
          )}
        </div>

        {/* RECOMMENDATIONS */}
        <div>
          <div className="mb-2 text-sm text-neutral-400">
            Recommendations
          </div>

          {normalized.recommendations.length ? (
            normalized.recommendations.map((r) => {
              const m = r.metadata ?? {}
              const confidence = m.confidence ?? 0
              const auto = m.autoExecutable ?? false
              const risks = m.risks ?? []

              return (
                <div
                  key={r.id}
                  className="mb-3 border-b border-neutral-800 pb-2 text-sm"
                >
                  <div className={tone(r.severity)}>
                    {r.message}
                  </div>

                  <div className="mt-1 text-xs text-neutral-400">
                    Confidence:{' '}
                    {(confidence * 100).toFixed(0)}%
                  </div>

                  <div className="mt-1 text-xs">
                    <span
                      className={`rounded px-2 py-0.5 ${badge(auto)}`}
                    >
                      {auto
                        ? 'AUTO-RUNNABLE'
                        : 'ADVISORY'}
                    </span>
                  </div>

                  {risks.length > 0 && (
                    <div className="mt-1 text-xs text-red-400">
                      Risks:{' '}
                      {risks
                        .map((r: any) => r.level)
                        .join(', ')}
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="text-sm text-neutral-500">
              No recommendations
            </div>
          )}
        </div>

        {/* EXECUTIONS */}
        <div>
          <div className="mb-2 text-sm text-neutral-400">
            Executions
          </div>

          {normalized.executions.length ? (
            normalized.executions.map((e) => (
              <div key={e.id} className="mb-2 text-sm">
                <div className={tone(e.severity)}>
                  {e.message}
                </div>

                <div className="text-xs text-neutral-500">
                  {new Date(e.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-neutral-500">
              No executions yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}