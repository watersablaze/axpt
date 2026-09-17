import { randomUUID } from 'node:crypto'

import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

import { isAdmin } from '@/domains/auth/isAdmin'
import {
  createSessionCookie,
  createSessionToken,
} from '@/lib/auth/session'
import { prisma } from '@/infrastructure/db/prisma'
import type { SessionPayload } from '@/shared/types/auth'

const MAX_ATTEMPTS = 5
const SESSION_MAX_AGE_SECONDS =
  60 * 60 * 24 * 7

type TransactionClient = Omit<
  typeof prisma,
  | '$connect'
  | '$disconnect'
  | '$on'
  | '$transaction'
  | '$use'
  | '$extends'
>

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

function normalizePin(value: unknown) {
  if (typeof value !== 'string') return null

  const pin = value.trim()

  if (!/^\d{6}$/.test(pin)) {
    return null
  }

  return pin
}

function unauthorized() {
  return NextResponse.json(
    {
      ok: false,
      error: 'Invalid or expired access code.',
    },
    {
      status: 401,
    }
  )
}

function getRequestIp(request: Request) {
  const forwarded =
    request.headers.get('x-forwarded-for')

  if (!forwarded) return null

  return (
    forwarded
      .split(',')[0]
      ?.trim() || null
  )
}

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return unauthorized()
  }

  const record =
    typeof body === 'object' &&
    body !== null
      ? body
      : null

  const email = normalizeEmail(
    record && 'email' in record
      ? record.email
      : null
  )

  const pin = normalizePin(
    record && 'pin' in record
      ? record.pin
      : null
  )

  if (!email || !pin) {
    return unauthorized()
  }

  const challenge =
    await prisma.pinLoginRequest.findUnique({
      where: {
        email,
      },
    })

  if (
    !challenge ||
    challenge.consumedAt ||
    challenge.expiresAt <= new Date() ||
    challenge.attemptCount >= MAX_ATTEMPTS
  ) {
    return unauthorized()
  }

  const validPin =
    await bcrypt.compare(
      pin,
      challenge.pinHash
    )

  if (!validPin) {
    const nextAttemptCount =
      challenge.attemptCount + 1

    await prisma.pinLoginRequest.updateMany({
      where: {
        id: challenge.id,
        consumedAt: null,
      },
      data: {
        attemptCount: {
          increment: 1,
        },
        consumedAt:
          nextAttemptCount >= MAX_ATTEMPTS
            ? new Date()
            : undefined,
      },
    })

    return unauthorized()
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      email: true,
      tier: true,
      displayName: true,
      name: true,
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
    return unauthorized()
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
    return unauthorized()
  }

  const tokenId = randomUUID()
  const now = new Date()

  const expiresAt = new Date(
    now.getTime() +
      SESSION_MAX_AGE_SECONDS * 1000
  )

  const userAgent =
    request.headers.get('user-agent')

  const ip = getRequestIp(request)

  try {
    await prisma.$transaction(
      async (tx: TransactionClient) => {
        const consumed =
          await tx.pinLoginRequest.updateMany({
            where: {
              id: challenge.id,
              email,
              consumedAt: null,
              expiresAt: {
                gt: now,
              },
              attemptCount: {
                lt: MAX_ATTEMPTS,
              },
            },
            data: {
              consumedAt: now,
            },
          })

        if (consumed.count !== 1) {
          throw new Error(
            'AUTH_PIN_ALREADY_CONSUMED'
          )
        }

        await tx.session.create({
          data: {
            userId: user.id,
            tokenId,
            status: 'active',
            startedAt: now,
            expiresAt,
            ip,
            userAgent,
            deviceInfo: userAgent,
          },
        })
      }
    )
  } catch (error) {
    console.error(
      '[auth/login/verify] session transaction failed',
      error
    )

    return unauthorized()
  }

  const token = await createSessionToken({
    userId: user.id,
    tokenId,
    tier: 'operations',
    roles:
      roles as SessionPayload['roles'],
    displayName:
      user.displayName ??
      user.name ??
      'Operator',
    popupMessage:
      'AXPT operator session established.',
    greeting: 'Welcome back',
    email: user.email,
    partner: 'AXPT',
    docs: ['whitepaper'],
  })

  try {
    await createSessionCookie(token)
  } catch (error) {
    await prisma.session.updateMany({
      where: {
        tokenId,
      },
      data: {
        status: 'invalidated',
        invalidatedAt: new Date(),
        endedAt: new Date(),
      },
    })

    throw error
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      lastLogin: now,
      loginCount: {
        increment: 1,
      },
    },
  })

  return NextResponse.json({
    ok: true,
  })
}
