import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decodeSessionToken } from '@/lib/auth/session';
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

function now() {
  return new Date();
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireElder();
    if (!auth) return NextResponse.json({ error: 'Elder-only.' }, { status: 403 });

    const body = await req.json();
    const { proposalId, choice, reason } = body ?? {};
    if (!proposalId || !['yes', 'no', 'abstain'].includes(choice)) {
      return NextResponse.json({ error: 'Invalid vote payload' }, { status: 400 });
    }

    const proposal = await prisma.governanceProposal.findUnique({
      where: { id: proposalId },
      include: { votes: true },
    });
    if (!proposal) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    if (proposal.status !== 'pending') {
      return NextResponse.json({ error: `Cannot vote on ${proposal.status} proposal` }, { status: 400 });
    }

    const votingDeadline = proposal.votingEndsAt ? new Date(proposal.votingEndsAt) : null;
    if (votingDeadline && now() > votingDeadline) {
      return NextResponse.json({ error: 'Voting period has ended' }, { status: 400 });
    }

    // Upsert Elder’s vote (unique on elderId+proposalId in your schema)
    await prisma.governanceVote.upsert({
      where: {
        elderId_proposalId: { elderId: auth.elder.id, proposalId },
      } as any, // composite unique alias; if missing, switch to findFirst+update/create
      update: { choice, reason: reason ?? null },
      create: { elderId: auth.elder.id, proposalId, choice, reason: reason ?? null },
    });

    // Recompute tallies
    const allVotes = await prisma.governanceVote.findMany({
      where: { proposalId },
    });

    const yes = allVotes.filter(v => v.choice === 'yes').length;
    const no = allVotes.filter(v => v.choice === 'no').length;
    const abstain = allVotes.filter(v => v.choice === 'abstain').length;
    const total = allVotes.length;

    const quorum = proposal.quorum ?? 0;
    const approvalThreshold = proposal.approvalThreshold ?? 0;

    let status = proposal.status;
    let approvedAt = proposal.approvedAt;
    let readyAt = proposal.readyAt;

    const reachedQuorum = total >= quorum;
    const reachedApproval = yes >= approvalThreshold;

    // Auto-transition to approved when both met
    if (reachedQuorum && reachedApproval) {
      status = 'approved';
      approvedAt = now();
      const tlock = proposal.timelockSeconds ?? 0;
      readyAt = new Date(approvedAt.getTime() + tlock * 1000);
    } else {
      // If voting period ended and thresholds not met → rejected
      if (votingDeadline && now() > votingDeadline) {
        status = 'rejected';
      }
    }

    const updated = await prisma.governanceProposal.update({
      where: { id: proposalId },
      data: {
        status,
        approvedAt,
        readyAt,
        decidedAt: status === 'approved' || status === 'rejected' ? now() : proposal.decidedAt,
      },
    });

    return NextResponse.json({
      success: true,
      tallies: { yes, no, abstain, total, quorum, approvalThreshold },
      proposal: updated,
    });
  } catch (err) {
    console.error('[PROPOSAL_VOTE_ERROR]', err);
    return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
  }
}