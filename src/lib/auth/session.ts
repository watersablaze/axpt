'use server'

import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

import { COOKIE_NAME, SESSION_COOKIE_NAME } from '@/shared/constants/cookies'
import { SIGNING_SECRET } from '@/infrastructure/env/secrets'
import type { SessionPayload } from '@/shared/types/auth'
import { verifySessionToken } from './verifySessionToken'

const allowedDocs = ['whitepaper', 'hemp', 'chinje'] as const
type DocType = typeof allowedDocs[number]
type SessionTokenInput = Omit<SessionPayload, 'iat' | 'exp' | 'roles'> & {
  roles?: SessionPayload['roles']
}

const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function getCookieConfig() {
  const isProd = process.env.NODE_ENV === 'production'

  return {
    httpOnly: true,
    secure: isProd,
    path: '/',
    sameSite: isProd ? ('none' as const) : ('lax' as const),
    maxAge: SESSION_MAX_AGE,
  }
}

function normalizePayload(payload: any): SessionPayload | null {
  if (
    !payload?.userId ||
    !payload?.tier ||
    !payload?.displayName ||
    !payload?.popupMessage ||
    !payload?.greeting ||
    !payload?.email ||
    !payload?.partner ||
    !payload?.docs ||
    !payload?.iat ||
    !payload?.exp
  ) {
    return null
  }

  return {
    userId: payload.userId,
    tier: payload.tier,
    roles: Array.isArray(payload.roles)
      ? payload.roles.filter(
          (role: unknown): role is SessionPayload['roles'][number] =>
            typeof role === 'string'
        )
      : [],
    displayName: payload.displayName,
    popupMessage: payload.popupMessage,
    greeting: payload.greeting,
    email: payload.email,
    partner: payload.partner,
    docs: (payload.docs as string[]).filter(
      (doc): doc is DocType => allowedDocs.includes(doc as DocType)
    ),
    iat: payload.iat,
    exp: payload.exp,
  }
}

/**
 * Create signed session JWT
 */
export async function createSessionToken(
  payload: SessionTokenInput
): Promise<string> {
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + SESSION_MAX_AGE

  return await new SignJWT({
    ...payload,
    roles: payload.roles ?? [],
    iat,
    exp,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(SIGNING_SECRET)
}

/**
 * Write session cookie
 */
export async function createSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.set(COOKIE_NAME, token, getCookieConfig())
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE_NAME, '', {
    ...getCookieConfig(),
    maxAge: 0,
  })
}

/**
 * Read raw token from cookie
 */
export async function getTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()

  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null
}

/**
 * Lightweight JWT decode/verify
 * (No revocation check — legacy/fallback only)
 */
export async function decodeSessionToken(
  tokenFromHeader?: string
): Promise<SessionPayload | null> {
  const token = tokenFromHeader || (await getTokenFromCookie())

  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, SIGNING_SECRET)
    return normalizePayload(payload)
  } catch (err) {
    console.warn('Invalid session token:', err)
    return null
  }
}

/**
 * Canonical secure session reader
 * Includes revocation verification
 */
export async function getSessionFromCookie(): Promise<SessionPayload | null> {
  const token = await getTokenFromCookie()

  console.log('[auth/session] cookie token present', !!token)

  if (!token) return null

  const payload = await verifySessionToken(token)

  console.log('[auth/session] verifySessionToken result', {
    valid: !!payload,
    hasPayload: !!payload,
    userId: payload?.userId ?? null,
    email: payload?.email ?? null,
  })

  if (!payload) return null

  return normalizePayload(payload)
}

/**
 * Legacy alias
 */
export async function getTokenSession(): Promise<SessionPayload | null> {
  return await getSessionFromCookie()
}
