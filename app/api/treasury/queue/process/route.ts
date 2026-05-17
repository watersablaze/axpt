import { NextResponse } from 'next/server'
import { claimTreasuryExecutionJob } from '@/domains/treasury/claimExecuteJob'
import { processTreasuryExecutionJob } from '@/domains/treasury/processExecutionJob'
import { requirePermission } from '@/domains/auth/requirePermission'
import { PERMISSIONS } from '@/domains/auth/permissions'

export async function POST() {
const principal = await requirePermission(
  PERMISSIONS.TREASURY_EXECUTE
)

  const workerId = `api-${principal.userId}`
  const job = await claimTreasuryExecutionJob(workerId)

  if (!job) {
    return NextResponse.json({
      ok: true,
      message: 'No pending treasury execution jobs',
    })
  }

  try {
    await processTreasuryExecutionJob(job.id)

    return NextResponse.json({
      ok: true,
      jobId: job.id,
      treasuryActionId: job.treasuryActionId,
      status: 'EXECUTED',
    })
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        jobId: job.id,
        treasuryActionId: job.treasuryActionId,
        error: err instanceof Error ? err.message : 'Execution failed',
      },
      { status: 500 }
    )
  }
}
