type Props = {
  data: {
    riskScore: number
    activeLocks: number
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  }
}

export default function SpinePanel({ data }: Props) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg font-medium text-white">
        Authority Spine
      </h2>

      <div className="space-y-3 text-sm">
        <div>
          <div className="text-xs text-neutral-500">
            Risk Level
          </div>
          <div className="text-cyan-400">
            {data.riskLevel}
          </div>
        </div>

        <div>
          <div className="text-xs text-neutral-500">
            Risk Score
          </div>
          <div className="text-white">
            {(data.riskScore * 100).toFixed(0)}%
          </div>
        </div>

        <div>
          <div className="text-xs text-neutral-500">
            Active Locks
          </div>
          <div className="text-yellow-400">
            {data.activeLocks}
          </div>
        </div>
      </div>
    </div>
  )
}