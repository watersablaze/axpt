export default function ExecutionQueuePanel({ items }: any) {
  return (
    <div className="p-4 border rounded-xl bg-neutral-950">
      <h2 className="text-lg font-semibold mb-4">Execution Queue</h2>

      {items.map((i: any) => (
        <div key={i.id} className="text-sm">
          {i.actionId} — {i.status}
        </div>
      ))}
    </div>
  )
}