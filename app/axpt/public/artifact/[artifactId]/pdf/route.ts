// app/api/axpt/public/artifact/[artifactId]/pdf/route.ts

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: { artifactId: string } }
) {
  const artifactId = params.artifactId;

  const artifact = await prisma.artifact.findUnique({
    where: { id: artifactId },
    include: {
      case: true,
      publicVerifications: true,
    },
  });

  if (!artifact) {
    return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
  }

  if (artifact.type !== 'ESCROW_HANDOFF_PACKET') {
    return NextResponse.json(
      { ok: false, error: 'INVALID_ARTIFACT_TYPE' },
      { status: 400 }
    );
  }

  const verification = artifact.publicVerifications[0];
  if (!verification) {
    return NextResponse.json(
      { ok: false, error: 'NO_PUBLIC_ACCESS' },
      { status: 403 }
    );
  }

  // You can optionally store PDF separately later.
  // For now this endpoint exists for forward compatibility.

  return NextResponse.json(
    {
      ok: true,
      message:
        'PDF is embedded within the escrow handoff ZIP. Direct PDF extraction endpoint reserved.',
    },
    { status: 501 }
  );
}