// app/api/axpt/confirmations/gate/[gateId]/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  _req: Request,
  { params }: { params: { gateId: string } }
) {
  const gate = await prisma.gate.findUnique({
    where: { id: params.gateId },
    include: { case: true, items: true },
  });

  if (!gate) {
    return NextResponse.json(
      { ok: false, error: 'Gate not found' },
      { status: 404 }
    );
  }

  if (gate.status !== 'VERIFIED') {
    return NextResponse.json(
      { ok: false, error: 'Gate not verified' },
      { status: 400 }
    );
  }

  const confirmation = {
    caseId: gate.caseId,
    gate: gate.name,
    confirmedAt: new Date().toISOString(),
    statement:
      'Procedural readiness confirmed. This confirmation does not authorize or execute the movement of funds.',
  };

  await prisma.eventLog.create({
    data: {
      caseId: gate.caseId,
      actor: 'AXPT_SYSTEM',
      action: 'PROCEDURAL_CONFIRMATION_ISSUED',
      detail: confirmation,
    },
  });

  return NextResponse.json({ ok: true, confirmation });
}
