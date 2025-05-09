// File: app/api/partner/verify-token/route.ts

import { NextResponse } from 'next/server';
import { generateSignedToken } from '@utils/signToken';
import { normalizePartner } from '@utils/normalize';
import { getEnv } from '@utils/readEnv';

const PARTNER_SECRET = getEnv('PARTNER_SECRET');

export async function POST(req: Request) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ success: false, message: 'Missing token.' }, { status: 400 });
  }

  const cleaned = token.trim();
  const [rawPartner, providedSignature] = cleaned.split(':');

  if (!rawPartner || !providedSignature) {
    return NextResponse.json({ success: false, message: 'Malformed token.' }, { status: 400 });
  }

  const { normalized, token: expectedToken } = generateSignedToken(rawPartner, PARTNER_SECRET, false);
  const expectedSignature = expectedToken.split(':')[1];
  const isValid = expectedSignature === providedSignature;

  console.log({ rawPartner, normalized, providedSignature, expectedSignature, isValid });

  if (isValid) {
    return NextResponse.json({
      success: true,
      message: 'Token is valid.',
      partner: normalized,
    });
  } else {
    console.warn(`❌ Invalid token attempt: ${token}`);
    return NextResponse.json({ success: false, message: 'Invalid token.' }, { status: 401 });
  }
}
