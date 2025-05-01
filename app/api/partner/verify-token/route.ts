import { NextResponse } from 'next/server';
import crypto from 'crypto';

const PARTNER_SECRET = process.env.PARTNER_SECRET;

const normalizePartner = (name: string) => name.trim().replace(/\s+/g, '-');

export async function POST(req: Request) {
  if (!PARTNER_SECRET) {
    console.error('🚨 Missing PARTNER_SECRET in environment. Cannot verify tokens.');
    return NextResponse.json(
      { success: false, message: 'Server configuration error. Please contact AXPT support.' },
      { status: 500 }
    );
  }

  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ success: false, message: 'Missing token.' }, { status: 400 });
  }

  const [rawPartner, providedSignature] = token.split(':');

  if (!rawPartner || !providedSignature) {
    return NextResponse.json({ success: false, message: 'Malformed token.' }, { status: 400 });
  }

  const normalized = normalizePartner(rawPartner);
  const expectedSignature = crypto
    .createHmac('sha256', PARTNER_SECRET)
    .update(normalized)
    .digest('hex');

  const isValid = expectedSignature === providedSignature;

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