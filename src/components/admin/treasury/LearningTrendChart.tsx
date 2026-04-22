type Point = {
  createdAt: string
  impactScore: number
}

export default function LearningTrendChart({ data }: { data: Point[] }) {
  return (
    <div className="text-xs text-neutral-400">
      {/* simple textual trend (replace later with chart lib) */}
      {data.map((p, i) => (
        <div key={i}>
          {new Date(p.createdAt).toLocaleTimeString()} → {p.impactScore.toFixed(2)}
        </div>
      ))}
    </div>
  )
}
