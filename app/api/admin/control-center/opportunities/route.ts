import { NextResponse } from 'next/server'
import { getPrincipal } from '@/domains/auth/getPrincipal'

import {
  createOpportunity,
  listOpportunities,
} from '@/domains/control-center/opportunities/repository'

import {
  createOpportunityEvent,
} from '@/domains/control-center/opportunities/createOpportunityEvent'

import type {
  OpportunitySource,
  OpportunityStatus,
} from '@/domains/control-center/opportunities/types'

type CreateOpportunityBody = {
  title?: string
  source?: OpportunitySource
  status?: OpportunityStatus
  commodity?: string | null
  buyerName?: string | null
  sellerName?: string | null
  origin?: string | null
  destination?: string | null
  quantityKg?: string | null
  notes?: string | null
}

export async function GET() {
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

  const opportunities =
    await listOpportunities()

  return NextResponse.json({
    ok: true,
    opportunities,
  })
}

export async function POST(request: Request) {
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

  const body =
    (await request.json()) as CreateOpportunityBody

  if (!body.title?.trim()) {
    return NextResponse.json(
      {
        ok: false,
        error: 'TITLE_REQUIRED',
      },
      { status: 400 }
    )
  }

  const opportunity =
    await createOpportunity({
      title: body.title.trim(),
      source: body.source,
      status: body.status,
      commodity: body.commodity,
      buyerName: body.buyerName,
      sellerName: body.sellerName,
      origin: body.origin,
      destination: body.destination,
      quantityKg: body.quantityKg,
      notes: body.notes,
    })

  await createOpportunityEvent({
    opportunityId: opportunity.id,
    type: 'OPPORTUNITY_CREATED',
    actor: principal.email,
    message: 'Opportunity captured.',
    metadata: {
      source: 'control-center.opportunities',
      title: opportunity.title,
      opportunitySource: opportunity.source,
      status: opportunity.status,
    },
  })

  return NextResponse.json({
    ok: true,
    opportunity,
  })
}
