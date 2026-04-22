type Intent = {
  intent: string
  score: number
  reasoning: string[]
  assetCode?: string
  systemState?: string
  weights?: {
    successWeight: number
    impactWeight: number
    patternWeight: number
  }
}

export default function AdaptiveIntentPanel({
  data,
}: {
  data: Intent[]
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Adaptive Intent</h2>
          <p className="text-sm text-neutral-500">
            Suggested actions based on system state and prior outcomes.
          </p>
        </div>
      </div>

      {data.length ? (
        <div className="mt-6 space-y-4">
          {data.map((intent, idx) => (
            <div
              key={`${intent.intent}:${intent.assetCode ?? 'GLOBAL'}:${intent.systemState ?? 'STABLE'}`}
              className="rounded-xl border border-neutral-800 bg-neutral-950 p-4"
            >
              <div className="flex items-center justify-between gap-4 text-sm font-medium text-white">
                <span>{idx === 0 ? '✓ ' : ''}{intent.intent}</span>
                <span className="text-neutral-400">{intent.score.toFixed(2)}</span>
              </div>

              <div className="mt-3 space-y-1 text-xs text-neutral-400">
                {intent.reasoning.map((reason, reasonIndex) => (
                  <div key={reasonIndex}>• {reason}</div>
                ))}
              </div>

              <div className="mt-3 text-xs text-neutral-400">
                Context: {intent.assetCode ?? 'GLOBAL'} / {intent.systemState ?? 'STABLE'}
              </div>

              {intent.weights && (
                <div className="mt-3 text-xs text-cyan-400">
                  Weights →
                  {' '}S:{intent.weights.successWeight.toFixed(2)}
                  {' '}I:{intent.weights.impactWeight.toFixed(2)}
                  {' '}P:{intent.weights.patternWeight.toFixed(2)}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 text-sm text-neutral-500">
          No adaptive intent suggestions available.
        </div>
      )}
    </div>
  )
}
