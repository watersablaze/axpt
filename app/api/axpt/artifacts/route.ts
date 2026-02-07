// app/api/axpt/artifacts/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const body = await req.json();

  if (!body.caseId || !body.name || !body.type) {
    return NextResponse.json(
      { ok: false, error: 'caseId, name, and type required' },
      { status: 400 }
    );
  }

  const artifact = await prisma.artifact.create({
    data: {
      caseId: body.caseId,
      type: body.type,
      name: body.name,
      url: body.url ?? null,
      notes:
        body.type === 'SCREENSHOT'
          ? 'Non-authoritative communication record'
          : body.notes ?? null,
    },
  });

  await prisma.eventLog.create({
    data: {
      caseId: body.caseId,
      actor: body.actor ?? 'AXPT_SYSTEM',
      action: 'ARTIFACT_ATTACHED',
      detail: { artifactId: artifact.id, type: artifact.type },
    },
  });

  return NextResponse.json({ ok: true, artifact }, { status: 201 });
}
