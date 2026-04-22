import { NextResponse } from 'next/server'
import { reconcileThreeLayer } from '@/domains/reconciliation/reconcileThreeLayer'
import { evaluateCircuitBreaker } from '@/lib/system/circuitBreaker'
import { prisma } from '@/infrastructure/db/prisma'

function serializeReport(report: Awaited<ReturnType<typeof reconcileThreeLayer>>) {
  return {
    generatedAt: report.generatedAt.toISOString(),
    mismatches: report.mismatches,
    assets: report.assets.map((asset) => ({
      ...asset,
      ledgerBalanceTotal: asset.ledgerBalanceTotal.toString(),
      mirrorJobTotal: asset.mirrorJobTotal.toString(),
      confirmedMirrorJobTotal: asset.confirmedMirrorJobTotal.toString(),
      chainEventTotal: asset.chainEventTotal.toString(),
    })),
    totals: report.totals,
  }
}

export async function GET() {
  try {
    const report = await reconcileThreeLayer()

    // Calculate sync lag
    const latestEvent = await prisma.chainMirrorEvent.findFirst({
      orderBy: { blockNumber: 'desc' },
      select: {
        createdAt: true,
      },
    })

    const syncLagSeconds = latestEvent?.createdAt
      ? (Date.now() - new Date(latestEvent.createdAt).getTime()) / 1000
      : null

    // Run circuit breaker after reconciliation and sync status calculation
    await evaluateCircuitBreaker({
      mismatches: report.mismatches,
      syncLagSeconds,
    })

    return NextResponse.json({ ok: true, data: serializeReport(report) })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? 'reconciliation failed' },
      { status: 500 }
    )
  }
}
