export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/db/prisma';
import { PrismaClient } from "@prisma/client"

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>

export async function POST(req: Request) {
  const body = await req.json();
  const { title, jurisdiction, mode } = body;

  if (!title) {
    return NextResponse.json(
      { ok: false, error: 'MISSING_TITLE' },
      { status: 400 }
    );
  }

  const result = await prisma.$transaction(async (tx: Tx) => {
    const c = await tx.case.create({
      data: {
        title,
        jurisdiction,
        mode: mode ?? 'COORDINATION_ONLY',

        // ✅ ACTIVATION = STRUCTURE EXISTS
        status: 'ACTIVE',

        gates: {
          create: [
            { ord: 1, name: 'Identity Verification' },
            { ord: 2, name: 'Asset Verification' },
            { ord: 3, name: 'Terms Confirmation' },
            { ord: 4, name: 'Final Custodial Review' },
          ],
        },
      },
      include: { gates: true },
    });

    await tx.eventLog.create({
      data: {
        caseId: c.id,
        actor: 'AXPT_SYSTEM',
        action: 'CASE_CREATED',
      },
    });

    return c;
  });

  return NextResponse.json({ ok: true, case: result });
}