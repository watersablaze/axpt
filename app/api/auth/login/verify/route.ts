import { NextResponse } from 'next/server'

import {
  createSessionCookie,
  createSessionToken,
} from '@/lib/auth/session'
import { prisma } from '@/infrastructure/db/prisma'
import {
  createInstitutionalPinVerificationDependencies,
} from '@/domains/auth/institutionalPinVerificationAdapter'
import {
  verifyInstitutionalLoginPin,
  type InstitutionalAudience,
} from '@/domains/auth/verifyInstitutionalLoginPin'
import type { SessionPayload } from '@/shared/types/auth'

const noStore = {
  'Cache-Control': 'no-store',
}

function unauthorized() {
  return NextResponse.json(
    {
      ok: false,
      error: 'Invalid or expired access code.',
    },
    {
      status: 401,
      headers: noStore,
    },
  )
}

function unavailable() {
  return NextResponse.json(
    {
      ok: false,
      error: 'AUTH_PIN_VERIFY_NOT_OPERATIONAL',
    },
    {
      status: 503,
      headers: noStore,
    },
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

function presentationForAudience(
  audience: InstitutionalAudience,
) {
  if (audience === 'FRENCH_WARD_GOVERNING') {
    return {
      popupMessage:
        'French-Ward institutional session established.',
      docs: [] as SessionPayload['docs'],
    }
  }

  if (audience === 'FRENCH_WARD_INSTITUTIONAL') {
    return {
      popupMessage:
        'French-Ward institutional session established.',
      docs: [] as SessionPayload['docs'],
    }
  }

  if (audience === 'REPRESENTATIVE') {
    return {
      popupMessage:
        'AXPT representative session established.',
      docs: [] as SessionPayload['docs'],
    }
  }

  if (audience === 'INSTITUTIONAL_VISITOR') {
    return {
      popupMessage:
        'AXPT institutional visitor session established.',
      docs: [] as SessionPayload['docs'],
    }
  }

  return {
    popupMessage:
      'AXPT operator session established.',
    docs: ['whitepaper'] as SessionPayload['docs'],
  }
}

async function revokePersistedSession(
  tokenId: string,
) {
  const now = new Date()

  await prisma.session.updateMany({
    where: {
      tokenId,
    },
    data: {
      status: 'invalidated',
      invalidatedAt: now,
      endedAt: now,
    },
  })
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
      ? body as Record<string, unknown>
      : {}

  let result:
    Awaited<
      ReturnType<typeof verifyInstitutionalLoginPin>
    >

  try {
    result =
      await verifyInstitutionalLoginPin(
        createInstitutionalPinVerificationDependencies({
          ip: getRequestIp(request),
          userAgent:
            request.headers.get('user-agent'),
        }),
        record.email,
        record.pin,
      )
  } catch (error) {
    console.error(
      '[auth/login/verify] verification unavailable',
      error,
    )

    return unavailable()
  }

  if (!result.ok) {
    return unauthorized()
  }

  const session = result.session

  const presentation =
    presentationForAudience(
      session.audience,
    )

  /*
   * Session persistence has already succeeded.
   *
   * Token signing and cookie issuance therefore form one
   * fail-closed boundary: either both complete, or the newly
   * persisted session is invalidated before this request can
   * report success.
   */
  try {
    const token =
      await createSessionToken({
        userId: session.userId,
        tokenId: session.tokenId,
        tier: session.tier,
        roles:
          session.roles as SessionPayload['roles'],
        displayName:
          session.displayName,
        email:
          session.email,
        popupMessage:
          presentation.popupMessage,
        greeting:
          'Welcome back',
        partner:
          'AXPT',
        docs:
          presentation.docs,
      })

    await createSessionCookie(token)
  } catch (error) {
    console.error(
      '[auth/login/verify] token or cookie issuance failed',
      error,
    )

    try {
      await revokePersistedSession(
        session.tokenId,
      )
    } catch (revokeError) {
      console.error(
        '[auth/login/verify] persisted session revocation failed',
        revokeError,
      )
    }

    return unavailable()
  }

  return NextResponse.json(
    {
      ok: true,
      audience: session.audience,
    },
    {
      status: 200,
      headers: noStore,
    },
  )
}
