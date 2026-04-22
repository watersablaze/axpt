import { reconcileAllAssets } from '@/domains/reconciliation/reconcileAssets'
import { prisma } from '@/infrastructure/db/prisma'

export async function evaluatePostExecution(actionId: string) {
  const snapshots = await reconcileAllAssets()

  const driftAssets = snapshots.filter(
    (s) => s.drift !== 0n
  )

  if (driftAssets.length > 0) {
    await prisma.treasuryAlertLog.create({
      data: {
        fingerprint: `drift-${actionId}-${Date.now()}`,
        severity: 'WARNING',
        message: `Drift detected after treasury execution`,
      },
    })
  }

  return {
    driftAssets,
  }
}