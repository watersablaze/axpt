import { NextResponse } from 'next/server'
import { prisma } from '@/infrastructure/db/prisma'
import { getPrincipal } from '@/domains/auth/getPrincipal'

export async function GET() {
  const principal = await getPrincipal()

  if (!principal) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const actions = await prisma.treasuryAction.findMany({
    where: {
      status: 'PENDING',
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ ok: true, actions })
}