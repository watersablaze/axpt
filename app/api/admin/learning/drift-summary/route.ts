import { NextResponse } from 'next/server'
import { prisma } from '@/infrastructure/db/prisma'

export async function GET() {
  try {
    const rows = await prisma.circuitEvent.findMany({
      where: {
        type: {
          in: ['DRIFT_DETECTION', 'DRIFT_CORRECTION'],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })

    return NextResponse.json({
      ok: true,
      data: rows,
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? 'drift summary failed' },
      { status: 500 }
    )
  }
}