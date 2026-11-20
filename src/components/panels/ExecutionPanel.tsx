import type { ControlCenterSnapshot } from "./contracts/controlCenter"

type Props = {
  data: ControlCenterSnapshot["execution"]
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
            Queue entries
          </div>

          <div className="text-2xl text-white">
            {data.pending}
          </div>
        </div>

        <div>
          <div className="text-xs text-neutral-500">
            Success rate
          </div>

          <div className="text-2xl text-neutral-300">
            {data.successRate === null ? "Not measured" : `${(data.successRate * 100).toFixed(0)}%`}
          </div>
        </div>

        <div>
          <div className="text-xs text-neutral-500">
            Active Jobs
          </div>

          <div className="text-2xl text-neutral-300">
            {data.activeJobs ?? "Not measured"}
          </div>
        </div>
      </div>
    </div>
  )
}