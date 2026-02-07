export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertCaseNotLocked } from '@/lib/axpt/guards/assertCaseNotLocked';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.gateId || !body.description) {
      return NextResponse.json(
        { ok: false, error: 'gateId and description required' },
        { status: 400 }
      );
    }

    const gate = await prisma.gate.findUnique({
      where: { id: body.gateId },
      select: { caseId: true },
    });

    if (!gate) throw new Error('GATE_NOT_FOUND');

    await assertCaseNotLocked(gate.caseId);

    const item = await prisma.verificationItem.create({
      data: {
        gateId: body.gateId,
        description: body.description,
        status: 'OPEN',
      },
    });

    await prisma.eventLog.create({
      data: {
        caseId: gate.caseId,
        actor: body.actor ?? 'AXPT_SYSTEM',
        action: 'VERIFICATION_ITEM_CREATED',
        detail: { verificationItemId: item.id },
      },
    });

    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (err: any) {
    const code = err?.code || err?.message;
    return NextResponse.json(
      { ok: false, error: code },
      { status: code === 'CASE_LOCKED_AFTER_ESCROW' ? 403 : 500 }
    );
  }
}