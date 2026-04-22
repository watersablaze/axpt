import { NextResponse } from 'next/server'
import { prisma } from '@/infrastructure/db/prisma'

export async function GET() {
  const start = performance.now()

  await prisma.$queryRaw`SELECT 1`

  const elapsed = (performance.now() - start).toFixed(1)

  return NextResponse.json({
    ok: true,
    latencyMs: Number(elapsed),
  })
}