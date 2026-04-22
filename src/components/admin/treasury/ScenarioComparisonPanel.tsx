type Scenario = {
  id: string
  score: number
  baseScore: number
  learningDelta: number
  actions: { type: string }[]
  effects: string[]
  risks: { level: string }[]
  reasoning?: string[]
  why?: {
    summary: string
    factors: string[]
  }
}

type Props = {
  intent: string
  scenarios: Scenario[]
  best: Scenario
  onSelect?: (id: string) => void
}

function riskTone(level: string) {
  if (level === 'HIGH') return 'text-red-400'
  if (level === 'MEDIUM') return 'text-yellow-400'
  return 'text-green-400'
}

export default function ScenarioComparisonPanel({
  intent,
  scenarios,
  best,
  onSelect,
}: Props) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg">Scenario Comparison</h2>

      <div className="mb-2 text-sm text-neutral-400">
        Intent: <span className="font-medium">{intent}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {scenarios.map((s) => {
          const isBest = s.id === best.id

          return (
            <div
              key={s.id}
              className={`rounded-lg border p-3 ${
                isBest
                  ? 'border-green-600 bg-green-950/20'
                  : 'border-neutral-800'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium text-sm">{s.id}</div>
              </div>

              <div className="mb-2 space-y-1">
                <div className="text-xs text-neutral-400">
                  Base: {s.baseScore.toFixed(2)}
                </div>
                <div className="text-xs text-cyan-400">
                  Learning: {s.learningDelta >= 0 ? '+' : ''}
                  {s.learningDelta.toFixed(2)}
                </div>
                <div className="text-xs text-neutral-300">
                  Final: {s.score.toFixed(2)}
                </div>
              </div>

              {isBest && (
                <div className="text-xs text-green-400 mb-2">
                  ✓ Selected Strategy
                </div>
              )}

              {/* ACTIONS */}
              <div className="text-xs mb-2">
                <div className="text-neutral-400">Actions:</div>
                {s.actions.map((a, i) => (
                  <div key={i} className="text-neutral-200">
                    • {a.type}
                  </div>
                ))}
              </div>

              {/* EFFECTS */}
              <div className="text-xs mb-2">
                <div className="text-neutral-400">Effects:</div>
                {s.effects.map((e, i) => (
                  <div key={i}>• {e}</div>
                ))}
              </div>

              {/* RISKS */}
              <div className="text-xs mb-2">
                <div className="text-neutral-400">Risks:</div>
                {s.risks.length ? (
                  s.risks.map((r, i) => (
                    <div key={i} className={riskTone(r.level)}>
                      • {r.level}
                    </div>
                  ))
                ) : (
                  <div className="text-green-400">None</div>
                )}
              </div>

              {/* REASONING */}
              {s.why && (
                <div className="text-xs mt-2">
                  <div className="text-neutral-400">Why Factors:</div>
                  <div className="text-xs text-neutral-400">
                    {s.why.factors.map((f, i) => (
                      <div key={i}>{f}</div>
                    ))}
                  </div>
                </div>
              )}

              {s.reasoning && (
                <div className="text-xs mt-2">
                  <div className="text-neutral-400">Why:</div>
                  {s.reasoning.map((r, i) => (
                    <div key={i}>• {r}</div>
                  ))}
                </div>
              )}

              {/* SELECT BUTTON */}
              {onSelect && (
                <button
                  onClick={() => onSelect(s.id)}
                  className="mt-3 w-full text-xs border border-neutral-700 rounded px-2 py-1 hover:bg-neutral-800"
                >
                  Choose
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
