import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { promises as fs } from 'fs';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  ctx: { params: { slug: string[] } }
) {
  try {
    const relPath = ctx.params.slug.join('/');
    if (relPath.includes('..')) return new NextResponse('Bad Request', { status: 400 });

    const filePath = join(process.cwd(), 'public', 'docs', relPath);
    const buf = await fs.readFile(filePath);

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${ctx.params.slug.at(-1) || 'catalogue.pdf'}"`,
        'Cache-Control': 'public, max-age=604800, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'PDF not found.' }, { status: 404 });
  }
}