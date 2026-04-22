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

export default function AlertsPanel({ data }: Props) {
  const alerts = data.filter(
    (a) => a.status === 'CRITICAL' || a.status === 'WARNING'
  )

  if (!alerts.length) return null

  return (
    <div className="rounded-xl border border-red-800 bg-black p-4">
      <h2 className="mb-4 text-lg text-red-400">Alerts</h2>

      {alerts.map((a) => (
        <div key={a.assetCode} className="text-sm text-red-300">
          {a.assetCode} → {a.status}
        </div>
      ))}
    </div>
  )
}
