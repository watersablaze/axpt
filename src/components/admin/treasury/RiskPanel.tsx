export default function RiskPanel({ items }: any) {
  return (
    <div className="p-4 border rounded-xl bg-neutral-950">
      <h2 className="text-lg font-semibold mb-4">Risk Signals</h2>

      {items.map((i: any) => (
        <div key={i.id} className="text-sm">
          {i.userId} → {i.riskLevel} ({i.riskScore})
        </div>
      ))}
    </div>
  )
}