// app/api/axpt/cases/[caseId]/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: { caseId: string } }
) {
  try {
    const caseId = params.caseId;

    if (!caseId) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_CASE_ID' },
        { status: 400 }
      );
    }

    const found = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        gates: {
          orderBy: { ord: 'asc' },
          include: {
            items: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        artifacts: {
          orderBy: { createdAt: 'desc' },
        },
        events: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!found) {
      return NextResponse.json(
        { ok: false, error: 'CASE_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, case: found });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: 'DB_ERROR',
        message: err?.message ?? 'Unknown error',
      },
      { status: 500 }
    );
  }
}