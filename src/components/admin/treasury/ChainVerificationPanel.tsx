import type { ThreeLayerReconciliationReport } from '@/domains/reconciliation/reconcileThreeLayer'

type IntegrityResult = {
  totalEvents: number
  mismatches: Array<Record<string, unknown>>
}

type Props = {
  data: {
    integrity: IntegrityResult
    threeLayer: ThreeLayerReconciliationReport
  }
}

export default function ChainVerificationPanel({ data }: Props) {
  const criticalAssets = data.threeLayer.assets.filter(
    (asset) => asset.status === 'CRITICAL' || asset.status === 'WARNING'
  )

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg">Chain Verification</h2>

      <div>Total Events: {data.integrity.totalEvents}</div>
      <div>Integrity Mismatches: {data.integrity.mismatches.length}</div>
      <div>Three-Layer Mismatches: {data.threeLayer.totals.mismatchCount}</div>
      <div>Assets Tracked: {data.threeLayer.totals.assetCount}</div>

      {(data.integrity.mismatches.length > 0 || data.threeLayer.totals.mismatchCount > 0) && (
        <div className="mt-4 text-red-400">
          ⚠ Integrity issues detected
        </div>
      )}

      {criticalAssets.length > 0 && (
        <div className="mt-4 space-y-2 text-sm">
          {criticalAssets.map((asset) => (
            <div key={asset.assetCode} className="text-orange-300">
              {asset.assetCode}: {asset.status} ({asset.mismatchCount} mismatches)
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
