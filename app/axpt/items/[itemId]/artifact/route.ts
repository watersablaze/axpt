export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

export async function POST(
  req: Request,
  { params }: { params: { itemId: string } }
) {
  const form = await req.formData();
  const file = form.get('file') as File;

  if (!file) {
    return NextResponse.json(
      { ok: false, error: 'NO_FILE' },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const uploadDir = path.join(
    process.cwd(),
    'uploads',
    params.itemId
  );

  await fs.mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, file.name);
  await fs.writeFile(filePath, buffer);

  const artifact = await prisma.artifact.create({
    data: {
      itemId: params.itemId,
      type: 'UPLOADED_DOCUMENT',
      name: file.name,
      notes: 'Submitted via Party Portal',
    },
  });

  await prisma.eventLog.create({
    data: {
      actor: 'PARTY',
      action: 'DOCUMENT_UPLOADED',
      detail: { itemId: params.itemId, artifactId: artifact.id },
    },
  });

  return NextResponse.json({ ok: true });
}