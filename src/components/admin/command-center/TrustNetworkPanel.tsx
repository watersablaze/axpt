"use client"

type TrustEdge = {
  from: string
  to: string
  trustScore: number
}

export default function TrustNetworkPanel({
  edges,
}: {
  edges: TrustEdge[]
}) {
  const grouped: Record<string, TrustEdge[]> = {}

  edges.forEach((e) => {
    if (!grouped[e.from]) grouped[e.from] = []
    grouped[e.from].push(e)
  })

  return (
    <div className="space-y-4">
      <div className="text-xs text-neutral-500 uppercase">
        Trust Network
      </div>

      {Object.entries(grouped).map(([from, list]) => (
        <div key={from} className="space-y-1">
          <div className="text-sm text-white font-medium">
            {from}
          </div>

          {list.map((e, i) => (
            <div
              key={i}
              className="flex justify-between text-xs text-neutral-400"
            >
              <span>→ {e.to}</span>
              <span
                className={
                  e.trustScore > 0.85
                    ? "text-emerald-400"
                    : e.trustScore > 0.6
                    ? "text-yellow-400"
                    : "text-red-400"
                }
              >
                {(e.trustScore * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}