import { NextResponse } from 'next/server'
import { prisma } from '@/infrastructure/db/prisma'

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { ok: false, error: 'Not allowed in production' },
      { status: 403 }
    )
  }

  try {
    const roles = [
      {
        key: 'ADMIN_PLATFORM',
        label: 'Platform Administrator',
        isSystem: true,
      },
      {
        key: 'TREASURY_OPERATOR',
        label: 'Treasury Operator',
        isSystem: true,
      },
      {
        key: 'RESIDENT',
        label: 'Resident',
        isSystem: true,
      },
    ]

    const out = await Promise.all(
      roles.map((role) =>
        prisma.role.upsert({
          where: { key: role.key },
          update: {
            label: role.label,
            isSystem: role.isSystem,
          },
          create: role,
        })
      )
    )

    return NextResponse.json({ ok: true, roles: out })
  } catch (err) {
    console.error('[DEV_SEED_ROLES_ERROR]', err)
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'seed roles failed',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return POST()
}