// 📁 app/api/docs/[doc]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/token/verifyToken';
import { allowedDocEnum } from '@/lib/token/tokenSchema';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  const requestedDoc = url.pathname.split('/').pop()?.replace('.pdf', '');

  if (!token || !requestedDoc) {
    return NextResponse.json({ error: 'Missing token or document name' }, { status: 400 });
  }

  const result = await verifyToken(token);

  if (!result.valid || !result.payload) {
    return NextResponse.json({ error: result.error ?? 'Invalid or expired token' }, { status: 403 });
  }

  const { docs } = result.payload;

  // Validate requestedDoc is a known enum value
  const isAllowed = allowedDocEnum.options.includes(requestedDoc as any);
  if (!isAllowed) {
    return NextResponse.json({ error: 'Invalid document request' }, { status: 403 });
  }

  // Validate access permission
  const isAuthorized = docs.includes(requestedDoc as (typeof allowedDocEnum.options)[number]);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Document not permitted in token' }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    filename: `${requestedDoc}.pdf`,
    folder: 'AXPT',
  });
}