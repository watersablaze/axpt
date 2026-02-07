// app/api/axpt/cases/[caseId]/revoke/escrow/route.ts

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: { caseId: string } }
) {
  const caseId = params.caseId;

  const body = await req.json().catch(() => ({} as any));
  const reason: string | undefined = body?.reason;

  try {
    const out = await prisma.$transaction(async (tx: any) => {
      const verification = await tx.publicVerification.findFirst({
        where: {
          caseId,
          scope: 'escrow',
          revokedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!verification) {
        return NextResponse.json(
          { ok: false, error: 'NO_ACTIVE_ESCROW_VERIFICATION' },
          { status: 404 }
        );
      }

      await tx.publicVerification.update({
        where: { id: verification.id },
        data: {
          revokedAt: new Date(),
          revokedReason: reason ?? 'Revoked by AXPT administrator',
          revokedBy: 'AXPT_INTERNAL',
        },
      });

      await tx.eventLog.create({
        data: {
          caseId,
          actor: 'AXPT_SYSTEM',
          action: 'ESCROW_VERIFICATION_REVOKED',
          detail: {
            verificationId: verification.id,
            reason: reason ?? null,
          },
        },
      });

      return NextResponse.json({ ok: true, verificationId: verification.id });
    });

    return out;
  } catch (err: any) {
    console.error('REVOKE_ESCROW_FAILED', err);
    return NextResponse.json(
      { ok: false, error: 'REVOKE_ESCROW_FAILED', message: err?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
