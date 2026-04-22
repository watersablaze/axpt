import { NextResponse } from 'next/server'
import { prisma } from '@/infrastructure/db/prisma'

export async function GET() {
  try {
    const rows = await prisma.decisionExplanation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      ok: true,
      data: rows,
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    )
  }
}