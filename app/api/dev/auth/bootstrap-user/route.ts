import { NextResponse } from 'next/server'
import { prisma } from '@/infrastructure/db/prisma'
import { createSessionToken } from '@/lib/auth/session'
import { COOKIE_NAME } from '@/shared/constants/cookies'

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { ok: false, error: 'Not available in production' },
      { status: 403 }
    )
  }

  const { email } = await req.json()

  if (!email) {
    return NextResponse.json(
      { ok: false, error: 'Missing email' },
      { status: 400 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      userRoles: {
        where: { isActive: true, revokedAt: null },
        include: { role: true },
      },
    },
  })

  if (!user) {
    return NextResponse.json(
      { ok: false, error: 'User not found' },
      { status: 404 }
    )
  }

  const token = await createSessionToken({
    userId: user.id,
    tier: user.tier as any,
    roles: user.userRoles.map(
      (userRole: { role: { key: string } }) => userRole.role.key
    ),
    displayName: user.displayName ?? user.name ?? 'User',
    popupMessage: `Dev session: ${user.email}`,
    greeting: 'Welcome back',
    email: user.email,
    partner: 'AXPT',
    docs: ['whitepaper'],
  })

  const response = NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      roles: user.userRoles.map(
        (userRole: { role: { key: string } }) => userRole.role.key
      ),
    },
  })

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return response
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: 'Use POST' },
    { status: 405 }
  )
}
