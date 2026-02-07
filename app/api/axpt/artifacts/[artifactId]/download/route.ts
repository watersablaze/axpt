// app/api/axpt/artifacts/[artifactId]/download/route.ts

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  _req: Request,
  { params }: { params: { artifactId: string } }
) {
  const artifact = await prisma.artifact.findUnique({
    where: { id: params.artifactId },
  });

  if (!artifact) {
    return NextResponse.json(
      { ok: false, error: 'ARTIFACT_NOT_FOUND' },
      { status: 404 }
    );
  }

  // 🔁 Adjust this when moving to S3 / R2
  const storageRoot = process.env.AXPT_ARTIFACT_DIR ?? 'storage/artifacts';
  const filePath = path.join(storageRoot, artifact.id);

  let fileBuffer: Buffer;

  try {
    fileBuffer = await fs.readFile(filePath);
  } catch {
    return NextResponse.json(
      { ok: false, error: 'FILE_MISSING_ON_STORAGE' },
      { status: 500 }
    );
  }

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': artifact.mimeType ?? 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${artifact.name}"`,
      'Content-Length': fileBuffer.length.toString(),
    },
  });
}
