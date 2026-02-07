export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_GATES } from '@/lib/axpt/defaultGates';
import { DEFAULT_GATE_ITEM_TEMPLATES } from '@/lib/axpt/gateTemplates';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body?.title || typeof body.title !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'title is required' },
        { status: 400 }
      );
    }

    /**
     * 1️⃣ WRITE PHASE — short transaction
     */
    const caseId = await prisma.$transaction(async (tx: any) => {
      const c = await tx.case.create({
        data: {
          title: body.title.trim(),
          jurisdiction: body.jurisdiction ?? null,
          mode: body.mode ?? 'COORDINATION_ONLY',
          status: body.status ?? 'ACTIVE',
        },
      });

      const gateDefs =
        Array.isArray(DEFAULT_GATES) && DEFAULT_GATES.length
          ? DEFAULT_GATES
          : [
              { ord: 1, name: 'Gate 1 — Party Authority' },
              { ord: 2, name: 'Gate 2 — Transaction Alignment' },
              { ord: 3, name: 'Gate 3 — System Readiness' },
              { ord: 4, name: 'Gate 4 — Procedural Readiness' },
            ];

      const gates = await Promise.all(
        gateDefs.map((g) =>
          tx.gate.create({
            data: {
              caseId: c.id,
              ord: g.ord,
              name: g.name,
            },
          })
        )
      );

      for (const gate of gates) {
        const templates = DEFAULT_GATE_ITEM_TEMPLATES[gate.ord];
        if (!templates) continue;

        await tx.verificationItem.createMany({
          data: templates.map((t, idx) => ({
            gateId: gate.id,
            ord: idx + 1,
            description: t.description,
            status: 'OPEN',
          })),
        });
      }

      await tx.eventLog.create({
        data: {
          caseId: c.id,
          actor: 'AXPT_SYSTEM',
          action: 'CASE_CREATED',
          detail: { seededTemplates: true },
        },
      });

      // ✅ return ONLY the ID
      return c.id;
    });

    /**
     * 2️⃣ READ / HYDRATION PHASE — OUTSIDE transaction
     */
    const hydrated = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        gates: {
          orderBy: { ord: 'asc' },
          include: {
            items: {
              orderBy: { ord: 'asc' },
            },
          },
        },
      },
    });

    if (!hydrated) {
      throw new Error('CASE_HYDRATION_FAILED');
    }

    return NextResponse.json(
      { ok: true, case: hydrated },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('CASE_CREATE_FAILED', err);
    return NextResponse.json(
      {
        ok: false,
        error: 'CASE_CREATE_FAILED',
        message: err?.message ?? 'Unknown error',
      },
      { status: 500 }
    );
  }
}
