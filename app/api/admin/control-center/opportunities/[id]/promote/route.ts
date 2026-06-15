import { NextResponse } from 'next/server'
import { getPrincipal } from '@/domains/auth/getPrincipal'

import {
  promoteOpportunityToDossier,
} from '@/domains/control-center/opportunities/promoteOpportunityToDossier'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function POST(
  _request: Request,
  context: RouteContext
) {
  const principal = await getPrincipal()

  if (!principal) {
    return NextResponse.json(
      {
        ok: false,
        error: 'UNAUTHORIZED',
      },
      { status: 401 }
    )
  }

  const { id } = await context.params

  try {
    const result =
      await promoteOpportunityToDossier({
        opportunityId: id,
        operatorEmail: principal.email,
      })

    return NextResponse.json({
      ok: true,
      result,
    })
  } catch (err) {
    console.error(
      '[OPPORTUNITY_PROMOTION_FAILED]',
      err
    )

    const message =
      err instanceof Error
        ? err.message
        : 'OPPORTUNITY_PROMOTION_FAILED'

    const status =
      message === 'OPPORTUNITY_NOT_FOUND'
        ? 404
        : message === 'OPPORTUNITY_NOT_PROMOTABLE'
          ? 409
          : 500

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status }
    )
  }
}
