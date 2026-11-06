import { jwtVerify } from 'jose'

import type { SessionPayload } from '@/shared/types/auth'
import {
  isActivePersistedSession,
  type PersistedSessionRecord,
} from './sessionRecordPolicy'

export type SessionLookup = (
  tokenId: string
) => Promise<PersistedSessionRecord | null>

export async function verifySignedPersistedSession(
  token: string,
  signingSecret: Uint8Array,
  lookup: SessionLookup,
  now: Date = new Date(),
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, signingSecret, {
      algorithms: ['HS256'],
      clockTolerance: 60,
    })

    if (
      typeof payload.userId !== 'string' ||
      !payload.userId ||
      typeof payload.tokenId !== 'string' ||
      !payload.tokenId ||
      typeof payload.email !== 'string' ||
      !payload.email ||
      typeof payload.tier !== 'string' ||
      !payload.tier ||
      typeof payload.displayName !== 'string' ||
      !payload.displayName
    ) {
      return null
    }

    const session = await lookup(payload.tokenId)

    if (
      !isActivePersistedSession(
        session,
        payload.userId,
        now,
      )
    ) {
      return null
    }

    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}
