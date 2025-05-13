// File: app/api/partner/debug-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getEnv } from '@/lib/utils/readEnv';

const PARTNER_SECRET = getEnv('PARTNER_SECRET');

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: 'Missing token.' }, { status: 400 });

    const [encodedPayload, providedSig] = token.split(':');
    if (!encodedPayload || !providedSig) {
      return NextResponse.json({ error: 'Malformed token structure.' }, { status: 400 });
    }

    let decodedPayload = '';
    try {
      decodedPayload = Buffer.from(encodedPayload, 'base64').toString('utf8');
    } catch (err) {
      return NextResponse.json({ error: 'Failed to decode base64 payload.', details: err }, { status: 400 });
    }

    let parsedPayload;
    try {
      parsedPayload = JSON.parse(decodedPayload);
    } catch (err) {
      return NextResponse.json({ error: 'Failed to parse JSON payload.', decoded: decodedPayload }, { status: 400 });
    }

    const expectedSig = crypto.createHmac('sha256', PARTNER_SECRET).update(decodedPayload).digest('hex');

    return NextResponse.json({
      decodedPayload,
      parsedPayload,
      providedSig,
      expectedSig,
      isValid: expectedSig === providedSig,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Unexpected error', details: err }, { status: 500 });
  }
}