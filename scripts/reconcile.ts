import { reconcileAllAssets, classifyReconciliation } from '@/domains/reconciliation/reconcileAssets'
import { formatBaseUnits } from '@/lib/money/baseUnits'
import { getAsset } from '@/lib/assets/registry'

async function run() {
  const results = await reconcileAllAssets()

  for (const r of results) {
    const asset = getAsset(r.assetCode)

    console.log(`\n=== ${r.assetCode} ===`)
    console.log('Status:', classifyReconciliation(r))
    console.log('Ledger:', formatBaseUnits(r.ledgerSupply, asset.decimals))
    console.log('Confirmed:', formatBaseUnits(r.mirroredConfirmed, asset.decimals))
    console.log('Pending:', formatBaseUnits(r.pendingMirror, asset.decimals))
    console.log('Dead:', formatBaseUnits(r.deadLetter, asset.decimals))
    console.log('Drift:', formatBaseUnits(r.drift, asset.decimals))
  }
}

run()
