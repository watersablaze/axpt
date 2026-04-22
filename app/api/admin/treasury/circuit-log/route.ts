// app/api/admin/treasury/circuit-log/route.ts

import { prisma } from '@/infrastructure/db/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const events = await prisma.circuitEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ ok: true, data: events })
}