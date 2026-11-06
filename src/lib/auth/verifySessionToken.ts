import { prisma } from '@/infrastructure/db/prisma'
import { SIGNING_SECRET } from '@/infrastructure/env/secrets'
import type { SessionPayload } from '@/shared/types/auth'
import {
  verifySignedPersistedSession,
} from './verifySignedPersistedSession'

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  return verifySignedPersistedSession(
    token,
    SIGNING_SECRET,
    async (tokenId) =>
      prisma.session.findUnique({
        where: { tokenId },
        select: {
          userId: true,
          status: true,
          expiresAt: true,
          invalidatedAt: true,
          endedAt: true,
        },
      }),
  )
}
