// app/api/governance/issuance/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { decodeSessionToken } from '@/lib/auth/session';

function now() { return new Date(); }

async function requireElder() {
  const jar = await cookies();
  const raw = jar.get('axpt_session')?.value;
  if (!raw) return null;
  const payload = await decodeSessionToken(raw);
  if (!payload?.userId) return null;

  const elder = await prisma.councilElder.findUnique({
    where: { userId: String(payload.userId) },
  });
  return elder ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const elder = await requireElder();
    if (!elder) {
      return NextResponse.json({ error: 'Elder-only.' }, { status: 403 });
    }

    const body = await req.json();
    const { requestId, proposalId, enforceProposal } = body ?? {};
    if (!requestId) {
      return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
    }

    // Load request
    const reqRow = await prisma.tokenIssuanceRequest.findUnique({
      where: { id: requestId },
    });
    if (!reqRow) return NextResponse.json({ error: 'Issuance request not found' }, { status: 404 });

    if (reqRow.status !== 'pending') {
      return NextResponse.json(
        { error: `Request is ${reqRow.status}, not pending` },
        { status: 400 }
      );
    }

    // If proposal enforcement is on, verify proposal is approved and out of timelock
    if (enforceProposal && proposalId) {
      const prop = await prisma.governanceProposal.findUnique({ where: { id: proposalId } });
      if (!prop) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
      if (prop.status !== 'approved') {
        return NextResponse.json({ error: `Proposal status is ${prop.status}, not approved` }, { status: 400 });
      }
      if (prop.readyAt && now() < new Date(prop.readyAt)) {
        return NextResponse.json({ error: 'Timelock not yet reached' }, { status: 400 });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Check if token exists for symbol
      let token = await tx.token.findUnique({ where: { symbol: reqRow.symbol } });

      // Create if missing
      if (!token) {
        token = await tx.token.create({
          data: {
            symbol: reqRow.symbol,
            name: reqRow.name,
            decimals: reqRow.decimals,
            description: reqRow.purpose ?? null,
            metadata: reqRow.metadata ?? {},
            status: 'active',
            totalSupply: 0,
            createdById: reqRow.requestedBy,
            approvedById: elder.id,
          },
        });
      }

      // Link the request → token and mark status
      const updatedReq = await tx.tokenIssuanceRequest.update({
        where: { id: reqRow.id },
        data: {
          status: 'minted',        // phase‑1: approval == execution
          decidedAt: now(),
          approvedTokenId: token.id,
        },
      });

      return { token, updatedReq };
    });

    return NextResponse.json({ success: true, token: result.token, request: result.updatedReq });
  } catch (err) {
    console.error('[ISSUANCE_APPROVE_ERROR]', err);
    return NextResponse.json(
      { error: 'Failed to approve issuance' },
      { status: 500 }
    );
  }
}