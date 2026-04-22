import PendingActionsPanel from '@/components/admin/treasury/PendingActionsPanel'
import ExecutionQueuePanel from '@/components/admin/treasury/ExecutionQueuePanel'
import FailedExecutionsPanel from '@/components/admin/treasury/FailedExecutionsPanel'
import TreasuryActionStatsPanel from '@/components/admin/treasury/actions/TreasuryActionStatsPanel'
import { prisma } from '@/infrastructure/db/prisma'

async function getData() {
  const [
    pending,
    queue,
    failed,
    stats,
  ] = await Promise.all([
    prisma.treasuryAction.findMany({
      where: { status: 'PENDING' },
      include: { approvals: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.treasuryExecutionQueue.findMany({
      where: { status: { in: ['PENDING', 'PROCESSING'] } },
    }),
    prisma.treasuryExecutionQueue.findMany({
      where: { status: 'FAILED' },
    }),
    prisma.treasuryAction.groupBy({
      by: ['status'],
      _count: true,
    }),
  ])

  return { pending, queue, failed, stats }
}

export default async function TreasuryActionsPage() {
  const data = await getData()

  return (
    <div className="space-y-6">

      {/* Top Stats */}
      <TreasuryActionStatsPanel data={data.stats} />

      <div className="grid gap-6 lg:grid-cols-2">

        {/* LEFT: Actions */}
        <div className="space-y-6">
          <PendingActionsPanel actions={data.pending} />
        </div>

        {/* RIGHT: Execution */}
        <div className="space-y-6">
          <ExecutionQueuePanel items={data.queue} />
          <FailedExecutionsPanel items={data.failed} />
        </div>

      </div>

    </div>
  )
}
