export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';
import { PrismaClient } from "@prisma/client"

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>

export async function POST(
  req: Request,
  { params }: { params: Promise<{ caseId: string; gateId: string }> }
) {
  // ✅ FIX 1: await params
  const { caseId, gateId } = await params;

  // ✅ FIX 2: safe body parse (form posts have no JSON)
  const body = await req.json().catch(() => ({}));

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

  if (gate.status === 'VERIFIED') {
    return NextResponse.json(
      { ok: false, error: 'GATE_ALREADY_VERIFIED' },
      { status: 409 }
    );
  }

  await prisma.$transaction(async (tx: Tx) => {
    await tx.gate.update({
      where: { id: gateId },
      data: { status: 'VERIFIED' },
    });

    await tx.eventLog.create({
      data: {
        caseId,
        actor: body.actor ?? 'AXPT_ADMIN',
        action: 'GATE_VERIFIED',
        detail: {
          gateId,
          gateName: gate.name,
          notes: body.notes ?? null,
        },
      },
    });
  });

  return NextResponse.redirect(
    new URL(`/admin/cases/${caseId}`, req.url)
  );
}