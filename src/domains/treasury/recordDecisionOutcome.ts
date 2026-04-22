import { prisma } from '@/infrastructure/db/prisma'

export async function recordDecisionOutcome(params: {
  actionId: string
  intent: string
  success: boolean
}) {
  const { actionId, intent, success } = params

  await prisma.decisionExplanation.create({
    data: {
      intent,
      summary: success
        ? 'Treasury action executed successfully'
        : 'Treasury action failed',
      factors: success
        ? ['execution_success']
        : ['execution_failure'],
    },
  })
}