export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertCaseEditable } from '@/lib/guards/caseState';

export async function POST(
  req: Request,
  { params }: { params: { caseId: string; gateId: string } }
) {
  const { caseId, gateId } = params;
  const body = await req.json();

  if (!caseId || !gateId) {
    return NextResponse.json(
      { ok: false, error: 'MISSING_PARAMS' },
      { status: 400 }
    );
  }

  const gate = await prisma.gate.findUnique({
    where: { id: gateId },
    include: { case: true },
  });

  if (!gate || gate.caseId !== caseId) {
    return NextResponse.json(
      { ok: false, error: 'GATE_NOT_FOUND' },
      { status: 404 }
    );
  }

  // 🔐 LAW: case must still be mutable
  assertCaseEditable(gate.case.status);

  if (gate.status === 'VERIFIED') {
    return NextResponse.json({
      ok: true,
      gate,
      message: 'Gate already verified',
    });
  }

  const updatedGate = await prisma.gate.update({
    where: { id: gateId },
    data: { status: 'VERIFIED' },
  });

  await prisma.eventLog.create({
    data: {
      caseId,
      actor: body.actor ?? 'AXPT_SYSTEM',
      action: 'GATE_VERIFIED',
      detail: {
        gateId,
        gateName: gate.name,
        notes: body.notes ?? null,
      },
    },
  });

  return NextResponse.json({ ok: true, gate: updatedGate });
}