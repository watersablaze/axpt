import { NextResponse } from 'next/server'
import { getPrincipal } from '@/domains/auth/getPrincipal'
import { appealReviewFlow } from '@/domains/security/appealReviewFlow'

export async function POST(req: Request) {
  try {
    const principal = await getPrincipal()

    if (!principal) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }

    // 🔒 Only admins / elders can review appeals
    if (
      !principal.roles.includes('ADMIN_PLATFORM') &&
      !principal.roles.includes('COUNCIL_ELDER')
    ) {
      return NextResponse.json(
        { ok: false, error: 'Not authorized' },
        { status: 403 }
      )
    }

    const body = await req.json()

    const { userId, decision, reason } = body

    if (!userId || !decision) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields' },
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
      { ok: false, error: 'Failed to process appeal' },
      { status: 500 }
    )
  }
}