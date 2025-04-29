import { NextResponse } from 'next/server';
import crypto from 'crypto';

const PARTNER_SECRET = process.env.PARTNER_SECRET;

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

  const [partnerString, providedSignature] = token.split(':');

  if (!partnerString || !providedSignature) {
    return NextResponse.json({ success: false, message: 'Malformed token.' }, { status: 400 });
  }

  // ✅ Recalculate signature
  const expectedSignature = crypto
    .createHmac('sha256', PARTNER_SECRET)
    .update(partnerString)
    .digest('hex');

  const isValid = providedSignature === expectedSignature;

  if (isValid) {
    return NextResponse.json({
      success: true,
      message: 'Token is valid.',
      partner: partnerString, // (you might prettify this later if needed)
    });
  } else {
    return NextResponse.json({ success: false, message: 'Invalid token.' }, { status: 401 });
  }
}