import { jwtVerify } from 'jose'

import { prisma } from '@/infrastructure/db/prisma'
import { SIGNING_SECRET } from '@/infrastructure/env/secrets'
import type { SessionPayload } from '@/shared/types/auth'

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(
      token,
      SIGNING_SECRET,
      {
        algorithms: ['HS256'],
        clockTolerance: 60,
      }
    )

    if (
      !payload.userId ||
      !payload.email ||
      !payload.tier ||
      !payload.displayName
    ) {
      return null
    }

    const normalized =
      payload as unknown as SessionPayload

    /*
     * Legacy sessions without tokenId remain cryptographically
     * verifiable during the migration window.
     *
     * All newly-issued production sessions must carry tokenId and
     * are governed by the persistent Session record below.
     */
    if (!normalized.tokenId) {
      return normalized
    }

    const session =
      await prisma.session.findUnique({
        where: {
          tokenId: normalized.tokenId,
        },
        select: {
          userId: true,
          status: true,
          expiresAt: true,
          invalidatedAt: true,
        },
      })

    if (!session) {
      return null
    }

    if (session.userId !== normalized.userId) {
      return null
    }

    if (session.status !== 'active') {
      return null
    }

    if (session.invalidatedAt) {
      return null
    }

    if (
      session.expiresAt &&
      session.expiresAt <= new Date()
    ) {
      return null
    }

    return normalized
  } catch {
    return null
  }
}
