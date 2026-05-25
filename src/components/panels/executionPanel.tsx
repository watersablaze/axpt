type Props = {
  data: {
    pending: number
    successRate: number
    activeJobs: number
  }
}

export default function ExecutionPanel({
  data,
}: Props) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg font-medium text-white">
        Execution
      </h2>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <div className="text-xs text-neutral-500">
            Pending
          </div>

          <div className="text-2xl text-white">
            {data.pending}
          </div>
        </div>

        <div>
          <div className="text-xs text-neutral-500">
            Success Rate
          </div>

          <div className="text-2xl text-green-400">
            {(data.successRate * 100).toFixed(0)}%
          </div>
        </div>

        <div>
          <div className="text-xs text-neutral-500">
            Active Jobs
          </div>

          <div className="text-2xl text-cyan-400">
            {data.activeJobs}
          </div>
        </div>
      </div>
    </div>
  )
}