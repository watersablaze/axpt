import type {
  AssetReconciliationSnapshot,
  ReconciliationStatus,
} from '@/domains/reconciliation/reconcileAssets'
import { formatBaseUnits } from '@/lib/money/baseUnits'
import { getAsset } from '@/lib/assets/registry'

type Props = {
  data: Array<
    AssetReconciliationSnapshot & {
      status: ReconciliationStatus
    }
  >
}

export default function MirrorPipelinePanel({ data }: Props) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg">Mirror Pipeline</h2>

      {data.map((asset) => {
        const meta = getAsset(asset.assetCode)

        return (
        <div key={asset.assetCode} className="mb-4 text-sm">
          <div className="font-medium">{asset.assetCode}</div>

          <div>Pending Mirror: {formatBaseUnits(asset.pendingMirror, meta.decimals)}</div>
          <div>Dead Letters: {formatBaseUnits(asset.deadLetter, meta.decimals)}</div>
        </div>
        )
      })}
    </div>
  )
}
