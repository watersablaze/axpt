'use client'

import { useState } from 'react'

type Scenario = {
  id: string
  label: string
}

type ScenarioResult = {
  scenarioId: string
  effects: string[]
  risks: Array<{
    level: 'LOW' | 'MEDIUM' | 'HIGH'
    message: string
  }>
  score: number
}

export default function ScenarioModal({
  intent,
  scenarios,
  results,
  best,
  onConfirm,
  onClose,
}: {
  intent: string
  scenarios: Scenario[]
  results: ScenarioResult[]
  best: Scenario
  onConfirm: (scenarioId: string) => void
  onClose: () => void
}) {
  const [selected, setSelected] = useState(best.id)

  function getResult(id: string) {
    return results.find((result) => result.scenarioId === id)
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80">
      <div className="w-[700px] space-y-4 rounded-xl bg-neutral-900 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Scenario Analysis: {intent}</h2>

          <button onClick={onClose} className="text-neutral-400">
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {scenarios.map((scenario) => {
            const result = getResult(scenario.id)
            const isSelected = selected === scenario.id
            const isBest = scenario.id === best.id

            return (
              <div
                key={scenario.id}
                onClick={() => setSelected(scenario.id)}
                className={`cursor-pointer rounded border p-4 ${
                  isSelected
                    ? 'border-green-500 bg-neutral-800'
                    : 'border-neutral-700'
                }`}
              >
                <div className="flex justify-between">
                  <div className="font-medium">{scenario.label}</div>

                  <div className="text-sm">Score: {result?.score ?? '—'}</div>
                </div>

                {isBest && (
                  <div className="mt-1 text-xs text-green-400">Recommended</div>
                )}

                <div className="mt-2 text-sm">
                  {result?.effects.map((effect, index) => (
                    <div key={index}>✓ {effect}</div>
                  ))}
                </div>

                <div className="mt-2 text-sm">
                  {result?.risks.map((risk, index) => (
                    <div
                      key={index}
                      className={
                        risk.level === 'HIGH'
                          ? 'text-red-400'
                          : 'text-yellow-400'
                      }
                    >
                      ⚠ {risk.message}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="rounded bg-neutral-700 px-4 py-2"
          >
            Cancel
          </button>

          <button
            onClick={() => onConfirm(selected)}
            className="rounded bg-green-600 px-4 py-2"
          >
            Execute Selected
          </button>
        </div>
      </div>
    </div>
  )
}
