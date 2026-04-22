type CircuitRow = {
  id: string
  severity: string
  message: string
  metadata?: Record<string, unknown> | null
  createdAt: string
}

type Props = {
  data: {
    latestDecision: CircuitRow | null
    latestExecution: CircuitRow | null
    decisions: CircuitRow[]
    executions: CircuitRow[]
  }
}

function tone(severity: string) {
  if (severity === 'CRITICAL') return 'text-red-400'
  if (severity === 'WARN') return 'text-yellow-400'
  return 'text-green-400'
}

function readMeta(row: CircuitRow | null) {
  return (row?.metadata ?? {}) as Record<string, unknown>
}

export default function AutonomousDecisionPanel({ data }: Props) {
  const decisionMeta = readMeta(data.latestDecision)
  const executionMeta = readMeta(data.latestExecution)

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg">Autonomous Decisioning</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-2 text-sm text-neutral-400">Latest Decision</div>

          {data.latestDecision ? (
            <div className="space-y-2 text-sm">
              <div className={tone(data.latestDecision.severity)}>
                {data.latestDecision.message}
              </div>

              <div className="text-xs text-neutral-500">
                {new Date(data.latestDecision.createdAt).toLocaleString()}
              </div>

              <div>
                <span className="text-neutral-400">Governor:</span>{' '}
                <span>{String(decisionMeta.governorState ?? '—')}</span>
              </div>

              <div>
                <span className="text-neutral-400">Confidence:</span>{' '}
                <span>
                  {typeof decisionMeta.confidence === 'number'
                    ? `${(Number(decisionMeta.confidence) * 100).toFixed(0)}%`
                    : '—'}
                </span>
              </div>

              <div>
                <span className="text-neutral-400">Scenario:</span>{' '}
                <span>{String(decisionMeta.scenarioId ?? '—')}</span>
              </div>

              <div>
                <span className="text-neutral-400">Reason:</span>{' '}
                <span>{String(decisionMeta.reason ?? '—')}</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-neutral-500">
              No autonomous decisions yet.
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 text-sm text-neutral-400">Latest Execution</div>

          {data.latestExecution ? (
            <div className="space-y-2 text-sm">
              <div className={tone(data.latestExecution.severity)}>
                {data.latestExecution.message}
              </div>

              <div className="text-xs text-neutral-500">
                {new Date(data.latestExecution.createdAt).toLocaleString()}
              </div>

              <div>
                <span className="text-neutral-400">Scenario:</span>{' '}
                <span>{String(executionMeta.scenarioId ?? '—')}</span>
              </div>

              <div>
                <span className="text-neutral-400">Confidence:</span>{' '}
                <span>
                  {typeof executionMeta.confidence === 'number'
                    ? `${(Number(executionMeta.confidence) * 100).toFixed(0)}%`
                    : '—'}
                </span>
              </div>

              <div>
                <span className="text-neutral-400">Impact:</span>{' '}
                <span>
                  {typeof executionMeta.impactScore === 'number'
                    ? Number(executionMeta.impactScore).toFixed(2)
                    : '—'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-neutral-500">
              No autonomous executions yet.
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 text-sm text-neutral-400">Recent Autonomous Activity</div>

        {data.decisions.length || data.executions.length ? (
          <div className="space-y-2 max-h-[260px] overflow-auto">
            {[...data.decisions, ...data.executions]
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )
              .map((row) => (
                <div
                  key={row.id}
                  className="border-b border-neutral-800 pb-2 text-sm"
                >
                  <div className={tone(row.severity)}>{row.message}</div>
                  <div className="text-xs text-neutral-500">
                    {new Date(row.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-sm text-neutral-500">
            No autonomous activity recorded.
          </div>
        )}
      </div>
    </div>
  )
}