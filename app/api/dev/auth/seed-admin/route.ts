import { NextResponse } from 'next/server'
import { prisma } from '@/infrastructure/db/prisma'

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { ok: false, error: 'Not available in production' },
      { status: 403 }
    )
  }

  const email = 'connect@axpt.io'

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      username: 'connect',
      passwordHash: 'DEV_PLACEHOLDER',
      name: 'AXPT Admin',
      displayName: 'AXPT Admin',
      tier: 'platform',
      isAdmin: true,
    },
    update: {
      isAdmin: true,
      displayName: 'AXPT Admin',
      tier: 'platform',
    },
  })

  const adminRole = await prisma.role.findUnique({
    where: { key: 'ADMIN_PLATFORM' },
  })

  if (!adminRole) {
    return NextResponse.json(
      {
        ok: false,
        error: 'ADMIN_PLATFORM_ROLE_NOT_FOUND',
      },
      { status: 500 }
    )
  }

  await prisma.userRole.createMany({
    data: [
      {
        userId: user.id,
        roleId: adminRole.id,
      },
    ],
    skipDuplicates: true,
  })

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin,
    },
    role: adminRole.key,
  })
}