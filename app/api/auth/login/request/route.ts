import { randomInt } from 'node:crypto'

import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

import { isAdmin } from '@/domains/auth/isAdmin'
import { sendLoginPin } from '@/domains/auth/sendLoginPin'
import { prisma } from '@/infrastructure/db/prisma'

const PIN_TTL_MINUTES = 10
const REQUEST_COOLDOWN_MS = 60_000

const GENERIC_RESPONSE = {
  ok: true,
  message:
    'If this address is authorized, an access code has been sent.',
}

type AuthRoleGrant = {
  role: {
    key: string
    rolePermissions: Array<{
      permission: {
        key: string
      }
    }>
  }
}

function normalizeEmail(value: unknown) {
  if (typeof value !== 'string') return null

  const email = value.trim().toLowerCase()

  if (
    email.length < 3 ||
    email.length > 254 ||
    !email.includes('@')
  ) {
    return null
  }

  return email
}

function createPin() {
  return randomInt(0, 1_000_000)
    .toString()
    .padStart(6, '0')
}

async function genericDelay() {
  await new Promise((resolve) =>
    setTimeout(resolve, 250)
  )
}

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      GENERIC_RESPONSE,
      { status: 202 }
    )
  }

  const email = normalizeEmail(
    typeof body === 'object' &&
    body !== null &&
    'email' in body
      ? body.email
      : null
  )

  if (!email) {
    await genericDelay()

    return NextResponse.json(
      GENERIC_RESPONSE,
      { status: 202 }
    )
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      userRoles: {
        where: {
          isActive: true,
          revokedAt: null,
        },
        select: {
          role: {
            select: {
              key: true,
              rolePermissions: {
                select: {
                  permission: {
                    select: {
                      key: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!user) {
    await genericDelay()

    return NextResponse.json(
      GENERIC_RESPONSE,
      { status: 202 }
    )
  }

  const roleGrants =
    user.userRoles as AuthRoleGrant[]

  const roles: string[] =
    roleGrants.map(
      (userRole) => userRole.role.key
    )

  const permissions: string[] =
    Array.from(
      new Set(
        roleGrants.flatMap(
          (userRole) =>
            userRole.role.rolePermissions.map(
              (rolePermission) =>
                rolePermission.permission.key
            )
        )
      )
    )

  if (
    !isAdmin({
      roles,
      permissions,
    })
  ) {
    await genericDelay()

    return NextResponse.json(
      GENERIC_RESPONSE,
      { status: 202 }
    )
  }

  const existing =
    await prisma.pinLoginRequest.findUnique({
      where: {
        email,
      },
      select: {
        updatedAt: true,
        expiresAt: true,
        consumedAt: true,
      },
    })

  const now = Date.now()

  if (
    existing &&
    !existing.consumedAt &&
    existing.expiresAt.getTime() > now &&
    existing.updatedAt.getTime() >
      now - REQUEST_COOLDOWN_MS
  ) {
    return NextResponse.json(
      GENERIC_RESPONSE,
      { status: 202 }
    )
  }

  const pin = createPin()
  const pinHash = await bcrypt.hash(pin, 12)

  const expiresAt = new Date(
    Date.now() +
      PIN_TTL_MINUTES * 60 * 1000
  )

  await prisma.pinLoginRequest.upsert({
    where: {
      email,
    },
    create: {
      email,
      pinHash,
      attemptCount: 0,
      expiresAt,
      consumedAt: null,
    },
    update: {
      pinHash,
      attemptCount: 0,
      expiresAt,
      consumedAt: null,
    },
  })

  try {
    await sendLoginPin({
      email,
      pin,
      expiresInMinutes:
        PIN_TTL_MINUTES,
    })
  } catch (error) {
    console.error(
      '[auth/login/request] PIN delivery failed',
      error
    )

    await prisma.pinLoginRequest.deleteMany({
      where: {
        email,
        pinHash,
      },
    })
  }

  return NextResponse.json(
    GENERIC_RESPONSE,
    { status: 202 }
  )
}
