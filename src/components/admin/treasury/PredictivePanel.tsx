'use client'

import { useState, useEffect } from 'react'

interface CircuitEvent {
  id: string
  type: string
  severity: string
  message: string
  metadata?: any
  createdAt: string
}

interface AutonomousDecision {
  id: string
  selected: string
  confidence: number
  executed: boolean
  createdAt: string
}

interface PredictiveData {
  signals: CircuitEvent[]
  recommendations: CircuitEvent[]
  autonomousDecisions: AutonomousDecision[]
  executions: CircuitEvent[]
}

export default function PredictivePanel() {
  const [data, setData] = useState<PredictiveData>({
    signals: [],
    recommendations: [],
    autonomousDecisions: [],
    executions: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPredictiveData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchPredictiveData, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchPredictiveData() {
    try {
      const response = await fetch('/api/admin/treasury/predictive')
      if (!response.ok) throw new Error('Failed to fetch')
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Failed to fetch predictive data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="border border-neutral-800 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-neutral-800 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-neutral-800 rounded"></div>
            <div className="h-4 bg-neutral-800 rounded"></div>
            <div className="h-4 bg-neutral-800 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-neutral-800 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Predictive Activity</h2>
        <button
          onClick={fetchPredictiveData}
          className="text-sm text-neutral-400 hover:text-white transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Signals */}
      <div>
        <div className="text-sm font-medium text-neutral-300 mb-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          Signals
        </div>
        {data.signals.length === 0 ? (
          <div className="text-sm text-neutral-500 italic">No signals detected</div>
        ) : (
          <div className="space-y-2">
            {data.signals.slice(0, 5).map((signal) => (
              <div key={signal.id} className="flex items-start gap-3">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    signal.severity === 'CRITICAL'
                      ? 'bg-red-500/20 text-red-400'
                      : signal.severity === 'WARN'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {signal.severity}
                </span>
                <div className="text-sm text-neutral-300 flex-1">
                  {signal.message}
                  {signal.metadata?.assetCode && (
                    <span className="text-neutral-500 ml-2">({signal.metadata.assetCode})</span>
                  )}
                </div>
                <div className="text-xs text-neutral-500">
                  {new Date(signal.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div>
        <div className="text-sm font-medium text-neutral-300 mb-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          Recommendations
        </div>
        {data.recommendations.length === 0 ? (
          <div className="text-sm text-neutral-500 italic">No recommendations</div>
        ) : (
          <div className="space-y-2">
            {data.recommendations.slice(0, 5).map((rec) => {
              const isAutoRunnable = rec.metadata?.autoExecutable
              return (
                <div key={rec.id} className="flex items-start gap-3">
                  <span className="text-purple-400">→</span>
                  <div className="text-sm text-neutral-300 flex-1">
                    <span className="font-medium">
                      {rec.message.includes('Recommended intent:') 
                        ? rec.message.split('Recommended intent: ')[1].split(' → ')[0]
                        : rec.message
                      }
                    </span>
                    {rec.message.includes(' → ') && (
                      <span className="text-neutral-500 ml-2">
                        ({rec.message.split(' → ')[1]})
                      </span>
                    )}
                    {rec.metadata?.assetCode && (
                      <span className="text-neutral-500 ml-2">({rec.metadata.assetCode})</span>
                    )}
                    {isAutoRunnable && (
                      <span className="ml-2 px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">
                        Auto
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {new Date(rec.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Autonomous Decisions */}
      <div>
        <div className="text-sm font-medium text-neutral-300 mb-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
          Autonomous Decision
        </div>
        {data.autonomousDecisions.length === 0 ? (
          <div className="text-sm text-neutral-500 italic">No autonomous decisions</div>
        ) : (
          <div className="space-y-2">
            {data.autonomousDecisions.slice(0, 5).map((decision) => (
              <div key={decision.id} className="flex items-start gap-3">
                <span className="text-cyan-400">→</span>
                <div className="text-sm text-neutral-300 flex-1 space-y-1">
                  <div>
                    <span className="font-medium">Selected:</span>
                    <span className="ml-2 text-neutral-200">{decision.selected}</span>
                  </div>
                  <div>
                    <span className="font-medium">Confidence:</span>
                    <span className="ml-2 text-neutral-200">{(decision.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="font-medium">Executed:</span>
                    <span className={`ml-2 font-medium ${decision.executed ? 'text-green-400' : 'text-red-400'}`}>
                      {decision.executed ? 'YES' : 'NO'}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-neutral-500">
                  {new Date(decision.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Executions */}
      <div>
        <div className="text-sm font-medium text-neutral-300 mb-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Executions
        </div>
        {data.executions.length === 0 ? (
          <div className="text-sm text-neutral-500 italic">No executions</div>
        ) : (
          <div className="space-y-2">
            {data.executions.slice(0, 5).map((exec) => {
              const isSkipped = exec.metadata?.skipped
              const isSuccess = exec.metadata?.success !== false && !isSkipped
              return (
                <div key={exec.id} className="flex items-start gap-3">
                  <span className={isSuccess ? 'text-green-400' : 'text-red-400'}>
                    {isSuccess ? '✓' : '✗'}
                  </span>
                  <div className="text-sm text-neutral-300 flex-1">
                    {exec.message.includes('Executing predictive intent:') 
                      ? `Executed: ${exec.message.split('Executing predictive intent: ')[1]}`
                      : exec.message.includes('Skipped predictive intent:')
                      ? `Skipped: ${exec.message.split('Skipped predictive intent: ')[1]}`
                      : exec.message
                    }
                    {exec.metadata?.assetCode && (
                      <span className="text-neutral-500 ml-2">({exec.metadata.assetCode})</span>
                    )}
                    {exec.metadata?.reason && (
                      <span className="ml-2 px-2 py-1 text-xs bg-neutral-500/20 text-neutral-400 rounded">
                        {exec.metadata.reason}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {new Date(exec.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="text-xs text-neutral-500 border-t border-neutral-800 pt-4">
        System explains → user understands → user trusts
      </div>
    </div>
  )
}
