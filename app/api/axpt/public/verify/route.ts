// app/api/axpt/public/verify/route.ts

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type AnchorDetail = {
  verificationId?: string;
  chain?: string;
  digest?: string;
  txHash?: string;
  explorerUrl?: string;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ ok: false, error: 'MISSING_TOKEN' }, { status: 400 });
  }

  const record = await prisma.publicVerification.findUnique({
    where: { id: token },
    include: {
      case: {
        select: {
          id: true,
          title: true,
          jurisdiction: true,
          mode: true,
          status: true,
          gates: {
            where: { ord: 4 },
            select: { status: true, updatedAt: true },
          },
        },
      },
      artifact: {
        select: {
          id: true,
          type: true,
          hash: true,
          createdAt: true,
        },
      },
    },
  });

  if (!record) {
    return NextResponse.json({ ok: false, error: 'INVALID_TOKEN' }, { status: 404 });
  }

  if (record.expiresAt && record.expiresAt < new Date()) {
    return NextResponse.json({ ok: false, error: 'TOKEN_EXPIRED' }, { status: 410 });
  }

  // If revoked, still return ok:true with verification.status = REVOKED
  const revoked = Boolean(record.revokedAt);

  const gate4 = record.case.gates[0] ?? null;

  // Fetch latest anchor event for this verification token (best-effort)
  // NOTE: This assumes Postgres JSON querying; if your Prisma version/db setup
  // doesn’t support this filter, we can fallback to fetch by caseId then filter in JS.
  let anchorEvent = null as null | {
    createdAt: Date;
    detail: any;
  };

  try {
    anchorEvent = await prisma.eventLog.findFirst({
      where: {
        caseId: record.caseId,
        action: 'VERIFICATION_ANCHORED',
        detail: {
          path: ['verificationId'],
          equals: record.id,
        },
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, detail: true },
    });
  } catch {
    // Fallback: fetch latest anchor events for the case and filter in JS
    const candidates = await prisma.eventLog.findMany({
      where: { caseId: record.caseId, action: 'VERIFICATION_ANCHORED' },
      orderBy: { createdAt: 'desc' },
      take: 25,
      select: { createdAt: true, detail: true },
    });

    anchorEvent =
      candidates.find((e: any) => (e.detail as AnchorDetail)?.verificationId === record.id) ?? null;
  }

  const ad = (anchorEvent?.detail ?? {}) as AnchorDetail;

  // Pull pdfHash from the escrow handoff initiated event (best-effort)
  const handoffEvent = await prisma.eventLog.findFirst({
    where: {
      caseId: record.caseId,
      action: 'ESCROW_HANDOFF_INITIATED',
    },
    orderBy: { createdAt: 'desc' },
    select: { detail: true, createdAt: true },
  });

  const pdfHash = (handoffEvent?.detail as any)?.pdfHash ?? null;

  return NextResponse.json({
    ok: true,

    case: {
      id: record.case.id,
      title: record.case.title,
      jurisdiction: record.case.jurisdiction,
      mode: record.case.mode,
      status: record.case.status,
    },

    proceduralReadiness: {
      verified: gate4?.status === 'VERIFIED',
      verifiedAt: gate4?.updatedAt ?? null,
    },

    verification: {
      id: record.id,
      scope: record.scope,
      status: revoked ? 'REVOKED' : 'VERIFIED',
      issuedAt: record.createdAt,
      expiresAt: record.expiresAt ?? null,

      revokedAt: record.revokedAt ?? null,
      revokedBy: record.revokedBy ?? null,
      revokedReason: record.revokedReason ?? null,

      artifact: {
        id: record.artifact.id,
        type: record.artifact.type,
        hash: record.artifact.hash, // zip hash
        createdAt: record.artifact.createdAt,
      },

      pdfHash, // escrow summary pdf hash (from event detail)
    },

    anchor: anchorEvent
      ? {
          chain: ad.chain ?? null,
          digest: ad.digest ?? null,
          txHash: ad.txHash ?? null,
          explorerUrl: ad.explorerUrl ?? null,
          anchoredAt: anchorEvent.createdAt,
        }
      : null,

    disclaimer:
      'AXPT provides procedural verification only. This record confirms completion status of defined verification gates as of the issued timestamp. ' +
      'It does not constitute custody of funds, settlement authority, payment instruction, escrow agency, fiduciary duty, legal advice, or transaction execution. ' +
      'Parties remain solely responsible for diligence, contracting, compliance, and all settlement actions.',
  });
}
