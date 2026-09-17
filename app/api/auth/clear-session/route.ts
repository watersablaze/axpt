import { NextResponse } from 'next/server'

import { prisma } from '@/infrastructure/db/prisma'
import {
  clearSessionCookie,
  decodeSessionToken,
  getTokenFromCookie,
} from '@/lib/auth/session'

export async function POST() {
  try {
    const token =
      await getTokenFromCookie()

    if (token) {
      const payload =
        await decodeSessionToken(token)

      if (payload?.tokenId) {
        const now = new Date()

        await prisma.session.updateMany({
          where: {
            tokenId:
              payload.tokenId,
          },
          data: {
            status: 'invalidated',
            invalidatedAt: now,
            endedAt: now,
          },
        })
      }
    }

    await clearSessionCookie()

    return NextResponse.json({
      success: true,
      message:
        '[AXPT] Session cleared.',
    })
  } catch (error) {
    console.error(
      '[auth/logout] failed',
      error
    )

    /*
     * Always clear the browser credential even
     * if persistent-session invalidation fails.
     */
    await clearSessionCookie()

    return NextResponse.json(
      {
        success: false,
        error:
          'Session invalidation was incomplete.',
      },
      {
        status: 500,
      }
    )
  }
}
