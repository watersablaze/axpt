import {
  normalizeObject,
  normalizeRows,
} from '@/components/admin/treasury/contracts/panel'

import type { ThreeLayerReconciliationReport } from '@/domains/reconciliation/reconcileThreeLayer'

type IntegrityResult = {
  totalEvents: number
  mismatches: Array<Record<string, unknown>>
}

type ChainVerificationData = {
  integrity: IntegrityResult
  threeLayer: ThreeLayerReconciliationReport
}

type Props = {
  data?: Partial<ChainVerificationData> | null
}

const DEFAULT_THREE_LAYER: ThreeLayerReconciliationReport = {
  generatedAt: new Date(0),
  mismatches: [],
  assets: [],
  totals: {
    mismatchCount: 0,
    assetCount: 0,
  },
}

const DEFAULT_DATA: ChainVerificationData = {
  integrity: {
    totalEvents: 0,
    mismatches: [],
  },
  threeLayer: DEFAULT_THREE_LAYER,
}

function normalizeData(
  data?: Partial<ChainVerificationData> | null
): ChainVerificationData {
  const normalized = normalizeObject(data, DEFAULT_DATA)

  return {
    ...normalized,

    integrity: {
      ...DEFAULT_DATA.integrity,
      ...normalized.integrity,
      mismatches: normalizeRows(
        normalized.integrity?.mismatches
      ),
    },

    threeLayer: {
      ...DEFAULT_DATA.threeLayer,
      ...normalized.threeLayer,

      generatedAt:
        normalized.threeLayer?.generatedAt ??
        DEFAULT_DATA.threeLayer.generatedAt,

      mismatches: normalizeRows(
        normalized.threeLayer?.mismatches
      ),

      assets: normalizeRows(
        normalized.threeLayer?.assets
      ),

      totals: {
        ...DEFAULT_DATA.threeLayer.totals,
        ...normalized.threeLayer?.totals,
      },
    },
  }
}

export default function ChainVerificationPanel({
  data,
}: Props) {
  const status = normalizeData(data)

  const criticalAssets = status.threeLayer.assets.filter(
    (asset) =>
      asset.status === 'CRITICAL' ||
      asset.status === 'WARNING'
  )

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <h2 className="mb-4 text-lg">
        Chain Verification
      </h2>

      <div>Total Events: {status.integrity.totalEvents}</div>

      <div>
        Integrity Mismatches:{' '}
        {status.integrity.mismatches.length}
      </div>

      <div>
        Three-Layer Mismatches:{' '}
        {status.threeLayer.totals.mismatchCount}
      </div>

      <div>
        Assets Tracked: {status.threeLayer.totals.assetCount}
      </div>

      {(status.integrity.mismatches.length > 0 ||
        status.threeLayer.totals.mismatchCount > 0) && (
        <div className="mt-4 text-red-400">
          ⚠ Integrity issues detected
        </div>
      )}

      {criticalAssets.length > 0 && (
        <div className="mt-4 space-y-2 text-sm">
          {criticalAssets.map((asset) => (
            <div
              key={asset.assetCode}
              className="text-orange-300"
            >
              {asset.assetCode}: {asset.status} (
              {asset.mismatchCount} mismatches)
            </div>
          ))}
        </div>
      )}
    </div>
  )
}