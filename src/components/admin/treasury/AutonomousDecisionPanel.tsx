type CircuitRow = {
  id: string
  severity: string
  message: string
  metadata?: Record<string, unknown> | null
  createdAt: string
}

type AutonomousDecisionData = {
  latestDecision: CircuitRow | null
  latestExecution: CircuitRow | null
  decisions: CircuitRow[]
  executions: CircuitRow[]
}

type Props = {
  data?: Partial<AutonomousDecisionData> | null
}

const DEFAULT_DATA: AutonomousDecisionData = {
  latestDecision: null,
  latestExecution: null,
  decisions: [],
  executions: [],
}

function normalizeData(
  data?: Partial<AutonomousDecisionData> | null
): AutonomousDecisionData {
  return {
    ...DEFAULT_DATA,
    ...data,
    decisions: data?.decisions ?? [],
    executions: data?.executions ?? [],
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

export default function AutonomousDecisionPanel({
  data,
}: Props) {
  const normalized = normalizeData(data)

  const decisionMeta = readMeta(
    normalized.latestDecision
  )

  const executionMeta = readMeta(
    normalized.latestExecution
  )

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg">
        Autonomous Decisioning
      </h2>

      <div className="grid gap-6 lg:grid-cols-2">

        {/* LATEST DECISION */}
        <div>
          <div className="mb-2 text-sm text-neutral-400">
            Latest Decision
          </div>

          {normalized.latestDecision ? (
            <div className="space-y-2 text-sm">

              <div
                className={tone(
                  normalized.latestDecision.severity
                )}
              >
                {normalized.latestDecision.message}
              </div>

              <div className="text-xs text-neutral-500">
                {new Date(
                  normalized.latestDecision.createdAt
                ).toLocaleString()}
              </div>

              <div>
                <span className="text-neutral-400">
                  Governor:
                </span>{' '}
                <span>
                  {String(
                    decisionMeta.governorState ?? '—'
                  )}
                </span>
              </div>

              <div>
                <span className="text-neutral-400">
                  Confidence:
                </span>{' '}
                <span>
                  {typeof decisionMeta.confidence === 'number'
                    ? `${(
                        Number(decisionMeta.confidence) * 100
                      ).toFixed(0)}%`
                    : '—'}
                </span>
              </div>

              <div>
                <span className="text-neutral-400">
                  Scenario:
                </span>{' '}
                <span>
                  {String(
                    decisionMeta.scenarioId ?? '—'
                  )}
                </span>
              </div>

              <div>
                <span className="text-neutral-400">
                  Reason:
                </span>{' '}
                <span>
                  {String(
                    decisionMeta.reason ?? '—'
                  )}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-neutral-500">
              No autonomous decisions yet.
            </div>
          )}
        </div>

        {/* LATEST EXECUTION */}
        <div>
          <div className="mb-2 text-sm text-neutral-400">
            Latest Execution
          </div>

          {normalized.latestExecution ? (
            <div className="space-y-2 text-sm">

              <div
                className={tone(
                  normalized.latestExecution.severity
                )}
              >
                {normalized.latestExecution.message}
              </div>

              <div className="text-xs text-neutral-500">
                {new Date(
                  normalized.latestExecution.createdAt
                ).toLocaleString()}
              </div>

              <div>
                <span className="text-neutral-400">
                  Scenario:
                </span>{' '}
                <span>
                  {String(
                    executionMeta.scenarioId ?? '—'
                  )}
                </span>
              </div>

              <div>
                <span className="text-neutral-400">
                  Confidence:
                </span>{' '}
                <span>
                  {typeof executionMeta.confidence === 'number'
                    ? `${(
                        Number(executionMeta.confidence) * 100
                      ).toFixed(0)}%`
                    : '—'}
                </span>
              </div>

              <div>
                <span className="text-neutral-400">
                  Impact:
                </span>{' '}
                <span>
                  {typeof executionMeta.impactScore === 'number'
                    ? Number(
                        executionMeta.impactScore
                      ).toFixed(2)
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

      {/* ACTIVITY */}
      <div className="mt-6">
        <div className="mb-2 text-sm text-neutral-400">
          Recent Autonomous Activity
        </div>

        {normalized.decisions.length ||
        normalized.executions.length ? (
          <div className="max-h-[260px] space-y-2 overflow-auto">

            {[...normalized.decisions, ...normalized.executions]
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .map((row) => (
                <div
                  key={row.id}
                  className="border-b border-neutral-800 pb-2 text-sm"
                >
                  <div className={tone(row.severity)}>
                    {row.message}
                  </div>

                  <div className="text-xs text-neutral-500">
                    {new Date(
                      row.createdAt
                    ).toLocaleString()}
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