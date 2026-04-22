export default function TreasuryActionStatsPanel({ data }: any) {
  return (
    <div className="p-4 border rounded-xl bg-neutral-900 flex gap-6">
      {data.map((s: any) => (
        <div key={s.status}>
          <div className="text-xs opacity-60">{s.status}</div>
          <div className="text-xl font-bold">{s._count}</div>
        </div>
      ))}
    </div>
  )
}