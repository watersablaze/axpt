import { prisma } from '@/infrastructure/db/prisma'
import ActionDetailPanel from '@/components/admin/treasury/actions/ActionDetailPanel'
import { evaluateApprovalIntelligence } from '@/domains/treasury/evaluateApprovalIntelligence'

async function getAction(id: string) {
  const action = await prisma.treasuryAction.findUnique({
    where: { id },
    include: {
      approvals: true,
    },
  })

  if (!action) return null

  const execution = await prisma.treasuryExecutionQueue.findFirst({
    where: { actionId: id },
  })

  const transaction = execution
    ? await prisma.transaction.findFirst({
        where: {
          id: execution.transactionId ?? undefined,
        },
      })
    : null

  const mirror = execution
    ? await prisma.chainMirrorJob.findFirst({
        where: {
          walletEventId: execution.transactionId ?? '',
        },
      })
    : null

  const initiator = await prisma.user.findUnique({
    where: { id: action.initiatorUserId },
    select: {
      email: true,
      trustScore: true,
      tier: true,
    },
  })

  const intelligence = await evaluateApprovalIntelligence(id)

  return {
    action,
    queue: execution,
    transaction,
    mirror,
    initiator,
    intelligence,
  }
}

export default async function ActionDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const data = await getAction(params.id)

  if (!data) {
    return <div className="p-6">Action not found</div>
  }

  return (
    <div className="p-6">
      <ActionDetailPanel {...data} />
    </div>
  )
}
