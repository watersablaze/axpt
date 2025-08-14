// app/api/governance/issuance/request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { decodeSessionToken } from '@/lib/auth/session';

async function requireResident(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get('axpt_session')?.value;
  if (!raw) return null;
  const payload = await decodeSessionToken(raw);
  return payload?.userId ? String(payload.userId) : null;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireResident();
    if (!userId) {
      return NextResponse.json({ error: 'Login required.' }, { status: 401 });
    }

    const body = await req.json();
    const { symbol, name, decimals, purpose, projectId, metadata } = body ?? {};

    if (!symbol || !name) {
      return NextResponse.json({ error: 'symbol and name are required' }, { status: 400 });
    }

    // Guard against duplicates (pending/approved)
    const existing = await prisma.tokenIssuanceRequest.findFirst({
      where: { symbol, status: { in: ['pending', 'approved'] } },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'A request for this symbol already exists.' },
        { status: 409 }
      );
    }

    const reqRow = await prisma.tokenIssuanceRequest.create({
      data: {
        requestedBy: userId,
        projectId: projectId ?? null,
        symbol,
        name,
        decimals: typeof decimals === 'number' ? decimals : 2,
        purpose: purpose ?? null,
        metadata: metadata ?? {},
        status: 'pending',
      },
    });

    return NextResponse.json({ success: true, request: reqRow });
  } catch (err) {
    console.error('[ISSUANCE_REQUEST_ERROR]', err);
    return NextResponse.json(
      { error: 'Failed to create issuance request' },
      { status: 500 }
    );
  }
}