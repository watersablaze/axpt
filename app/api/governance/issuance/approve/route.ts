import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/infrastructure/db/prisma'
import { requireElder } from '@/domains/auth/requireElder'

function now() {
  return new Date()
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireElder()

    const body = await req.json()

    const {
      requestId,
      proposalId,
      enforceProposal,
    } = body ?? {}

    if (!requestId) {
      return NextResponse.json(
        { error: 'requestId is required' },
        { status: 400 }
      )
    }

    // Load issuance request
    const reqRow =
      await prisma.tokenIssuanceRequest.findUnique({
        where: {
          id: requestId,
        },
      })

    if (!reqRow) {
      return NextResponse.json(
        {
          error: 'Issuance request not found',
        },
        { status: 404 }
      )
    }

    if (reqRow.status !== 'pending') {
      return NextResponse.json(
        {
          error: `Request is ${reqRow.status}, not pending`,
        },
        { status: 400 }
      )
    }

    // Optional governance enforcement
    if (enforceProposal && proposalId) {
      const proposal =
        await prisma.governanceProposal.findUnique({
          where: {
            id: proposalId,
          },
        })

      if (!proposal) {
        return NextResponse.json(
          { error: 'Proposal not found' },
          { status: 404 }
        )
      }

      if (proposal.status !== 'approved') {
        return NextResponse.json(
          {
            error: `Proposal status is ${proposal.status}, not approved`,
          },
          { status: 400 }
        )
      }

      if (
        proposal.readyAt &&
        now() < new Date(proposal.readyAt)
      ) {
        return NextResponse.json(
          {
            error: 'Timelock not yet reached',
          },
          { status: 400 }
        )
      }
    }

    const result = await prisma.$transaction(
      async (tx: any) => {

        // Check existing token
        let token = await tx.token.findUnique({
          where: {
            symbol: reqRow.symbol,
          },
        })

        // Create token if missing
        if (!token) {
          token = await tx.token.create({
            data: {
              symbol: reqRow.symbol,
              name: reqRow.name,

              decimals: reqRow.decimals,

              description:
                reqRow.purpose ?? null,

              metadata:
                reqRow.metadata ?? {},

              status: 'active',

              totalSupply: 0,

              createdById:
                reqRow.requestedBy,

              approvedById: auth.elder.userId,
            },
          })
        }

        // Mark request finalized
        const updatedReq =
          await tx.tokenIssuanceRequest.update({
            where: {
              id: reqRow.id,
            },
            data: {
              status: 'minted',

              decidedAt: now(),

              approvedTokenId: token.id,
            },
          })

        return {
          token,
          updatedReq,
        }
      }
    )

    return NextResponse.json({
      success: true,
      token: result.token,
      request: result.updatedReq,
    })
  } catch (err) {
    console.error('[ISSUANCE_APPROVE_ERROR]', err)

    return NextResponse.json(
      {
        error: 'Failed to approve issuance',
      },
      { status: 500 }
    )
  }
}