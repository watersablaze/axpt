import { NextResponse } from 'next/server'

import { appealReviewFlow } from '@/domains/security/appealReviewFlow'

import { requirePermission } from '@/domains/auth/requirePermission'
import { PERMISSIONS } from '@/domains/auth/permissions'

export async function POST(req: Request) {
  try {
    const principal = await requirePermission(
      PERMISSIONS.SYSTEM_MANAGE_AUTH
    )

    const body = await req.json()

    const {
      userId,
      decision,
      reason,
    } = body

    if (!userId || !decision) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      )
    }

    const result = await appealReviewFlow({
      userId,
      decision,
      reason: reason ?? 'Manual review',
      reviewedByUserId: principal.userId,
    })

    return NextResponse.json({
      ok: true,
      result,
    })
  } catch (err) {
    console.error('[APPEAL_REVIEW_ERROR]', err)

    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to process appeal',
      },
      { status: 500 }
    )
  }
}