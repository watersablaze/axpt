type SystemStatusData = {
  globalPaused: boolean
  pausedAssets: string[]
  pausedLayers: string[]
  reason: string | null
  governorState: string
  holdUntil: string | null
  lastTransition: string | null
}

type Props = {
  data?: Partial<SystemStatusData> | null
}

const DEFAULT_STATUS: SystemStatusData = {
  globalPaused: false,
  pausedAssets: [],
  pausedLayers: [],
  reason: null,
  governorState: 'STABLE',
  holdUntil: null,
  lastTransition: null,
}

function normalizeStatus(
  data?: Partial<SystemStatusData> | null
): SystemStatusData {
  return {
    ...DEFAULT_STATUS,
    ...data,
    pausedAssets: data?.pausedAssets ?? [],
    pausedLayers: data?.pausedLayers ?? [],
  }
}

function getTone(status: SystemStatusData) {
  if (status.globalPaused || status.governorState === 'PAUSED') {
    return 'border-red-800 bg-red-950/40 text-red-300'
  }

  if (status.governorState === 'RESTRICTED') {
    return 'border-orange-800 bg-orange-950/40 text-orange-300'
  }

  if (status.governorState === 'UNSTABLE') {
    return 'border-yellow-800 bg-yellow-950/40 text-yellow-300'
  }

  return 'border-green-800 bg-green-950/30 text-green-300'
}

function readableState(status: SystemStatusData) {
  if (status.globalPaused || status.governorState === 'PAUSED') {
    return 'Paused'
  }

  if (status.governorState === 'RESTRICTED') {
    return 'Restricted'
  }

  if (status.governorState === 'UNSTABLE') {
    return 'Unstable'
  }

  return 'Stable'
}

export default function SystemStatusStrip({ data }: Props) {
  const status = normalizeStatus(data)
  const tone = getTone(status)

  return (
    <div className={`rounded-xl border px-4 py-3 ${tone}`}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <div>
          <span className="opacity-80">Governor:</span>{' '}
          <span className="font-medium">
            {status.governorState}
          </span>
        </div>

        <div>
          <span className="opacity-80">System:</span>{' '}
          <span className="font-medium">
            {readableState(status)}
          </span>
        </div>

        <div>
          <span className="opacity-80">Assets:</span>{' '}
          <span className="font-medium">
            {status.pausedAssets.length
              ? status.pausedAssets.join(', ')
              : '—'}
          </span>
        </div>

        <div>
          <span className="opacity-80">Layers:</span>{' '}
          <span className="font-medium">
            {status.pausedLayers.length
              ? status.pausedLayers.join(', ')
              : '—'}
          </span>
        </div>
      </div>

      {status.reason && (
        <div className="mt-2 text-sm">
          <span className="opacity-80">Reason:</span>{' '}
          <span className="font-medium">
            {status.reason}
          </span>
        </div>
      )}

      {status.holdUntil && (
        <div className="mt-1 text-xs opacity-80">
          Hold until:{' '}
          {new Date(status.holdUntil).toLocaleString()}
        </div>
      )}

      {status.lastTransition && (
        <div className="mt-1 text-xs opacity-80">
          Last transition:{' '}
          {new Date(status.lastTransition).toLocaleString()}
        </div>
      )}
    </div>
  )
}