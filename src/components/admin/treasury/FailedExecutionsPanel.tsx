export default function FailedExecutionsPanel({ items }: any) {
  return (
    <div className="p-4 border rounded-xl bg-neutral-950">
      <h2 className="text-lg font-semibold mb-4 text-red-400">
        Failed Executions
      </h2>

      {items.map((i: any) => (
        <div key={i.id} className="text-sm text-red-300">
          {i.actionId} — retry: {i.retryCount}
        </div>
      ))}
    </div>
  )
}