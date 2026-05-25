type Props = {
  data: {
    pendingActions: number
    queuedExecutions: number
    failedExecutions: number
  }
}

export default function TreasuryPanel({
  data,
}: Props) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg font-medium text-white">
        Treasury
      </h2>

      <div className="space-y-4">
        <div>
          <div className="text-xs text-neutral-500">
            Pending Actions
          </div>

          <div className="text-xl text-white">
            {data.pendingActions}
          </div>
        </div>

        <div>
          <div className="text-xs text-neutral-500">
            Queued Executions
          </div>

          <div className="text-xl text-cyan-400">
            {data.queuedExecutions}
          </div>
        </div>

        <div>
          <div className="text-xs text-neutral-500">
            Failed Executions
          </div>

          <div className="text-xl text-red-400">
            {data.failedExecutions}
          </div>
        </div>
      </div>
    </div>
  )
}