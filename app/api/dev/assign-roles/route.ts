import { NextResponse } from 'next/server'
import { prisma } from '@/infrastructure/db/prisma'

type ResidentUser = {
  id: string
  email: string
}

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { ok: false, error: 'Not allowed in production' },
      { status: 403 }
    )
  }

  try {
    const [adminRole, residentRole] = await Promise.all([
      prisma.role.findUnique({ where: { key: 'ADMIN_PLATFORM' } }),
      prisma.role.findUnique({ where: { key: 'RESIDENT' } }),
    ])

    if (!adminRole || !residentRole) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Required roles missing. Run /api/dev/seed-roles first.',
        },
        { status: 400 }
      )
    }

    let admin = await prisma.user.findUnique({
      where: { email: 'connect@axpt.io' },
    })

    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: 'connect@axpt.io',
          username: 'connect_admin',
          passwordHash: 'DEV_PLACEHOLDER',
          name: 'AXPT Admin',
          tier: 'Board',
        },
      })
    }

    const residents: ResidentUser[] = await prisma.user.findMany({
      where: {
        email: {
          in: ['resident.a@example.com', 'resident.b@example.com'],
        },
      },
      select: { id: true, email: true },
    })

    const ops = [
      prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: admin.id,
            roleId: adminRole.id,
          },
        },
        update: {
          isActive: true,
          revokedAt: null,
        },
        create: {
          userId: admin.id,
          roleId: adminRole.id,
          isActive: true,
        },
      }),

      ...residents.map((user: ResidentUser) =>
        prisma.userRole.upsert({
          where: {
            userId_roleId: {
              userId: user.id,
              roleId: residentRole.id,
            },
          },
          update: {
            isActive: true,
            revokedAt: null,
          },
          create: {
            userId: user.id,
            roleId: residentRole.id,
            isActive: true,
          },
        })
      ),
    ]

    await Promise.all(ops)

    return NextResponse.json({
      ok: true,
      admin: admin.email,
      residents: residents.map((r: ResidentUser) => r.email),
    })
  } catch (err) {
    console.error('[DEV_ASSIGN_ROLES_ERROR]', err)

    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'assign roles failed',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return POST()
}