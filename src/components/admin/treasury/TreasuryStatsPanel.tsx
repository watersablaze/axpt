import { formatBaseUnits } from '@/lib/money/baseUnits'
import { getAsset } from '@/lib/assets/registry'
import type {
  AssetReconciliationSnapshot,
  ReconciliationStatus,
} from '@/domains/reconciliation/reconcileAssets'

type Props = {
  data: Array<
    AssetReconciliationSnapshot & {
      status: ReconciliationStatus
    }
  >
}

export default function TreasuryStatsPanel({ data }: Props) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg">Financial State</h2>

      <div className="space-y-3">
        {data.map((asset) => {
          const meta = getAsset(asset.assetCode)

          return (
            <div key={asset.assetCode} className="text-sm">
              <div className="font-medium">{asset.assetCode}</div>

              <div>Ledger: {formatBaseUnits(asset.ledgerSupply, meta.decimals)}</div>
              <div>Confirmed: {formatBaseUnits(asset.mirroredConfirmed, meta.decimals)}</div>
              <div>Pending: {formatBaseUnits(asset.pendingMirror, meta.decimals)}</div>
              <div>Dead: {formatBaseUnits(asset.deadLetter, meta.decimals)}</div>
              <div>Drift: {formatBaseUnits(asset.drift, meta.decimals)}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
