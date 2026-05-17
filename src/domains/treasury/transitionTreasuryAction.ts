import type {
  PrismaClient,
  TransactionClient,
} from '@prisma/client'
import { prisma } from '@/infrastructure/db/prisma'

import {
  assertTreasuryActionTransition,
} from './assertTransition'

import {
  type TreasuryActionStatus,
} from './stateMachine'

export async function transitionTreasuryAction(params: {
  id: string

  to: TreasuryActionStatus

  client?: PrismaClient | TransactionClient

  data?: Record<string, unknown>

  metadata?: Record<string, unknown>
}) {
  const {
    id,
    to,
    client = prisma,
    data,
    metadata,
  } = params

  const current =
    await client.treasuryAction.findUnique({
      where: {
        id,
      },

      select: {
        status: true,
        metadata: true,
      },
    })

  if (!current) {
    throw new Error(
      'Treasury action not found'
    )
  }

  assertTreasuryActionTransition(
    current.status as TreasuryActionStatus,
    to
  )

  const updated = await client.treasuryAction.updateMany({
    where: {
      id,
      status: current.status,
    },

    // Prisma update typing escape hatch
    data: {
      ...(data ?? {}),

      status: to,

      metadata: {
        ...(current.metadata as Record<
          string,
          unknown
        > | null),

        ...(metadata ?? {}),

        lastTransitionAt:
          new Date().toISOString(),

        lastTransitionTo: to,
      },
    } as any,
  })

  if (updated.count === 0) {
    throw new Error(
      'Treasury action transition race detected'
    )
  }

  return client.treasuryAction.findUnique({
    where: {
      id,
    },
  })
}
