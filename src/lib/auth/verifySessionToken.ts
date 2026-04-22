import { jwtVerify } from 'jose'
import { SIGNING_SECRET } from '@/infrastructure/env/secrets'
import type { SessionPayload } from '@/shared/types/auth'

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SIGNING_SECRET, {
      algorithms: ['HS256'],
      clockTolerance: 60,
    })

    if (
      !payload.userId ||
      !payload.email ||
      !payload.tier ||
      !payload.displayName
    ) {
      return null
    }

    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}