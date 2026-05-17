import { NextResponse } from 'next/server'
import { prisma } from '@/infrastructure/db/prisma'

import { requirePermission } from '@/domains/auth/requirePermission'
import { PERMISSIONS } from '@/domains/auth/permissions'

export async function GET() {
  await requirePermission(
    PERMISSIONS.TREASURY_READ
  )

  const actions = await prisma.treasuryAction.findMany({
    where: {
      status: 'PENDING',
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return NextResponse.json({
    ok: true,
    actions,
  })
}