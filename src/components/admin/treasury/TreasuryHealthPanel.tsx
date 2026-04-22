'use client'

import { useEntity } from '@/lib/context/EntityContext'
import type { AssetCode } from '@/lib/assets/registry'
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

export default function TreasuryHealthPanel({ data }: Props) {
  const { entity, setEntity } = useEntity()
  const activeAssets = entity.assets

  return (
    <div className="grid grid-cols-3 gap-4">
      {data.map((asset) => {
        const selected = activeAssets.includes(asset.assetCode)

        return (
          <div
            key={asset.assetCode}
            onClick={() =>
              setEntity((prev) => {
                const exists = prev.assets.includes(asset.assetCode as AssetCode)

                return {
                  ...prev,
                  assets: exists
                    ? prev.assets.filter((code) => code !== asset.assetCode)
                    : [...prev.assets, asset.assetCode as AssetCode],
                }
              })
            }
            className={`cursor-pointer rounded-xl border p-4 transition-colors ${
              selected
                ? 'border-green-500 bg-neutral-900'
                : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
            }`}
          >
            <div className="text-sm text-neutral-400">
              {asset.assetCode}
            </div>

            <div
              className={`text-lg font-medium ${
                asset.status === 'HEALTHY'
                  ? 'text-green-400'
                  : asset.status === 'IN_FLIGHT'
                  ? 'text-yellow-400'
                  : asset.status === 'WARNING'
                  ? 'text-orange-400'
                  : 'text-red-400'
              }`}
            >
              {asset.status}
            </div>

            <div className="mt-2 text-xs text-neutral-500">
              Snapshot: {new Date(asset.timestamp).toISOString()}
            </div>
          </div>
        )
      })}
    </div>
  )
}
