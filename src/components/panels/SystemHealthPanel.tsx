import type { ControlCenterSnapshot } from "./contracts/controlCenter"

type Props = {
  data: ControlCenterSnapshot["system"]
  loading?: boolean
}

export default function SystemHealthPanel({
  data,
  loading,
}: Props) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-white">
          System Health
        </h2>

        <div className="text-xs text-neutral-500">
          {loading ? 'SYNCING' : data.status === 'UNKNOWN' ? 'NOT MEASURED' : data.status}
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <div className="text-neutral-500">
            Health
          </div>

          <div className="text-neutral-300">
            {data.health === null ? "Not measured" : `${(data.health * 100).toFixed(0)}%`}
          </div>
        </div>

        <div>
          <div className="text-neutral-500">
            Drift
          </div>

          <div className="text-neutral-300">
            {data.drift === null ? "Not measured" : `${(data.drift * 100).toFixed(1)}%`}
          </div>
        </div>

        <div>
          <div className="text-neutral-500">
            Stability
          </div>

          <div className="text-neutral-300">
            {data.stability === null ? "Not measured" : `${(data.stability * 100).toFixed(0)}%`}
          </div>
        </div>
      </div>
    </div>
  )
}