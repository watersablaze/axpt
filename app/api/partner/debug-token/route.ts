// File: app/api/partner/debug-token/route.ts

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const SECRET = process.env.PARTNER_SECRET as string;

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, message: '🔒 Debugging disabled in production.' }, { status: 403 });
  }

  const { token } = await req.json();
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ success: false, message: 'Token missing or invalid.' }, { status: 400 });
  }

  const [encoded, sig] = token.split(':');
  if (!encoded || !sig) {
    return NextResponse.json({ success: false, message: 'Malformed token.' }, { status: 400 });
  }

  try {
    const rawJson = Buffer.from(encoded, 'base64').toString('utf8');
    const payload = JSON.parse(rawJson);

    const expectedSig = crypto.createHmac('sha256', SECRET).update(rawJson).digest('hex');
    const valid = sig === expectedSig;

    return NextResponse.json({
      success: true,
      valid,
      reason: valid ? '✅ Signature valid' : '❌ Signature mismatch',
      payload,
      expectedSig
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Token decode or parse failed.' }, { status: 400 });
  }
}
