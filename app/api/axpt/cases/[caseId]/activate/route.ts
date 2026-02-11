// app/api/axpt/cases/[caseId]/activate/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { assertCaseCanActivate } from '@/lib/guards/caseState';

type TxClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export async function POST(
  _req: Request,
  { params }: { params: { caseId: string } }
) {
  const { caseId } = params;
  if (!caseId) {
    return NextResponse.json(
      { ok: false, error: 'MISSING_CASE_ID' },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.$transaction(async (tx: TxClient) => {
      const c = await tx.case.findUnique({
        where: { id: caseId },
      });

      if (!c) throw new Error('CASE_NOT_FOUND');

      assertCaseCanActivate(c.status);

      const updatedCase = await tx.case.update({
        where: { id: caseId },
        data: { status: 'ACTIVE' },
      });

      await tx.eventLog.create({
        data: {
          caseId,
          actor: 'AXPT_SYSTEM',
          action: 'CASE_ACTIVATED',
          detail: {
            previousStatus: c.status,
          },
        },
      });

      return updatedCase;
    });

    return NextResponse.json({ ok: true, case: updated });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 400 }
    );
  }
}
