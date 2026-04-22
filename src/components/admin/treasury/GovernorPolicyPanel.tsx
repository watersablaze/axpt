type Props = {
  data: {
    governorState: string
    forceAdvisory: boolean
    forceSimulation: boolean
    autonomyAllowed: boolean
    holdUntil: string | null
  }
}

export default function GovernorPolicyPanel({ data }: Props) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg">Governor Policy</h2>

      <div className="space-y-2 text-sm">
        <div>
          <span className="text-neutral-400">State:</span>{' '}
          <span>{data.governorState}</span>
        </div>

        <div>
          <span className="text-neutral-400">Force Advisory:</span>{' '}
          <span>{data.forceAdvisory ? 'Yes' : 'No'}</span>
        </div>

        <div>
          <span className="text-neutral-400">Force Simulation:</span>{' '}
          <span>{data.forceSimulation ? 'Yes' : 'No'}</span>
        </div>

        <div>
          <span className="text-neutral-400">Autonomy Allowed:</span>{' '}
          <span>{data.autonomyAllowed ? 'Yes' : 'No'}</span>
        </div>

        <div>
          <span className="text-neutral-400">Hold Until:</span>{' '}
          <span>
            {data.holdUntil
              ? new Date(data.holdUntil).toLocaleString()
              : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}