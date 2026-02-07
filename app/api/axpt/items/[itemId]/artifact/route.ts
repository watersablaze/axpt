// app/api/axpt/items/[itemId]/artifact/route.ts

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(
  req: Request,
  { params }: { params: { itemId: string } }
) {
  const item = await prisma.verificationItem.findUnique({
    where: { id: params.itemId },
    include: { gate: true },
  });

  if (!item) {
    return NextResponse.json(
      { ok: false, error: 'ITEM_NOT_FOUND' },
      { status: 404 }
    );
  }

  const form = await req.formData();
  const file = form.get('file') as File | null;

  if (!file) {
    return NextResponse.json(
      { ok: false, error: 'NO_FILE_PROVIDED' },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');

  const artifact = await prisma.artifact.create({
    data: {
      caseId: item.gate.caseId,
      verificationItemId: item.id,
      type: 'SUPPORTING_DOCUMENT',
      name: file.name,
      hash,
      size: buffer.length,
      mimeType: file.type,
      storage: 'LOCAL', // future: S3/R2
    },
  });

  await prisma.eventLog.create({
    data: {
      caseId: item.gate.caseId,
      actor: 'PARTY_UPLOAD',
      action: 'ARTIFACT_UPLOADED',
      detail: {
        artifactId: artifact.id,
        verificationItemId: item.id,
      },
    },
  });

  return NextResponse.json(
    { ok: true, artifact },
    { status: 201 }
  );
}