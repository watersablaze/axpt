type Props = {
  data: {
    mode: 'SHADOW' | 'ENFORCED'
    lastDecision: string | null
  }
}

export default function ETKPanel({ data }: Props) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg font-medium text-white">
        Execution Truth Kernel
      </h2>

      <div className="space-y-3 text-sm">
        <div>
          <div className="text-xs text-neutral-500">Mode</div>
          <div
            className={
              data.mode === 'ENFORCED'
                ? 'text-red-400'
                : 'text-yellow-400'
            }
          >
            {data.mode}
          </div>
        </div>

        <div>
          <div className="text-xs text-neutral-500">
            Last Decision
          </div>
          <div className="text-neutral-300">
            {data.lastDecision ?? 'No decision recorded'}
          </div>
        </div>
      </div>
    </div>
  )
}