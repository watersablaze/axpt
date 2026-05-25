import { NextResponse } from 'next/server'

import type { ControlCenterSnapshot } from '@/components/panels/contracts/controlCenter'

import { prisma } from '@/infrastructure/db/prisma'
import { requirePermission } from '@/domains/auth/requirePermission'
import { PERMISSIONS } from '@/domains/auth/permissions'

export async function GET() {
  await requirePermission(PERMISSIONS.TREASURY_READ)

  const [
    pendingActions,
    queuedExecutions,
    failedExecutions,
  ] = await Promise.all([
    prisma.treasuryAction.count({
      where: { status: 'PENDING' },
    }),

    prisma.treasuryExecutionQueue.count({
      where: {
        status: {
          in: ['PENDING', 'CLAIMED', 'EXECUTING'],
        },
      },
    }),

    prisma.treasuryExecutionQueue.count({
      where: {
        status: {
          in: ['FAILED_RETRYABLE', 'FAILED_FINAL'],
        },
      },
    }),
  ])

  const snapshot: ControlCenterSnapshot = {
    timestamp: Date.now(),

    system: {
      health: failedExecutions > 0 ? 0.78 : 0.92,
      drift: failedExecutions > 0 ? 0.18 : 0.1,
      stability: failedExecutions > 0 ? 0.72 : 0.88,
      status: failedExecutions > 0 ? 'WATCH' : 'STABLE',
    },

    execution: {
      pending: queuedExecutions,
      successRate: failedExecutions > 0 ? 0.91 : 1,
      activeJobs: queuedExecutions,
    },

    treasury: {
      pendingActions,
      queuedExecutions,
      failedExecutions,
    },

    reconciliation: {
      driftScore: 0,
      anomalies: failedExecutions,
      lastSync: null,
    },

    chain: {
      network: 'UNKNOWN',
      latestIndexedBlock: null,
      lagSeconds: null,
    },

    governance: {
      riskScore: failedExecutions > 0 ? 0.22 : 0.08,
      activeLocks: 0,
      riskLevel: failedExecutions > 0 ? 'MEDIUM' : 'LOW',
    },

    authority: {
      mode:
        process.env.ETK_PHASE_2_SHADOW === 'false'
          ? 'ENFORCED'
          : 'SHADOW',
      lastDecision: null,
    },
  }

  return NextResponse.json({
    ok: true,
    snapshot,
  })
}