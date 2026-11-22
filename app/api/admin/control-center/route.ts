import { NextResponse } from 'next/server'

import type { ControlCenterSnapshot } from '@/components/panels/contracts/controlCenter'

import { prisma } from '@/infrastructure/db/prisma'
import { requirePermission } from '@/domains/auth/requirePermission'
import { PERMISSIONS } from '@/domains/auth/permissions'

export async function GET() {
  await requirePermission(PERMISSIONS.TREASURY_READ)

  try {
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
      health: null,
      drift: null,
      stability: null,
      status: 'UNKNOWN',
    },

    execution: {
      pending: queuedExecutions,
      successRate: null,
      activeJobs: null,
    },

    treasury: {
      pendingActions,
      queuedExecutions,
      failedExecutions,
    },

    reconciliation: {
      driftScore: null,
      anomalies: null,
      lastSync: null,
    },

    chain: {
      network: 'UNKNOWN',
      latestIndexedBlock: null,
      lagSeconds: null,
    },

    governance: {
      riskScore: null,
      activeLocks: null,
      riskLevel: 'UNKNOWN',
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
  }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error
      && typeof error.code === 'string' ? error.code : 'UNKNOWN';
    console.error('[CONTROL_CENTER_SNAPSHOT_UNAVAILABLE]', { code });
    return NextResponse.json(
      { ok: false, error: 'CONTROL_CENTER_SNAPSHOT_UNAVAILABLE' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

}