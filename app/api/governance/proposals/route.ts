import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decodeSessionToken } from '@/lib/auth/session'; // uses your existing util
import { cookies } from 'next/headers';

async function requireElder() {
  const cookie = (await cookies()).get('axpt_session')?.value;
  if (!cookie) return null;
  const payload = await decodeSessionToken(cookie);
  if (!payload?.userId) return null;

  const elder = await prisma.councilElder.findUnique({
    where: { userId: payload.userId },
  });
  return elder ? { elder, userId: payload.userId as string } : null;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireElder();
    if (!auth) return NextResponse.json({ error: 'Elder-only.' }, { status: 403 });

    const body = await req.json();
    const {
      title,
      description,
      kind,
      payload,
      quorum,
      approvalThreshold,
      votingEndsAt,     // ISO string or null
      timelockSeconds,  // number or null
    } = body ?? {};

    if (!title || !kind) {
      return NextResponse.json({ error: 'title and kind are required' }, { status: 400 });
    }

    const proposal = await prisma.governanceProposal.create({
      data: {
        authorElderId: auth.elder.id,
        title,
        description: description ?? null,
        kind,
        payload: payload ?? {},
        quorum: quorum ?? null,
        approvalThreshold: approvalThreshold ?? null,
        votingEndsAt: votingEndsAt ? new Date(votingEndsAt) : null,
        timelockSeconds: timelockSeconds ?? null,
        status: 'pending',
      },
    });

    return NextResponse.json({ success: true, proposal });
  } catch (err) {
    console.error('[PROPOSAL_CREATE_ERROR]', err);
    return NextResponse.json({ error: 'Failed to create proposal' }, { status: 500 });
  }
}