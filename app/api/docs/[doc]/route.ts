import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/utils/token';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest, context: any) {
  const { doc } = context.params as { doc: string };
  const folder = req.nextUrl.searchParams.get('folder') || 'AXPT';

  try {
    const token = req.nextUrl.searchParams.get('token');

    if (!token || typeof token !== 'string') {
      return new NextResponse('<html><body><h2>❌ Missing token</h2></body></html>', {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    const payload = verifyToken(token);
    if (!payload || !Array.isArray(payload.docs)) {
      return new NextResponse('<html><body><h2>❌ Invalid or expired token</h2></body></html>', {
        status: 401,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    if (!payload.docs.includes(doc)) {
      return new NextResponse('<html><body><h2>🚫 You are not authorized to view this document</h2></body></html>', {
        status: 403,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    const filePath = path.join(process.cwd(), 'public', 'docs', folder, doc);
    if (!fs.existsSync(filePath)) {
      return new NextResponse('<html><body><h2>📁 File not found</h2></body></html>', {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    try {
      const logPath = path.join(process.cwd(), 'app/scripts/partner-tokens/doc-access.log');
      const accessLog = `[${new Date().toISOString()}] ${payload.partner} accessed: ${doc} (folder: ${folder})\n`;
      fs.appendFileSync(logPath, accessLog);
    } catch (logErr) {
      console.warn('⚠️ Failed to write doc access log:', logErr);
    }

    const fileBuffer = fs.readFileSync(filePath);
    const contentType = path.extname(doc) === '.pdf' ? 'application/pdf' : 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${doc}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('❌ Error serving document:', err);
    return new NextResponse('<html><body><h2>🔥 Internal Server Error</h2></body></html>', {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}