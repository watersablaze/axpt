// app/api/webhooks/resend/route.ts
import { NextResponse } from 'next/server';
import { logEmailEvent } from '@/lib/email/logEmailEvent';
import crypto from 'crypto';

const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET!;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isValidHmac(body: string, signature: string) {
  const expected = crypto
    .createHmac('sha256', RESEND_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get('resend-signature');

  if (!signature || !isValidHmac(rawBody, signature)) {
    console.error('❌ Invalid HMAC signature');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody);

    console.log('📩 Resend webhook event received:', event);

    await logEmailEvent({
      type: event.type,
      to: event.data?.to ?? 'unknown',
      from: event.data?.from ?? 'unknown',
      subject: event.data?.subject ?? '',
      messageId: event.data?.id ?? '',
      status: event.data?.status ?? 'unknown',
      eventRaw: event,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Webhook handler error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}