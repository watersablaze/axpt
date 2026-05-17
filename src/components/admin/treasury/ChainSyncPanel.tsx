import { normalizeObject } from '@/components/admin/treasury/contracts/panel'

type ChainSyncData = {
  lastSyncedBlock: string | null
  latestIndexedBlock: string | null
  latestIndexedAt: string | null
  chainId: number
  network: string
  lagSeconds?: number | null
}

type Props = {
  data?: Partial<ChainSyncData> | null
}

const DEFAULT_DATA: ChainSyncData = {
  lastSyncedBlock: null,
  latestIndexedBlock: null,
  latestIndexedAt: null,
  chainId: 0,
  network: 'UNKNOWN',
  lagSeconds: null,
}

function normalizeData(
  data?: Partial<ChainSyncData> | null
): ChainSyncData {
  return normalizeObject(
    data,
    DEFAULT_DATA
  )
}

export default function ChainSyncPanel({
  data,
}: Props) {
  const statusData = normalizeData(data)

  const isInitialized = Boolean(
    statusData.lastSyncedBlock ||
    statusData.latestIndexedBlock
  )

  const status = isInitialized
    ? 'Active'
    : 'Not yet initialized'

  const helperText = isInitialized
    ? null
    : 'Waiting for first sync.'

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg">
        Chain Sync
      </h2>

      <div className="space-y-2 text-sm">
        <div>
          Status:{' '}
          <span
            className={
              isInitialized
                ? 'text-green-400'
                : 'text-yellow-400'
            }
          >
            {status}
          </span>
        </div>

        {helperText && (
          <div className="text-neutral-400">
            {helperText}
          </div>
        )}

        <div>
          Network: {statusData.network}
        </div>

        <div>
          Chain ID: {statusData.chainId}
        </div>

        <div>
          Last Synced Block:{' '}
          {statusData.lastSyncedBlock ?? '—'}
        </div>

        <div>
          Latest Indexed Block:{' '}
          {statusData.latestIndexedBlock ?? '—'}
        </div>

        <div>
          Lag Seconds:{' '}
          {typeof statusData.lagSeconds ===
          'number'
            ? Math.round(
                statusData.lagSeconds
              )
            : '—'}
        </div>

        <div>
          Latest Indexed At:{' '}
          {statusData.latestIndexedAt
            ? new Date(
                statusData.latestIndexedAt
              ).toLocaleString()
            : '—'}
        </div>
      </div>
    </div>
  )
}