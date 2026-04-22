// app/api/axpt/cases/[caseId]/escrow/lock/route.ts

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';
import type { Gate } from "@prisma/client"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params;

  const c = await prisma.case.findUnique({
    where: { id: caseId },
    include: { gates: true },
  });

  if (!c) {
    return NextResponse.json(
      { ok: false, error: 'CASE_NOT_FOUND' },
      { status: 404 }
    );
  }

  const allVerified =
    c.gates.length > 0 &&
    c.gates.every((g: Gate) => g.status === 'VERIFIED');

  if (!allVerified) {
    return NextResponse.json(
      { ok: false, error: 'GATES_NOT_COMPLETE' },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.case.update({
      where: { id: caseId },
      data: {
        status: 'ESCROW_INITIATED',
      },
    }),

    prisma.eventLog.create({
      data: {
        caseId,
        actor: 'AXPT_SYSTEM',
        action: 'ESCROW_LOCKED',
        detail: {},
      },
    }),
  ]);

  return NextResponse.redirect(
    new URL(`/admin/cases/${caseId}`, req.url)
  );
}