import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/infrastructure/db/prisma'
import { requireResident } from '@/domains/auth/requireResident'

export async function POST(req: NextRequest) {
  try {
    const principal = await requireResident()

    const body = await req.json()

    const {
      symbol,
      name,
      decimals,
      purpose,
      projectId,
      metadata,
    } = body ?? {}

    if (!symbol || !name) {
      return NextResponse.json(
        { error: 'symbol and name are required' },
        { status: 400 }
      )
    }

    // Prevent duplicate active requests
    const existing = await prisma.tokenIssuanceRequest.findFirst({
      where: {
        symbol,
        status: {
          in: ['pending', 'approved'],
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        {
          error: 'A request for this symbol already exists.',
        },
        { status: 409 }
      )
    }

    const request = await prisma.tokenIssuanceRequest.create({
      data: {
        requestedBy: principal.userId,

        projectId: projectId ?? null,

        symbol,
        name,

        decimals:
          typeof decimals === 'number'
            ? decimals
            : 2,

        purpose: purpose ?? null,

        metadata: metadata ?? {},

        status: 'pending',
      },
    })

    return NextResponse.json({
      success: true,
      request,
    })
  } catch (err) {
    console.error('[ISSUANCE_REQUEST_ERROR]', err)

    return NextResponse.json(
      {
        error: 'Failed to create issuance request',
      },
      { status: 500 }
    )
  }
}