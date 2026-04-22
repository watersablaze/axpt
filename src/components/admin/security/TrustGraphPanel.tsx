type Node = {
  id: string
  label: string
  trustScore: number
  anomalyScore: number
  riskScore: number
  threatScore: number
  frozen: boolean
  quarantine: boolean
  clusterId: string | null
}

type Edge = {
  source: string
  target: string
  weight: number
  suspicious: boolean
}

type Props = {
  graph: {
    nodes: Node[]
    edges: Edge[]
  }
}

function getThreatTone(score: number) {
  if (score >= 12) return 'text-red-400'
  if (score >= 6) return 'text-orange-400'
  if (score >= 3) return 'text-yellow-300'
  return 'text-green-400'
}

function getStatusLabel(node: Node) {
  if (node.quarantine) return 'Quarantined'
  if (node.frozen) return 'Frozen'
  return 'Active'
}

export default function TrustGraphPanel({ graph }: Props) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg font-semibold">
        Trust Graph
      </h2>

      <div className="space-y-2 text-xs">
        {graph.nodes.slice(0, 20).map((node) => {
          const threatTone = getThreatTone(node.threatScore)

          return (
            <div
              key={node.id}
              className="flex justify-between gap-4 rounded-md px-2 py-1 hover:bg-neutral-900 transition"
            >
              <div>
                <div className="font-medium">
                  {node.label}
                </div>

                <div className="opacity-50">
                  {getStatusLabel(node)}
                </div>
              </div>

              <div className="text-right opacity-80 space-y-0.5">
                <div>
                  Trust: {Math.round(node.trustScore)}
                </div>

                <div>
                  Risk: {Math.round(node.riskScore)}
                </div>

                <div>
                  Anomaly: {node.anomalyScore.toFixed(2)}
                </div>

                <div className={threatTone}>
                  Threat: {Math.round(node.threatScore)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 text-xs opacity-60">
        {graph.edges.length} relationships detected
      </div>
    </div>
  )
}