type Props = {
  data: {
    lastSyncedBlock: string | null
    latestIndexedBlock: string | null
    latestIndexedAt: string | null
    chainId: number
    network: string
    lagSeconds?: number | null
  }
}

export default function ChainSyncPanel({ data }: Props) {
  const isInitialized = Boolean(data.lastSyncedBlock || data.latestIndexedBlock)
  const status = isInitialized
    ? 'Active'
    : 'Not yet initialized'
  const helperText = isInitialized
    ? null
    : 'Waiting for first sync.'

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg">Chain Sync</h2>

      <div className="space-y-2 text-sm">
        <div>
          Status:{' '}
          <span className={isInitialized ? 'text-green-400' : 'text-yellow-400'}>
            {status}
          </span>
        </div>
        {helperText && <div className="text-neutral-400">{helperText}</div>}
        <div>Network: {data.network}</div>
        <div>Chain ID: {data.chainId}</div>
        <div>Last Synced Block: {data.lastSyncedBlock ?? '—'}</div>
        <div>Latest Indexed Block: {data.latestIndexedBlock ?? '—'}</div>
        <div>
          Lag Seconds:{' '}
          {typeof data.lagSeconds === 'number'
            ? Math.round(data.lagSeconds)
            : '—'}
        </div>
        <div>
          Latest Indexed At:{' '}
          {data.latestIndexedAt
            ? new Date(data.latestIndexedAt).toLocaleString()
            : '—'}
        </div>
      </div>
    </div>
  )
}
