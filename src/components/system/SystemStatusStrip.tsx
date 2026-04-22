type Props = {
  data: {
    globalPaused: boolean
    pausedAssets: string[]
    pausedLayers: string[]
    reason: string | null
    governorState: string
    holdUntil: string | null
    lastTransition: string | null
  }
}

function getTone(data: Props['data']) {
  if (data.globalPaused || data.governorState === 'PAUSED') {
    return 'border-red-800 bg-red-950/40 text-red-300'
  }
  if (data.governorState === 'RESTRICTED') {
    return 'border-orange-800 bg-orange-950/40 text-orange-300'
  }
  if (data.governorState === 'UNSTABLE') {
    return 'border-yellow-800 bg-yellow-950/40 text-yellow-300'
  }
  return 'border-green-800 bg-green-950/30 text-green-300'
}

function readableState(data: Props['data']) {
  if (data.globalPaused || data.governorState === 'PAUSED') return 'Paused'
  if (data.governorState === 'RESTRICTED') return 'Restricted'
  if (data.governorState === 'UNSTABLE') return 'Unstable'
  return 'Stable'
}

export default function SystemStatusStrip({ data }: Props) {
  const tone = getTone(data)

  return (
    <div className={`rounded-xl border px-4 py-3 ${tone}`}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <div>
          <span className="opacity-80">Governor:</span>{' '}
          <span className="font-medium">{data.governorState}</span>
        </div>

        <div>
          <span className="opacity-80">System:</span>{' '}
          <span className="font-medium">{readableState(data)}</span>
        </div>

        <div>
          <span className="opacity-80">Assets:</span>{' '}
          <span className="font-medium">
            {data.pausedAssets.length ? data.pausedAssets.join(', ') : '—'}
          </span>
        </div>

        <div>
          <span className="opacity-80">Layers:</span>{' '}
          <span className="font-medium">
            {data.pausedLayers.length ? data.pausedLayers.join(', ') : '—'}
          </span>
        </div>
      </div>

      {data.reason && (
        <div className="mt-2 text-sm">
          <span className="opacity-80">Reason:</span>{' '}
          <span className="font-medium">{data.reason}</span>
        </div>
      )}

      {data.holdUntil && (
        <div className="mt-1 text-xs opacity-80">
          Hold until: {new Date(data.holdUntil).toLocaleString()}
        </div>
      )}

      {data.lastTransition && (
        <div className="mt-1 text-xs opacity-80">
          Last transition: {new Date(data.lastTransition).toLocaleString()}
        </div>
      )}
    </div>
  )
}