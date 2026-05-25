'use client'

type IntelligenceSeverity =
  | 'NORMAL'
  | 'INFO'
  | 'WARNING'
  | 'CRITICAL'

type IntelligenceSignal = {
  id: string
  severity: IntelligenceSeverity
  label: string
  detail?: string
  streamType?: string
}

type Props = {
  signals: IntelligenceSignal[]
}

const DEFAULT_SIGNALS: IntelligenceSignal[] = [
  {
    id: 'system-nominal',
    severity: 'NORMAL',
    label: 'System operating within expected bounds',
    detail: 'No active intelligence signals detected.',
    streamType: 'SYSTEM',
  },
]

function severityClass(severity: IntelligenceSeverity) {
  switch (severity) {
    case 'CRITICAL':
    return `
        border-red-900
        bg-red-950/30
        text-red-300
        shadow-[0_0_18px_rgba(127,29,29,0.22)]
    `

    case 'WARNING':
    return `
        border-orange-900
        bg-orange-950/30
        text-orange-300
        shadow-[0_0_14px_rgba(154,52,18,0.16)]
    `

    case 'INFO':
      return 'border-cyan-900 bg-cyan-950/20 text-cyan-300'

    default:
      return 'border-neutral-800 bg-neutral-950 text-neutral-300'
  }
}

function dotClass(severity: IntelligenceSeverity) {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-400'

    case 'WARNING':
      return 'bg-orange-400'

    case 'INFO':
      return 'bg-cyan-400'

    default:
      return 'bg-green-400'
  }
}

export default function IntelligenceSummaryPanel({
  signals,
}: Props) {

const activeSignals =
  signals.length > 0
    ? signals
    : DEFAULT_SIGNALS
      

      const criticalCount = activeSignals.filter(
  (signal) => signal.severity === 'CRITICAL'
).length

const warningCount = activeSignals.filter(
  (signal) => signal.severity === 'WARNING'
).length

const summaryStatus =
  criticalCount > 0
    ? 'CRITICAL'
    : warningCount > 0
      ? 'ELEVATED'
      : 'STABLE'

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            System Intelligence
          </div>

          <h2 className="mt-1 text-lg font-medium text-white">
            Operational Summary
          </h2>
        </div>

        <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400">
          {summaryStatus}
        </div>
      </div>

      <div className="space-y-1.5">
        {activeSignals.map((signal) => (
          <div
            key={signal.id}
            className={`rounded-lg border p-3 text-sm ${severityClass(
              signal.severity
            )}`}
          >
            <div className="flex items-start gap-2">
              <span
                className={`mt-1 h-2 w-2 rounded-full ${dotClass(
                  signal.severity
                )}`}
              />

              <div>
                <div className="font-medium">
                  {signal.label}
                </div>

                {signal.detail ? (
                  <div className="mt-1 text-xs text-neutral-400">
                    {signal.detail}
                  </div>
                ) : null}

                {signal.streamType ? (
                  <div className="mt-2 text-[10px] uppercase tracking-wide text-neutral-600">
                    {signal.streamType}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}