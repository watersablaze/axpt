export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import crypto from 'crypto';

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString('base64url');
}

function sign(payload: object, secret: string) {
  const body = base64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export async function POST(
  req: Request,
  { params }: { params: { caseId: string } }
) {
  const secret = process.env.AXPT_PUBLIC_LINK_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: 'MISSING_AXPT_PUBLIC_LINK_SECRET' }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const ttlHours = typeof body.ttlHours === 'number' ? body.ttlHours : 72;
  const exp = Date.now() + ttlHours * 60 * 60 * 1000;

  const token = sign(
    { caseId: params.caseId, scope: 'public_verify', exp },
    secret
  );

  // Return just the token + path. (You can form the full URL in your environment.)
  return NextResponse.json({
    ok: true,
    token,
    path: `/api/axpt/public/verify?token=${token}`,
    expiresAt: new Date(exp).toISOString(),
  });
}
