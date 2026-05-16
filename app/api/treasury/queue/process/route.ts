import { NextResponse } from 'next/server'
import { getPrincipal } from '@/domains/auth/getPrincipal'
import { claimTreasuryExecutionJob } from '@/domains/treasury/claimExecuteJob'
import { processTreasuryExecutionJob } from '@/domains/treasury/processExecutionJob'
import { isAdmin as hasAdminAccess } from "@/domains/auth/isAdmin"

export async function POST() {
  const principal = await getPrincipal()

  if (!principal) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  if (!hasAdminAccess(principal)) {
    return NextResponse.json(
      { ok: false, error: 'Not authorized to process treasury queue' },
      { status: 403 }
    )
  }

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
